# Madem Real Estate

Real-estate CRM + public website for a Kosovo agency. Monorepo, three deployable apps
plus Postgres and S3-compatible storage.

## Apps

| Dir | Stack | Role |
|---|---|---|
| [backend/](backend/) | Fastify 5 + TypeORM + PostgreSQL (Node 22) | API, in-process cron, OpenAPI source of truth |
| [crm/](crm/) | Next.js 15 | Internal admin app; proxies `/api` to backend via `next.config` rewrites |
| [web/](web/) | Vite + React | Public marketing site; nginx serves static + proxies `/api` |

Languages: the UI is trilingual (sq/en/de), Albanian-primary. Localized strings use a
`{ en, sq, de }` shape.

## Local development

```bash
docker compose up -d postgres minio     # backing services (Postgres on :5433, MinIO on :9000)
cd backend && npm install && npm run db:migrate && npm run db:seed && npm run dev   # :4000, Swagger at /docs
cd crm && npm install && npm run dev     # :3000
cd web && npm install && npm run dev     # :5173
```

Typecheck before any deploy: `npm run typecheck` in each app.

## Deployment and operations (GCP)

Live on Google Cloud Run, project `madem-real-estate`, region `europe-west3`.

- **First-time setup**: [DEPLOY-GCP.md](DEPLOY-GCP.md)
- **Day-to-day deploy/manage (read this first)**: [deploy/OPERATIONS.md](deploy/OPERATIONS.md)
- **Driver**: [`deploy/gcp-setup.sh`](deploy/gcp-setup.sh) - phase-based, idempotent.
  `./deploy/gcp-setup.sh <phase>` where phase is `apis|sql|storage|secrets|backend|seed|crm|web|cors|cron`.

Key facts: backends scale to zero; reminders run via Cloud Scheduler hitting
`/internal/run-reminders`; storage is split into a public media bucket and a private
docs bucket; all secrets are in Secret Manager. Cost is ~$12-18/mo (mostly Cloud SQL).

### Two rules that bite
1. Never edit `deploy/gcp-setup.sh` while one of its phases is running in the
   background (bash reads scripts by byte offset; edits corrupt the running process).
2. When changing live infra by hand to fix something, fold the fix back into the
   matching phase of `gcp-setup.sh` so the repo stays the source of truth.

## Conventions

- Zod schemas in the backend are the source of truth and emit the OpenAPI spec the
  frontends generate their typed client from (`npm run openapi`).
- DB changes go through hand-authored migrations in `backend/src/migrations/`; the
  backend runs `migration:run` on boot. Keep migrations idempotent.
- Writing style for docs/commits: plain prose, no em dashes.
