#!/usr/bin/env bash
#
# One-command deploy of MADEM Real Estate to Google Cloud Run.
# Idempotent: safe to re-run. Generated secrets/keys are stored in Secret Manager
# on first run and reused after, so you never have to copy/paste them.
#
# Usage:
#   cp deploy/config.env.example deploy/config.env   # edit PROJECT_ID, REGION, ...
#   ./deploy/gcp-setup.sh                              # run the whole thing
#   ./deploy/gcp-setup.sh backend                      # or one phase: sql|storage|secrets|backend|seed|crm|web|cors|cron
#
# Requires: gcloud (authenticated, `gcloud auth login`), openssl, bash 4+.

set -euo pipefail

# ── locate repo + load config ────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG="$SCRIPT_DIR/config.env"

if [[ ! -f "$CONFIG" ]]; then
  echo "✗ $CONFIG not found. Run: cp deploy/config.env.example deploy/config.env  (then edit it)" >&2
  exit 1
fi
# shellcheck disable=SC1090
source "$CONFIG"

: "${PROJECT_ID:?set in config.env}"
: "${REGION:?set in config.env}"
BUCKET="${PROJECT_ID}-media"
DOCS_BUCKET="${PROJECT_ID}-docs"
IMAGE_BASE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}"

log()  { printf '\n\033[1;34m▶ %s\033[0m\n' "$*"; }
ok()   { printf '  \033[0;32m✓ %s\033[0m\n' "$*"; }
skip() { printf '  \033[0;90m• %s\033[0m\n' "$*"; }

gcloud config set project "$PROJECT_ID" >/dev/null
gcloud config set run/region "$REGION" >/dev/null

# ── helpers ──────────────────────────────────────────────────────────────────
secret_exists() { gcloud secrets describe "$1" >/dev/null 2>&1; }
secret_get()    { gcloud secrets versions access latest --secret="$1"; }
secret_put() {  # name value  - create if missing, else add a new version
  local name=$1 val=$2
  if secret_exists "$name"; then
    printf '%s' "$val" | gcloud secrets versions add "$name" --data-file=- >/dev/null
  else
    printf '%s' "$val" | gcloud secrets create "$name" --data-file=- >/dev/null
  fi
}
secret_ensure_generated() {  # name - create with a random value only if missing; echo value
  local name=$1
  if ! secret_exists "$name"; then
    printf '%s' "$(openssl rand -base64 36 | tr -d '\n\r/+=' | head -c 48)" \
      | gcloud secrets create "$name" --data-file=- >/dev/null
  fi
  secret_get "$name"
}

# ─────────────────────────────────────────────────────────────────────────────
phase_apis() {
  log "Enabling APIs + Artifact Registry"
  gcloud services enable \
    run.googleapis.com sqladmin.googleapis.com artifactregistry.googleapis.com \
    cloudbuild.googleapis.com secretmanager.googleapis.com storage.googleapis.com \
    aiplatform.googleapis.com cloudscheduler.googleapis.com >/dev/null
  ok "APIs enabled"
  if gcloud artifacts repositories describe "$REPO" --location="$REGION" >/dev/null 2>&1; then
    skip "Artifact Registry repo '$REPO' exists"
  else
    gcloud artifacts repositories create "$REPO" --repository-format=docker --location="$REGION" >/dev/null
    ok "Created Artifact Registry repo '$REPO'"
  fi
}

phase_sql() {
  log "Cloud SQL (PostgreSQL 16)"
  if gcloud sql instances describe "$SQL_INSTANCE" >/dev/null 2>&1; then
    skip "Instance '$SQL_INSTANCE' exists"
  else
    skip "Creating instance '$SQL_INSTANCE' (this takes ~10 min)…"
    gcloud sql instances create "$SQL_INSTANCE" \
      --database-version=POSTGRES_16 --edition=ENTERPRISE \
      --tier="${SQL_TIER:-db-custom-1-3840}" --region="$REGION" --storage-auto-increase >/dev/null
    ok "Instance created"
  fi

  SQL_CONN="$(gcloud sql instances describe "$SQL_INSTANCE" --format='value(connectionName)')"

  if gcloud sql databases describe "$DB_NAME" --instance="$SQL_INSTANCE" >/dev/null 2>&1; then
    skip "Database '$DB_NAME' exists"
  else
    gcloud sql databases create "$DB_NAME" --instance="$SQL_INSTANCE" >/dev/null
    ok "Database '$DB_NAME' created"
  fi

  local db_pass; db_pass="$(secret_ensure_generated DB_PASS)"
  # create the user if absent, else (re)assert the password we hold in Secret Manager
  if gcloud sql users list --instance="$SQL_INSTANCE" --format='value(name)' | grep -qx "$DB_USER"; then
    gcloud sql users set-password "$DB_USER" --instance="$SQL_INSTANCE" --password="$db_pass" >/dev/null
    skip "User '$DB_USER' password synced"
  else
    gcloud sql users create "$DB_USER" --instance="$SQL_INSTANCE" --password="$db_pass" >/dev/null
    ok "User '$DB_USER' created"
  fi

  # Cloud Run reaches Cloud SQL via a unix socket - host=/cloudsql/<conn>
  local db_url="postgresql://${DB_USER}:${db_pass}@/${DB_NAME}?host=/cloudsql/${SQL_CONN}"
  secret_put DATABASE_URL "$db_url"
  ok "DATABASE_URL stored (conn: $SQL_CONN)"
}

phase_storage() {
  log "Cloud Storage (S3-compatible bucket)"
  local sa="madem-storage@${PROJECT_ID}.iam.gserviceaccount.com"

  if gcloud storage buckets describe "gs://${BUCKET}" >/dev/null 2>&1; then
    skip "Bucket gs://${BUCKET} exists"
  else
    gcloud storage buckets create "gs://${BUCKET}" --location="$REGION" --uniform-bucket-level-access >/dev/null
    ok "Bucket gs://${BUCKET} created"
  fi

  if gcloud iam service-accounts describe "$sa" >/dev/null 2>&1; then
    skip "Service account madem-storage exists"
  else
    gcloud iam service-accounts create madem-storage --display-name="MADEM storage + runtime" >/dev/null
    ok "Service account created"
  fi

  # Private docs bucket - property documents never go in the public bucket.
  if gcloud storage buckets describe "gs://${DOCS_BUCKET}" >/dev/null 2>&1; then
    skip "Docs bucket gs://${DOCS_BUCKET} exists"
  else
    gcloud storage buckets create "gs://${DOCS_BUCKET}" --location="$REGION" --uniform-bucket-level-access >/dev/null
    ok "Private docs bucket gs://${DOCS_BUCKET} created"
  fi

  gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" \
    --member="serviceAccount:${sa}" --role="roles/storage.objectAdmin" >/dev/null
  gcloud storage buckets add-iam-policy-binding "gs://${DOCS_BUCKET}" \
    --member="serviceAccount:${sa}" --role="roles/storage.objectAdmin" >/dev/null
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${sa}" --role="roles/aiplatform.user" --condition=None >/dev/null
  # Cloud Run mounts DATABASE_URL/JWT_SECRET/... from Secret Manager as this SA.
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${sa}" --role="roles/secretmanager.secretAccessor" --condition=None >/dev/null
  # ...and opens the Cloud SQL socket as this SA.
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${sa}" --role="roles/cloudsql.client" --condition=None >/dev/null
  ok "IAM: objectAdmin (both buckets) + aiplatform.user + secretAccessor + cloudsql.client"

  # Public read on the media bucket. GCS forbids conditions on allUsers, so the
  # whole media bucket is readable-by-key; legacyObjectReader omits list, so the
  # bucket can't be enumerated. Documents are isolated in the private bucket above.
  gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" \
    --member="allUsers" --role="roles/storage.legacyObjectReader" >/dev/null
  ok "Public read (by key, no listing) on gs://${BUCKET}"

  # HMAC key for the S3 interop API - generate once, store both halves.
  if secret_exists S3_ACCESS_KEY_ID && secret_exists S3_SECRET; then
    skip "HMAC key already stored"
  else
    local out access secret
    out="$(gcloud storage hmac create "$sa" --format='value(metadata.accessId,secret)')"
    access="$(echo "$out" | awk '{print $1}')"
    secret="$(echo "$out" | awk '{print $2}')"
    secret_put S3_ACCESS_KEY_ID "$access"
    secret_put S3_SECRET "$secret"
    ok "HMAC key created + stored"
  fi
}

phase_secrets() {
  log "App secrets (JWT, cookie, admin password)"
  secret_ensure_generated JWT_SECRET    >/dev/null && ok "JWT_SECRET"
  secret_ensure_generated COOKIE_SECRET >/dev/null && ok "COOKIE_SECRET"
  secret_ensure_generated ADMIN_PASSWORD >/dev/null && ok "ADMIN_PASSWORD"
  secret_ensure_generated CRON_SECRET   >/dev/null && ok "CRON_SECRET"
}

phase_backend() {
  log "Deploy backend (Fastify) → Cloud Run"
  SQL_CONN="$(gcloud sql instances describe "$SQL_INSTANCE" --format='value(connectionName)')"
  local sa="madem-storage@${PROJECT_ID}.iam.gserviceaccount.com"
  local s3_access; s3_access="$(secret_get S3_ACCESS_KEY_ID)"
  local s3_public="https://storage.googleapis.com/${BUCKET}"

  gcloud run deploy madem-backend \
    --source "$ROOT_DIR/backend" \
    --region "$REGION" \
    --allow-unauthenticated \
    --add-cloudsql-instances "$SQL_CONN" \
    --min-instances "${MIN_INSTANCES:-1}" \
    --memory 512Mi \
    --service-account "$sa" \
    --set-env-vars "NODE_ENV=production,COOKIE_SECURE=true,COOKIE_NAME=madem_session" \
    --set-env-vars "S3_ENDPOINT=https://storage.googleapis.com,S3_REGION=auto,S3_BUCKET=${BUCKET},S3_DOCS_BUCKET=${DOCS_BUCKET},S3_PUBLIC_URL=${s3_public},S3_ACCESS_KEY_ID=${s3_access}" \
    --set-env-vars "GEMINI_USE_VERTEX=true,GOOGLE_CLOUD_PROJECT=${PROJECT_ID},GCP_LOCATION=${REGION}" \
    --set-env-vars "ADMIN_EMAIL=${ADMIN_EMAIL},ADMIN_NAME=${ADMIN_NAME}" \
    --set-secrets "DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,COOKIE_SECRET=COOKIE_SECRET:latest,S3_SECRET_ACCESS_KEY=S3_SECRET:latest,ADMIN_PASSWORD=ADMIN_PASSWORD:latest,CRON_SECRET=CRON_SECRET:latest" \
    >/dev/null
  BACKEND_URL="$(gcloud run services describe madem-backend --format='value(status.url)')"
  ok "Backend live: $BACKEND_URL"
}

phase_seed() {
  log "Seed admin user + lookups (one-off job)"
  SQL_CONN="$(gcloud sql instances describe "$SQL_INSTANCE" --format='value(connectionName)')"
  local image
  image="$(gcloud run services describe madem-backend --format='value(spec.template.spec.containers[0].image)')"
  gcloud run jobs deploy madem-seed \
    --image "$image" --region "$REGION" \
    --service-account "madem-storage@${PROJECT_ID}.iam.gserviceaccount.com" \
    --set-cloudsql-instances "$SQL_CONN" \
    --set-env-vars "ADMIN_EMAIL=${ADMIN_EMAIL},ADMIN_NAME=${ADMIN_NAME}" \
    --set-secrets "DATABASE_URL=DATABASE_URL:latest,ADMIN_PASSWORD=ADMIN_PASSWORD:latest,JWT_SECRET=JWT_SECRET:latest,COOKIE_SECRET=COOKIE_SECRET:latest" \
    --command node --args dist/seed/seed.js >/dev/null
  gcloud run jobs execute madem-seed --region "$REGION" --wait >/dev/null
  ok "Seed complete"
}

phase_crm() {
  log "Deploy CRM (Next.js) → Cloud Run"
  BACKEND_URL="$(gcloud run services describe madem-backend --format='value(status.url)')"
  local site="${PUBLIC_SITE_URL:-}"
  if [[ -z "$site" ]]; then
    # fall back to the web service URL if it already exists, else a placeholder
    site="$(gcloud run services describe madem-web --format='value(status.url)' 2>/dev/null || echo http://localhost:5173)"
  fi
  # next.config rewrites() bakes the /api destination at BUILD time, and
  # `gcloud run deploy --source` does not forward build env vars to Dockerfile
  # ARGs — so build explicitly with --build-arg via Cloud Build, then deploy.
  local image="${IMAGE_BASE}/madem-crm:latest"
  gcloud builds submit "$ROOT_DIR/crm" --region "$REGION" \
    --config "$ROOT_DIR/crm/cloudbuild.yaml" \
    --substitutions "_API_URL=${BACKEND_URL},_SITE_URL=${site},_IMAGE=${image}" >/dev/null
  gcloud run deploy madem-crm \
    --image "$image" --region "$REGION" --allow-unauthenticated >/dev/null
  CRM_URL="$(gcloud run services describe madem-crm --format='value(status.url)')"
  ok "CRM live: $CRM_URL"
}

phase_web() {
  log "Deploy web (public site) → Cloud Run"
  BACKEND_URL="$(gcloud run services describe madem-backend --format='value(status.url)')"
  local backend_host="${BACKEND_URL#https://}"
  gcloud run deploy madem-web \
    --source "$ROOT_DIR/web" \
    --region "$REGION" \
    --allow-unauthenticated \
    --set-env-vars "BACKEND_URL=${BACKEND_URL},BACKEND_HOST=${backend_host}" \
    >/dev/null
  WEB_URL="$(gcloud run services describe madem-web --format='value(status.url)')"
  ok "Web live: $WEB_URL"
}

phase_cors() {
  log "Wire CORS allowlist on the backend"
  CRM_URL="$(gcloud run services describe madem-crm --format='value(status.url)')"
  WEB_URL="$(gcloud run services describe madem-web --format='value(status.url)')"
  local origins="${CRM_URL},${WEB_URL}"
  [[ -n "${PUBLIC_SITE_URL:-}" ]] && origins="${origins},${PUBLIC_SITE_URL}"
  # ^@^ delimiter so the commas stay inside the value; --update- (not --set-) so
  # the backend's other env vars are preserved.
  gcloud run services update madem-backend --update-env-vars "^@^CORS_ORIGINS=${origins}" >/dev/null
  ok "CORS_ORIGINS = ${origins}"

  # Bucket CORS so browser presigned PUT uploads aren't blocked. Origin is "*"
  # on purpose: the real auth is the short-lived presigned URL (issued only to
  # logged-in users), not the Origin header, and Cloud Run serves each service on
  # two URL forms (hash + project-number) plus the custom domains — a "*" avoids
  # whack-a-mole as those change.
  local cors_file; cors_file="$(mktemp)"
  printf '[{"origin":["*"],"method":["GET","PUT","HEAD"],"responseHeader":["Content-Type","x-goog-resumable"],"maxAgeSeconds":3600}]' > "$cors_file"
  gcloud storage buckets update "gs://${BUCKET}"      --cors-file="$cors_file" >/dev/null
  gcloud storage buckets update "gs://${DOCS_BUCKET}" --cors-file="$cors_file" >/dev/null
  rm -f "$cors_file"
  ok "Bucket CORS set for browser uploads (origin *)"
}

phase_cron() {
  log "Cloud Scheduler → reminder scan (keeps backend scaled to zero)"
  # CRON_SECRET is created in phase_secrets and mounted by phase_backend; here we
  # just read it to set the scheduler's auth header. tr strips any trailing CR/LF.
  local secret; secret="$(secret_get CRON_SECRET | tr -d '\r\n')"

  local backend_url; backend_url="$(gcloud run services describe madem-backend --format='value(status.url)')"
  local uri="${backend_url}/internal/run-reminders"
  local schedule="${CRON_SCHEDULE:-0 7 * * *}"   # daily 07:00 local
  local tz="${CRON_TZ:-Europe/Tirane}"

  if gcloud scheduler jobs describe madem-reminders --location="$REGION" >/dev/null 2>&1; then
    gcloud scheduler jobs update http madem-reminders --location="$REGION" \
      --schedule="$schedule" --time-zone="$tz" --uri="$uri" --http-method=POST \
      --update-headers="x-cron-secret=${secret}" --attempt-deadline=300s >/dev/null
    skip "Scheduler job 'madem-reminders' updated ($schedule $tz)"
  else
    gcloud scheduler jobs create http madem-reminders --location="$REGION" \
      --schedule="$schedule" --time-zone="$tz" --uri="$uri" --http-method=POST \
      --headers="x-cron-secret=${secret}" --attempt-deadline=300s >/dev/null
    ok "Scheduler job 'madem-reminders' created ($schedule $tz)"
  fi
}

summary() {
  log "Done"
  echo "  Backend : $(gcloud run services describe madem-backend --format='value(status.url)' 2>/dev/null || echo -)"
  echo "  CRM     : $(gcloud run services describe madem-crm     --format='value(status.url)' 2>/dev/null || echo -)"
  echo "  Web     : $(gcloud run services describe madem-web     --format='value(status.url)' 2>/dev/null || echo -)"
  echo
  echo "  Admin login: ${ADMIN_EMAIL}"
  echo "  Admin password: gcloud secrets versions access latest --secret=ADMIN_PASSWORD"
  echo
  echo "  Next: map custom domains, set PUBLIC_SITE_URL in config.env, then re-run."
}

# ── dispatch ─────────────────────────────────────────────────────────────────
case "${1:-all}" in
  apis)     phase_apis ;;
  sql)      phase_sql ;;
  storage)  phase_storage ;;
  secrets)  phase_secrets ;;
  backend)  phase_backend ;;
  seed)     phase_seed ;;
  crm)      phase_crm ;;
  web)      phase_web ;;
  cors)     phase_cors ;;
  cron)     phase_cron ;;
  all)
    phase_apis; phase_sql; phase_storage; phase_secrets
    phase_backend; phase_seed; phase_web; phase_crm; phase_cors; phase_cron; summary ;;
  *) echo "Unknown phase: $1  (apis|sql|storage|secrets|backend|seed|crm|web|cors|cron|all)" >&2; exit 1 ;;
esac
