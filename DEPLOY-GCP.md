# Deploying MADEM Real Estate to Google Cloud (Cloud Run)

> This is the **from-scratch setup** guide. For day-to-day deploy and management of
> the already-running stack (deploy one service, view logs, rotate secrets, change
> lookups, roll back, costs, troubleshooting), see [deploy/OPERATIONS.md](deploy/OPERATIONS.md).

Three apps, all on **Cloud Run**, backed by **Cloud SQL (PostgreSQL)** and **Cloud Storage**.
Each frontend proxies `/api` to the backend itself, so the session cookie stays
first-party and **no external load balancer is required**.

```
www.<domain>   → Cloud Run: web   (nginx: static + /api proxy)  ─┐
crm.<domain>   → Cloud Run: crm   (Next.js + /api rewrite)      ─┤→ Cloud Run: backend (Fastify)
                                                                  │        │         │
                                                          Cloud SQL   Cloud Storage  Vertex AI (Gemini)
```

> All three frontends call the backend; only the backend talks to the DB and bucket.
> You *can* keep the backend public (simplest) or set its ingress to internal + a
> Serverless VPC connector later. Start public.

## TL;DR - scripted path

Everything below is automated by [`deploy/gcp-setup.sh`](deploy/gcp-setup.sh)
(idempotent; generated secrets land in Secret Manager and are reused on re-run):

```bash
cp deploy/config.env.example deploy/config.env   # edit PROJECT_ID, REGION, ...
gcloud auth login                                 # once
./deploy/gcp-setup.sh                             # full run, or a single phase:
./deploy/gcp-setup.sh backend                     #   apis|sql|storage|secrets|backend|seed|crm|web|cors
```

It still needs `gcloud` authenticated and a billing-enabled project, and the first
Cloud SQL create takes ~10 min. The sections below explain what each phase does and
are the reference if you'd rather run the commands by hand.

---

## 0. Variables (edit, then `source` this block)

```bash
export PROJECT_ID=madem-real-estate
export REGION=europe-west3              # Frankfurt; pick the closest region
export REPO=madem                       # Artifact Registry repo
export SQL_INSTANCE=madem-pg
export DB_NAME=madem_crm
export DB_USER=madem
export BUCKET=${PROJECT_ID}-media

gcloud config set project "$PROJECT_ID"
gcloud config set run/region "$REGION"
```

Enable the APIs:

```bash
gcloud services enable \
  run.googleapis.com sqladmin.googleapis.com artifactregistry.googleapis.com \
  cloudbuild.googleapis.com secretmanager.googleapis.com storage.googleapis.com \
  aiplatform.googleapis.com
```

Create the image repo:

```bash
gcloud artifacts repositories create "$REPO" \
  --repository-format=docker --location="$REGION"
```

---

## 1. Cloud SQL (PostgreSQL 16)

```bash
gcloud sql instances create "$SQL_INSTANCE" \
  --database-version=POSTGRES_16 --edition=ENTERPRISE \
  --tier=db-custom-1-3840 --region="$REGION" --storage-auto-increase

gcloud sql databases create "$DB_NAME" --instance="$SQL_INSTANCE"

# Pick a strong password and remember it
export DB_PASS='CHANGE-ME-strong-password'
gcloud sql users create "$DB_USER" --instance="$SQL_INSTANCE" --password="$DB_PASS"

# Instance connection name, e.g. madem-real-estate:europe-west3:madem-pg
export SQL_CONN=$(gcloud sql instances describe "$SQL_INSTANCE" \
  --format='value(connectionName)')
```

Cloud Run connects over a Unix socket via the built-in connector, so the
`DATABASE_URL` uses `host=/cloudsql/<conn>` instead of a TCP host:

```bash
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@/${DB_NAME}?host=/cloudsql/${SQL_CONN}"
```

---

## 2. Cloud Storage (S3-compatible, replaces MinIO)

The backend's S3 client (`backend/src/lib/s3.ts`) talks to any S3 endpoint, so we
point it at GCS's interoperability API with HMAC keys.

**Two buckets**: a public media bucket for `properties/*` + `avatars/*`, and a
**private** docs bucket for `documents/*`. GCS forbids IAM *conditions* on `allUsers`
(unlike an S3 prefix policy), so we can't scope public-read to a prefix within one
bucket - hence the split. The backend routes `documents/` keys to `S3_DOCS_BUCKET`
(see `backend/src/lib/s3.ts`).

```bash
export DOCS_BUCKET="${PROJECT_ID}-docs"

gcloud storage buckets create "gs://${BUCKET}" \
  --location="$REGION" --uniform-bucket-level-access
gcloud storage buckets create "gs://${DOCS_BUCKET}" \
  --location="$REGION" --uniform-bucket-level-access

# HMAC key for the S3 (interop) API - tie it to a dedicated service account.
gcloud iam service-accounts create madem-storage \
  --display-name="MADEM storage + runtime"
export SA_STORAGE="madem-storage@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" \
  --member="serviceAccount:${SA_STORAGE}" --role="roles/storage.objectAdmin"
gcloud storage buckets add-iam-policy-binding "gs://${DOCS_BUCKET}" \
  --member="serviceAccount:${SA_STORAGE}" --role="roles/storage.objectAdmin"

gcloud storage hmac create "$SA_STORAGE"   # prints ACCESS_ID and SECRET - save them
export S3_ACCESS_KEY_ID=GOOG...
export S3_SECRET_ACCESS_KEY=...
```

Public read on the **media** bucket only. `legacyObjectReader` grants read-by-key
without `storage.objects.list`, so the bucket can't be publicly enumerated. The docs
bucket gets no `allUsers` binding - documents are reachable only via presigned GET.

```bash
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" \
  --member="allUsers" --role="roles/storage.legacyObjectReader"
```

Storage env for the backend:

```bash
export S3_ENDPOINT=https://storage.googleapis.com
export S3_REGION=auto
export S3_BUCKET=$BUCKET
export S3_DOCS_BUCKET=$DOCS_BUCKET
export S3_PUBLIC_URL=https://storage.googleapis.com/${BUCKET}
```

> Note: the app's best-effort `ensureBucket()` bucket-policy call is a no-op on GCS
> (interop has no PutBucketPolicy) - that's why we set public access via IAM above.

---

## 3. Secrets

```bash
gen() { python -c "import secrets;print(secrets.token_urlsafe(48))"; }

printf '%s' "$(gen)"                 | gcloud secrets create JWT_SECRET --data-file=-
printf '%s' "$(gen)"                 | gcloud secrets create COOKIE_SECRET --data-file=-
printf '%s' "$DB_PASS"               | gcloud secrets create DB_PASS --data-file=-
printf '%s' "$DATABASE_URL"          | gcloud secrets create DATABASE_URL --data-file=-
printf '%s' "$S3_SECRET_ACCESS_KEY"  | gcloud secrets create S3_SECRET --data-file=-
```

---

## 4. Deploy the backend

`gcloud run deploy --source` builds the image from `backend/Dockerfile` (which runs
migrations on start) and pushes it to Artifact Registry.

```bash
gcloud run deploy madem-backend \
  --source ./backend \
  --region "$REGION" \
  --allow-unauthenticated \
  --add-cloudsql-instances "$SQL_CONN" \
  --min-instances 1 \
  --service-account "$SA_STORAGE" \
  --set-env-vars "NODE_ENV=production,COOKIE_SECURE=true,COOKIE_NAME=madem_session" \
  --set-env-vars "S3_ENDPOINT=${S3_ENDPOINT},S3_REGION=auto,S3_BUCKET=${S3_BUCKET},S3_PUBLIC_URL=${S3_PUBLIC_URL},S3_ACCESS_KEY_ID=${S3_ACCESS_KEY_ID}" \
  --set-env-vars "GEMINI_USE_VERTEX=true,GOOGLE_CLOUD_PROJECT=${PROJECT_ID},GCP_LOCATION=${REGION}" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,COOKIE_SECRET=COOKIE_SECRET:latest,S3_SECRET_ACCESS_KEY=S3_SECRET:latest" \
  --set-env-vars "ADMIN_EMAIL=admin@madem.com,ADMIN_NAME=MADEM Admin" \
  --set-secrets "ADMIN_PASSWORD=DB_PASS:latest"   # reuse or make a dedicated secret

export BACKEND_URL=$(gcloud run services describe madem-backend --format='value(status.url)')
export BACKEND_HOST=${BACKEND_URL#https://}
```

Notes:
- **`--min-instances 1`** keeps the in-process reminder cron (`node-cron`) alive;
  Cloud Run would otherwise scale to zero and the daily scan wouldn't fire.
- **Vertex AI for Gemini**: grant the service account the role, no API key needed:
  ```bash
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SA_STORAGE}" --role="roles/aiplatform.user"
  ```
- **CORS**: set after the frontends have URLs (step 7).

### Seed the admin user + lookups (one-off)

The Dockerfile runs `migration:run` automatically. Run the seed once against the
deployed DB - easiest via a one-off Cloud Run **job** using the same image:

```bash
IMAGE=$(gcloud run services describe madem-backend --format='value(spec.template.spec.containers[0].image)')
gcloud run jobs create madem-seed \
  --image "$IMAGE" --region "$REGION" \
  --add-cloudsql-instances "$SQL_CONN" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest" \
  --set-env-vars "ADMIN_EMAIL=admin@madem.com,ADMIN_NAME=MADEM Admin" \
  --set-secrets "ADMIN_PASSWORD=DB_PASS:latest" \
  --command node --args dist/seed/seed.js     # seed compiles to dist/ in the image
gcloud run jobs execute madem-seed --region "$REGION" --wait
```

---

## 5. Deploy the CRM (Next.js)

```bash
gcloud run deploy madem-crm \
  --source ./crm \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-build-env-vars "NEXT_PUBLIC_SITE_URL=https://www.<your-domain>" \
  --set-env-vars "API_URL=${BACKEND_URL}"

export CRM_URL=$(gcloud run services describe madem-crm --format='value(status.url)')
```

`NEXT_PUBLIC_SITE_URL` is inlined at build time (the "Share property" links), so it's
passed as a **build** env var; `API_URL` (the Next rewrite target) is a runtime var.

---

## 6. Deploy the web (public site)

The nginx container proxies `/api` → backend, so it needs the backend URL + host:

```bash
gcloud run deploy madem-web \
  --source ./web \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars "BACKEND_URL=${BACKEND_URL},BACKEND_HOST=${BACKEND_HOST}"

export WEB_URL=$(gcloud run services describe madem-web --format='value(status.url)')
```

---

## 7. Wire CORS + verify

Point the backend's CORS allowlist at the real frontend origins:

```bash
gcloud run services update madem-backend \
  --set-env-vars "CORS_ORIGINS=${CRM_URL},${WEB_URL}"
# (after custom domains are mapped, add https://www.<domain>,https://crm.<domain>)
```

Smoke test:

```bash
curl -s "${WEB_URL}/api/public/properties?limit=1" | head -c 300   # via web's proxy
curl -s "${BACKEND_URL}/docs/json" | head -c 200                    # OpenAPI
```

Log in to the CRM at `$CRM_URL` with the admin credentials from the seed step.

---

## 8. Custom domains (optional)

```bash
gcloud run domain-mappings create --service madem-web --domain www.<your-domain>
gcloud run domain-mappings create --service madem-crm --domain crm.<your-domain>
```

Add the printed DNS records at your registrar, then update `CORS_ORIGINS` and
`NEXT_PUBLIC_SITE_URL` (rebuild crm) to the final HTTPS domains.

---

## Redeploys

Re-run the relevant `gcloud run deploy --source ./<app>` - it rebuilds and rolls out
a new revision. For schema changes, the backend image runs pending migrations on
boot; with `--min-instances 1` and a single rollout this is safe. If you later scale
to several always-on instances, move migrations into a dedicated Cloud Run job
(`migration:run`) run before the rollout instead of on container start.

## Rough monthly cost (low traffic)

Cloud SQL `db-custom-1-3840` (~$50, the floor) + 1 always-on backend instance
(~$15–25) dominate. CRM/web scale to zero. Storage + egress are negligible early on.
To trim: use Cloud SQL `db-f1-micro`/shared-core for staging, or move the cron to
Cloud Scheduler and let the backend scale to zero too.
```
