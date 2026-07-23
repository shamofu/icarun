# Active Context

## Current Status

The project has been migrated from the prior PostgreSQL + Drizzle + Express plan to a Convex-backed architecture and now includes Better Auth email/password accounts.

Current implemented structure includes:

```txt
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
.env.example
.gitignore
railway.json
apps/mobile/
services/convex-backend/
services/convex-dashboard/
services/database/
```

## Recent Changes

- Added pnpm workspace.
- Added Expo / React Native Web app skeleton.
- Added Convex backend under `apps/mobile/convex/`.
- Added Convex schema for `tasks` and `aiOperationLogs`.
- Added task CRUD Convex queries/mutations.
- Added health query.
- Added AI preview/execute Convex actions.
- Added Zod AI action validation.
- Added Expo UI screens for task list, task detail, and settings.
- Added AI command bar using preview -> confirm -> execute.
- Added ADR 0002: Use Convex.
- Marked ADR 0001 as superseded.
- Updated mobile dependencies to Expo SDK 57-compatible versions.
- Verified updated dependencies with Expo dependency check, peer check, typecheck, and web build.
- Added Railway config-as-code for frontend SPA hosting.
- Pinned Railway/Nixpacks Node runtime to Node.js 22 LTS.
- Removed root top-level `packageManager` and pnpm 11 `devEngines.packageManager` for Railway pnpm compatibility.
- Added `services/*` to the pnpm workspace.
- Added service wrapper packages for self-hosted Convex backend, Convex dashboard, and PostgreSQL.
- Added per-service Railway config files instead of Docker Compose.
- Documented Convex backend `PORT=3210`, Public Networking target port `3210`, and `/version` returning `unknown` as acceptable with HTTP 200.
- Documented Railway PostgreSQL `PGDATA=/var/lib/postgresql/data/pgdata` to avoid `lost+found` initdb failures.
- Documented Railway reference variable wiring across frontend, Convex backend, Convex dashboard, and database services.
- Added Better Auth email/password accounts via `@convex-dev/better-auth`.
- Added Convex HTTP auth routes under `/api/auth/*`.
- Added per-user task isolation with `ownerId`.
- Scoped AI preview/execute to the authenticated user's tasks.

## Current Direction

Use Railway as the deployment platform for all services, managed from one repository through pnpm workspace packages:

```txt
frontend           @icarun/mobile
convex-backend     @icarun/convex-backend
convex-dashboard   @icarun/convex-dashboard
database           @icarun/database
```

Use Convex as the application database/backend source of truth. PostgreSQL is only self-hosted Convex's internal persistence layer.

## Immediate Next Steps

1. Configure Railway so Convex API traffic reaches port `3210` and Convex HTTP/site auth traffic reaches port `3211`.
2. Set frontend variables `EXPO_PUBLIC_CONVEX_URL`, `EXPO_PUBLIC_CONVEX_SITE_URL`, `SITE_URL`, `CONVEX_SELF_HOSTED_URL`, and `CONVEX_SELF_HOSTED_ADMIN_KEY`.
3. Set convex-backend variables `CONVEX_CLOUD_ORIGIN`, `CONVEX_SITE_ORIGIN`, `BETTER_AUTH_SECRET`, `SITE_URL`, and `EXPO_APP_SCHEME=icarun`.
4. Deploy frontend so `convex deploy` pushes Better Auth component/functions to self-hosted Convex and exports the Expo Web SPA.
5. Smoke test sign-up, sign-in, sign-out, task CRUD isolation, AI preview/execute, and dynamic route refresh.

## Open Decisions

- Exact Railway topology for exposing Convex HTTP actions port `3211` if a single service cannot expose two public target ports.
- Whether to use Railway's managed PostgreSQL template instead of the repository-managed `services/database` image wrapper later.
- Whether to add rate limiting / quotas for AI actions.
- Whether to normalize tags after MVP.
- Whether to add richer task date parsing / timezone controls.

## Active Warnings

- Do not use Docker Compose for Railway deployment.
- Railway `railway.json` is single-service config; use one config file per service package.
- Do not use PostgreSQL directly from app code; it is only Convex internal persistence.
- Do not introduce Drizzle ORM, drizzle-kit, Prisma, or Express.
- Do not expose OpenAI secrets to Expo.
- Do not expose `BETTER_AUTH_SECRET` or `CONVEX_SELF_HOSTED_ADMIN_KEY` to Expo client code.
- Do not use Expo `web.output: 'static'` with dynamic task routes.
- Do not commit local Convex runtime state (`apps/mobile/.convex/`).
- Do not commit private local env files (`apps/mobile/.env.local`).
- Convex generated files under `apps/mobile/convex/_generated/` are required for typecheck and should be committed.
- Railway source branch remains a service setting in Railway.
- Do not reintroduce root package-manager pinning fields without re-validating Railway install logs.
- Railway PostgreSQL must use `PGDATA=/var/lib/postgresql/data/pgdata`; using the volume mount root directly can fail because of `lost+found`.
- Convex API Public Networking must target port `3210`; Better Auth also requires a browser-reachable site/auth origin targeting port `3211`.
- Use Railway public domains for browser-facing Convex URLs and private domains only for backend-to-database traffic.
