# MADEM CRM — Admin (Next.js)

Internal admin dashboard for the MADEM real-estate CRM. Talks to the Fastify backend via a typed client generated from its OpenAPI spec.

## Stack
- Next.js 15 (App Router) + React 19, TypeScript
- Tailwind CSS v4
- TanStack Query (data fetching/caching)
- `openapi-fetch` + `openapi-typescript` (fully-typed API client generated from `../backend/openapi.json`)

## Run
```bash
# 1) backend must be running (see ../backend/README.md) on :4000
# 2) generate the API client (after any backend API change)
npm run gen:api
# 3) start the CRM
npm run dev            # http://localhost:3000
```
Log in with the seeded admin: `admin@madem.local` / `admin12345`.

## How it talks to the API
`next.config.mjs` rewrites `/api/*` → `http://localhost:4000/api/*`, so the backend's httpOnly session cookie stays first-party. `middleware.ts` guards every route: no `madem_session` cookie → redirect to `/login`.

## Structure
```
app/
  layout.tsx            root layout + React Query provider
  login/page.tsx        login screen (sets session cookie via proxy)
  (app)/                authenticated area (sidebar shell)
    layout.tsx          AppShell
    page.tsx            dashboard (KPIs, pipeline, reminders)
    properties/page.tsx properties table (search/filter/paginate)
    contacts/page.tsx   contacts table
components/
  app-shell.tsx         sidebar + topbar + logout
  providers.tsx         QueryClientProvider
lib/
  api.ts                openapi-fetch client + tx() i18n helper
  api-types.ts          GENERATED — do not edit (npm run gen:api)
  cn.ts                 className helper
middleware.ts           session-cookie route guard
```

## Implemented (full CRM)
All screens run against the live API via the generated typed client:
- **Auth** — login/logout, middleware session guard
- **Dashboard** — live KPIs, pipeline counts, upcoming reminders
- **Properties** — list (search/filter/paginate) + create + **detail/edit** with i18n title/description tabs, **image manager** (presigned upload, set-cover, reorder, delete) and **document manager** (upload, verify status, presigned download)
- **Contacts** — list + create
- **Opportunities** — list + create + **ranked matches** modal (scoring engine)
- **Viewings** — schedule + status
- **Offers** — create + status
- **Deals** — create + status (CLOSED_WON → property SOLD/RENTED)
- **Contracts** — create + status + **reminders** view (auto-generated for rentals)
- **Commissions** — create + **splits editor** (live sum=100 validation)
- **Tasks** — create + assignee/priority/status
- **Users & Agents** — admin create/list

Shared UI kit in `components/ui.tsx`; reusable form/upload/query helpers in `lib/` and `components/`.

## Next
Optional polish: edit/delete on more entities, contact/deal detail pages, activity timelines, drag-and-drop image reorder, toasts, and tests. Then wire the public `web/` site to `/api/public/*`.
