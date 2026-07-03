# Operations runbook (GCP)

How to deploy and manage the live Madem Real Estate stack on Google Cloud. This is
the day-to-day companion to [DEPLOY-GCP.md](../DEPLOY-GCP.md) (which covers the
first-time, from-scratch setup). If you are an AI agent or a new dev: read this top
to bottom once, then use it as a lookup.

## The deployed stack at a glance

| Thing | Value |
|---|---|
| GCP project | `madem-real-estate` |
| Region | `europe-west3` (Frankfurt) |
| Cloud Run services | `madem-backend`, `madem-crm`, `madem-web` |
| Backend URL | https://madem-backend-957305376378.europe-west3.run.app |
| CRM URL | https://madem-crm-fu46t4xszq-ey.a.run.app |
| Web URL | https://madem-web-fu46t4xszq-ey.a.run.app |
| Cloud SQL | instance `madem-pg` (`db-f1-micro`), DB `madem_crm`, user `madem` |
| SQL connection name | `madem-real-estate:europe-west3:madem-pg` |
| Buckets | `madem-real-estate-media` (public read), `madem-real-estate-docs` (private) |
| Runtime service account | `madem-storage@madem-real-estate.iam.gserviceaccount.com` |
| Scheduler job | `madem-reminders` (daily 07:00 Europe/Tirane) |
| Seed job | `madem-seed` (Cloud Run job, one-off) |

All app secrets live in **Secret Manager**: `DATABASE_URL`, `DB_PASS`, `JWT_SECRET`,
`COOKIE_SECRET`, `ADMIN_PASSWORD`, `S3_ACCESS_KEY_ID`, `S3_SECRET`, `CRON_SECRET`.

## The deploy script is the source of truth

Everything is driven by [`deploy/gcp-setup.sh`](gcp-setup.sh), a phase-based,
idempotent script. Config lives in `deploy/config.env` (gitignored; copy from
`config.env.example`). Run a single phase or the whole thing:

```bash
./deploy/gcp-setup.sh <phase>     # apis|sql|storage|secrets|backend|seed|crm|web|cors|cron
./deploy/gcp-setup.sh             # = all phases, in order
```

Phases are safe to re-run: each checks "does this exist?" before creating, and
generated secrets are reused from Secret Manager. **Prefer the script over ad-hoc
`gcloud` commands** so the repo stays the source of truth. If you must run a manual
`gcloud` command to fix something live, fold the fix back into the matching phase.

### Hard rule: never edit the script while a phase is running
Bash reads scripts by byte offset as it executes. Editing `gcp-setup.sh` while a
long phase runs in the background shifts the file and corrupts later lines. Wait for
the background task to finish, then edit.

## Common tasks

### Deploy code changes to one service
```bash
./deploy/gcp-setup.sh backend     # rebuilds image, runs migrations on boot, rolls out
./deploy/gcp-setup.sh crm         # rebuilds via Cloud Build (build-args), deploys
./deploy/gcp-setup.sh web         # rebuilds the static site + nginx image, deploys
```
Each `--source`/Cloud Build step takes ~3-4 min. Typecheck first to fail fast:
`cd backend && npm run typecheck` (same for `crm`, `web`).

### See the admin password
```bash
gcloud secrets versions access latest --secret=ADMIN_PASSWORD
```
Log in to the CRM with `admin@madem.com` + that value.

### Change the admin email or password
The seed only *creates* the admin when missing, so to update an existing one use the
`madem-reset-admin` job (script `backend/src/scripts/reset-admin-password.ts`), which
finds the admin and sets its email + password from `ADMIN_EMAIL` / `ADMIN_PASSWORD`:
```bash
# 1. set the new values
#    edit ADMIN_EMAIL in deploy/config.env, then:
printf '%s' 'NEW_PASSWORD' | gcloud secrets versions add ADMIN_PASSWORD --data-file=-
# 2. rebuild so the image has the script + new email env
./deploy/gcp-setup.sh backend
# 3. deploy + run the one-off reset job
IMG=$(gcloud run services describe madem-backend --region=europe-west3 --format='value(spec.template.spec.containers[0].image)')
gcloud run jobs deploy madem-reset-admin --image "$IMG" --region europe-west3 \
  --service-account madem-storage@madem-real-estate.iam.gserviceaccount.com \
  --set-cloudsql-instances madem-real-estate:europe-west3:madem-pg \
  --set-env-vars 'ADMIN_EMAIL=NEW_EMAIL,ADMIN_NAME=MADEM Admin' \
  --set-secrets 'DATABASE_URL=DATABASE_URL:latest,ADMIN_PASSWORD=ADMIN_PASSWORD:latest,JWT_SECRET=JWT_SECRET:latest,COOKIE_SECRET=COOKIE_SECRET:latest' \
  --command node --args dist/scripts/reset-admin-password.js
gcloud run jobs execute madem-reset-admin --region europe-west3 --wait
```
Or, once logged in, just change it in the CRM Users screen.

### Update an environment variable on a service
Use `--update-env-vars` (NOT `--set-env-vars`, which replaces the whole list and
wipes the others). For values containing commas (e.g. `CORS_ORIGINS`), use the
`^@^` delimiter so the comma stays inside the value:
```bash
gcloud run services update madem-backend --region europe-west3 \
  --update-env-vars "^@^CORS_ORIGINS=https://a,https://b"
```

### Add or rotate a secret
```bash
printf '%s' "NEW_VALUE" | gcloud secrets versions add JWT_SECRET --data-file=-
```
Cloud Run pins `:latest` at **revision creation time**, so after adding a new
version you must redeploy the service (or `gcloud run services update ... --update-secrets NAME=NAME:latest`) for it to take effect. Note: every secret mounted on the
backend must be listed in `phase_backend`'s `--set-secrets` (that flag is
authoritative and replaces the full secret list).

### View logs
```bash
# Backend app logs (errors)
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="madem-backend" AND severity>=ERROR' --limit=30 --freshness=1h --format="value(textPayload,jsonPayload.message)"

# HTTP status for a specific path
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="madem-backend" AND httpRequest.requestUrl:"run-reminders"' --limit=10 --freshness=1h --format="value(timestamp,httpRequest.status)"

# Cloud Build history (note: builds are REGIONAL)
gcloud builds list --region=europe-west3 --limit=5
```

### Roll back a bad deploy
Cloud Run keeps every revision. Point traffic back to a known-good one:
```bash
gcloud run revisions list --service=madem-backend --region=europe-west3
gcloud run services update-traffic madem-backend --region=europe-west3 --to-revisions=madem-backend-00009-jzh=100
```

### Database access (psql)
```bash
gcloud sql connect madem-pg --user=madem --database=madem_crm   # whitelists your IP, prompts for password
```
Password is in Secret Manager (`DB_PASS`). For schema changes, prefer a TypeORM
migration in `backend/src/migrations/` (the backend runs `migration:run` on boot).

## Lookups and seed data (e.g. heating types)

Heating types, document types, and the admin user come from
[`backend/src/seed/seed.ts`](../backend/src/seed/seed.ts). The canonical list of
heating keys is in [`backend/src/schemas/enums.ts`](../backend/src/schemas/enums.ts).
The seed is idempotent (upsert on key) and deactivates any heating type no longer in
the key set, so it is safe to re-run.

To change heating options:
1. Edit `HEATING_KEYS` (order = display order) and `heatingLabels` (en/sq/de).
2. `cd backend && npm run typecheck`.
3. `./deploy/gcp-setup.sh backend` (rebuilds the image, which bundles `dist/seed/seed.js`).
4. `./deploy/gcp-setup.sh seed` (runs the one-off job against the live DB).
5. Verify: `curl -s "$BACKEND/api/lookups/heating-types"`.

The CRM property form reads these options live via `useHeatingTypes()`, so no
frontend redeploy is needed for lookup changes.

## Reminders cron (Cloud Scheduler)

The reminder scan runs via Cloud Scheduler hitting `POST /internal/run-reminders`
(guarded by the `CRON_SECRET` header) so the backend can scale to zero. Manage it:
```bash
gcloud scheduler jobs run    madem-reminders --location=europe-west3   # trigger now
gcloud scheduler jobs pause  madem-reminders --location=europe-west3
gcloud scheduler jobs describe madem-reminders --location=europe-west3
```
Change cadence by setting `CRON_SCHEDULE` / `CRON_TZ` in `config.env` and re-running
`./deploy/gcp-setup.sh cron`.

## Cost and the scale-to-zero knob

Steady state is ~$12-18/mo, dominated by the Cloud SQL `db-f1-micro` instance.
Everything else scales to zero. The reminder cron is free (Cloud Scheduler) because
the backend does not stay warm. Levers:
- `MIN_INSTANCES` in `config.env`: `0` = scale to zero (current). Set `1` only if you
  want the backend always warm (~$8-15/mo more) - not needed now that the cron is
  external.
- DB tier (`SQL_TIER`): `db-f1-micro` (~$9/mo) is staging. Bump when traffic needs it.

## Custom domains (when ready)

```bash
gcloud run domain-mappings create --service madem-web --domain www.<domain> --region europe-west3
gcloud run domain-mappings create --service madem-crm --domain crm.<domain> --region europe-west3
```
Then add the printed DNS records, set `PUBLIC_SITE_URL` in `config.env`, and re-run
`./deploy/gcp-setup.sh crm` (rebuilds CRM share-links) and `./deploy/gcp-setup.sh cors`
(updates the backend allowlist + bucket CORS).

## Troubleshooting (issues actually hit during setup)

- **"container failed to start and listen on PORT=8080"**: the app crashed on boot.
  Read the revision logs (above). Causes seen: bad `DATABASE_URL` (config validation),
  missing IAM role (Cloud SQL / Secret Manager), or a failing migration.
- **403 on Cloud SQL connect / Secret access**: the runtime SA `madem-storage` is
  missing a role. It needs `roles/cloudsql.client`, `roles/secretmanager.secretAccessor`,
  `roles/storage.objectAdmin` (both buckets), `roles/aiplatform.user`. The `storage`
  phase grants all of these.
- **CRM `/api` returns 500 / proxies to `localhost:4000`**: `next.config` rewrites bake
  the backend URL at BUILD time, and `gcloud run deploy --source` does NOT pass build
  env vars to Dockerfile ARGs. The CRM must build via [`crm/cloudbuild.yaml`](../crm/cloudbuild.yaml)
  with `--build-arg API_URL=...` (the `crm` phase already does this).
- **Secret comparison fails despite matching values**: secrets generated on Windows
  Git Bash can carry a trailing `\r`. The generator now strips it; the cron endpoint
  trims before comparing. If you hit this, check the raw bytes:
  `gcloud secrets versions access latest --secret=NAME | od -c | tail`.
- **`gcloud builds list` is empty**: builds are regional. Add `--region=europe-west3`.
- **Storage public access**: GCS forbids IAM conditions on `allUsers`, so we use two
  buckets (public media + private docs) instead of a prefix-scoped policy. Documents
  are only reachable via presigned GET.
