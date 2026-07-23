# Active Context

## Current Status

The project has been migrated from the prior PostgreSQL + Drizzle + Express plan to a Convex-backed architecture, and deployment is now being reworked for Railway self-hosted Convex without Docker Compose.

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

1. Configure Railway services from the same repository.
2. Point each Railway service at its service-specific `railway.json`.
3. Attach a volume to the `database` service at `/var/lib/postgresql/data`.
4. Set backend, dashboard, database, and frontend variables in Railway.
5. Generate the self-hosted Convex admin key with `railway ssh` on `convex-backend`.
6. Set `CONVEX_SELF_HOSTED_ADMIN_KEY` on the frontend service.
7. Deploy frontend so `convex deploy` pushes functions to self-hosted Convex and exports the Expo Web SPA.
8. Perform a full browser UI smoke test.

## Open Decisions

- Whether to use Railway's managed PostgreSQL template instead of the repository-managed `services/database` image wrapper later.
- Whether to expose Convex HTTP actions on a separate domain/port if `convex/http.ts` is added later.
- Whether to add full authentication later.
- Whether to add rate limiting / quotas for AI actions.
- Whether to normalize tags after MVP.
- Whether to add richer task date parsing / timezone controls.

## Active Warnings

- Do not use Docker Compose for Railway deployment.
- Railway `railway.json` is single-service config; use one config file per service package.
- Do not use PostgreSQL directly from app code; it is only Convex internal persistence.
- Do not introduce Drizzle ORM, drizzle-kit, Prisma, or Express.
- Do not expose OpenAI secrets to Expo.
- Do not expose `CONVEX_SELF_HOSTED_ADMIN_KEY` to Expo client code.
- Do not use Expo `web.output: 'static'` with dynamic task routes.
- Do not commit local Convex runtime state (`apps/mobile/.convex/`).
- Do not commit private local env files (`apps/mobile/.env.local`).
- Convex generated files under `apps/mobile/convex/_generated/` are required for typecheck and should be committed.
- Railway source branch remains a service setting in Railway.
- Do not reintroduce root package-manager pinning fields without re-validating Railway install logs.
