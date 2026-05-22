# SafeRide Ops — School Bus Management System

A web-based school bus management system where students scan biometrics when boarding/alighting buses. Guardians receive SMS notifications with timestamps. Admin dashboard to manage students, buses, routes, trips, and view SMS delivery logs.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/school-bus run dev` — run the React frontend (port 22253, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite, Wouter routing, TanStack Query, shadcn/ui, Lucide icons
- API: Express 5 (port 8080, base path `/api`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — all 7 Drizzle schema files (students, buses, routes, trips, scans, smsGateway, smsLogs)
- `artifacts/api-server/src/routes/` — Express route handlers (one file per resource)
- `artifacts/api-server/src/lib/sms.ts` — SMS sending logic (POSTs to configured gateway)
- `artifacts/school-bus/src/pages/` — React page components (Dashboard, Students, Buses, Routes, Trips, Scans, Sms)
- `artifacts/school-bus/src/components/layout/AppLayout.tsx` — sidebar navigation (navy/amber theme)
- Generated hooks: `lib/api-client-react/` | Generated Zod schemas: `lib/api-zod/`

## Architecture decisions

- Contract-first API: OpenAPI spec is written first; hooks + Zod schemas are generated via Orval
- Single SMS gateway config row in DB — upserted on save; gateway can be toggled active/inactive
- Biometric scan flow: POST `/api/scans` → looks up student by biometricId → records scan → updates trip boardings/alightings count → sends SMS to guardian
- SMS logs are always written regardless of gateway active state (for audit trail)
- Routes are named `RoutesPage` / `SmsPage` internally to avoid collisions with React Router's `Route` component

## Product

- **Dashboard**: Live stats (students on buses, active trips, today's scans, SMS delivered) + activity feed
- **Students**: Full CRUD for enrolled students; assign biometric ID, guardian phone, and bus
- **Buses**: Fleet management with driver info and route assignment
- **Routes**: Named routes with stop count and estimated duration
- **Trips**: Start/end trips per bus; view all scans per trip
- **Live Scans**: Simulate a biometric scanner — select active trip, scan type (board/alight), enter biometric ID
- **SMS Config**: Set gateway provider, API URL, API key, sender ID; view all delivery logs

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The API server must be rebuilt after route changes (`restart_workflow "artifacts/api-server: API Server"`)
- `pnpm --filter @workspace/db run push` must be run after any schema changes before the server starts
- `SelectItem` from shadcn/ui does not allow empty string values — use a sentinel like `"all"` or `"none"` instead
- Always run codegen (`pnpm --filter @workspace/api-spec run codegen`) after changing `openapi.yaml`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
