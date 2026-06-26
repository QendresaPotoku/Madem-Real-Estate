# MADEM CRM — Backend

Fastify + TypeORM + PostgreSQL API for the MADEM real-estate CRM. Single deployable, with an in-process cron for contract reminders. Zod schemas are the source of truth and emit the OpenAPI spec the frontends generate their client from.

## Stack
- **Fastify 5** + `fastify-type-provider-zod` (Zod validation + OpenAPI)
- **TypeORM** + PostgreSQL 16 (hand-authored migrations)
- **@fastify/jwt** + httpOnly cookie auth, **@node-rs/argon2** hashing
- **node-cron** in-process scheduler

## Prerequisites
- Node 20+ and Docker (for Postgres/MinIO via the root `docker-compose.yml`)

## Setup
```bash
# from repo root — start Postgres (+ MinIO)
docker compose up -d postgres minio

cd backend
cp .env.example .env        # adjust secrets as needed
npm install
npm run db:migrate          # create schema (enums, tables, triggers, indexes)
npm run db:seed             # admin user + heating/document lookups
npm run dev                 # http://localhost:4000  (Swagger UI at /docs)
```

Default admin (from `.env`): `admin@madem.local` / `admin12345`.

## Scripts
| Script | Purpose |
|---|---|
| `npm run dev` | Watch-mode dev server (tsx) |
| `npm run build` / `start` | Compile to `dist/` and run |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` / `db:revert` | Run / revert migrations |
| `npm run db:seed` | Idempotent seed (admin + lookups) |

## Project layout
```
src/
  config.ts            Zod-validated env
  data-source.ts       TypeORM DataSource (SnakeNamingStrategy)
  app.ts / server.ts   Fastify bootstrap + entrypoint
  entities/            17 domain tables + 2 lookups
  migrations/          hand-authored schema (constraints, triggers, GIN/tsvector)
  schemas/             Zod enums + shared DTOs
  plugins/             db, auth (jwt/cookie guards)
  lib/                 errors, pagination, transformers
  modules/<domain>/    routes (+ schemas) per resource
  cron/                in-process reminder scanner
  seed/                seed script
```

## Implemented — backend complete (45 endpoints)
- **DB layer** — all 17 tables + 2 lookups; ref-code triggers (`M-`, `CN-`, `OP-`, `DL-`, `CT-`, `LA-`), partial unique indexes (one cover/property, one active exclusive listing, one active rental), CHECK constraints, GIN + tsvector full-text search.
- **Auth** — `login` (rate-limited 10/min) / `me` / `logout` (httpOnly cookie, argon2), `authGuard` + `roleGuard`.
- **Users** — admin-only staff/agent CRUD (`/api/users`) with password hashing; deactivate instead of hard-delete.
- **Lookups** — heating-types, document-types.
- **Contacts**, **Properties** (filters + FTS + `attributes_json`), **Listing agreements**.
- **Pipeline** — Opportunities, **Matches** (scoring engine), Viewings, Offers.
- **Settlement** — Deals (close → property SOLD/RENTED), Contracts (+ auto reminders 30/7/0d, dismissed on terminate), Commissions + Splits (sum=100 enforced).
- **Ops** — Activities, Tasks.
- **Media** — `POST /api/uploads/sign` (presigned PUT), property images (add / reorder / set-cover / delete), property documents (add / verify status / delete / **presigned download URL**). MinIO bucket auto-created with public-read scoped to `properties/*` + `avatars/*` (documents stay private, retrieved via presigned GET).
- **Dashboard** — `GET /api/dashboard/summary` (KPIs, pipeline counts, due reminders) + `/featured`.
- **Public (no auth)** — `GET /api/public/properties` (ACTIVE only), `/properties/:code` (with images), `/agents`, `POST /api/public/leads` (creates contact + opportunity + activity, rate-limited).
- OpenAPI spec at `/docs/json`, Swagger UI at `/docs`.

## Deployment
`Dockerfile` builds a production image (runs `migration:run` then `dist/server.js`). `npm run openapi` writes `openapi.json` for the frontends' client generation.

## Next
Wire the existing `web/` site to the public endpoints, then build the Next.js CRM (generate the typed client from `openapi.json` / `/docs/json`). Optional: tests (Vitest + Testcontainers), seed the 12 mock properties from `web/src/data`, per-type Zod validation for `requirements_json` / `attributes_json`.
