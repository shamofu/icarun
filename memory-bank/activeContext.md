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
- Pinned Railway frontend Node runtime to Node.js 24 LTS.
- Selected pnpm 11.x for local and Railway frontend package management, while CI validation uses pnpm 11.21.0.
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
- Updated frontend Railway builder from Nixpacks to Railpack and normalized all Railway Watch Paths for Skipped Builds.
- Made Railway runtime restarts order-independent with bounded dependency waits.
- Added a Convex backend wrapper that waits for PostgreSQL before invoking the official entrypoint.
- Split Expo export from `convex deploy`; Railway now pushes functions in a bounded, retrying pre-deploy command over private networking.
- Documented offline admin-key generation from stable `INSTANCE_NAME` / `INSTANCE_SECRET` so the first deploy can be simultaneous.
- Added bounded Convex function-environment sync from `CONVEX_ENV_*`, deploy-time required env validation, per-CLI/overall deadlines, and runtime secret scrubbing.
- Pinned Convex backend/dashboard to the same immutable upstream revision and documented backup-first upgrades.
- Added a GitHub Actions deployment pipeline that validates the app, runs deployment in the version-pinned official Railway CLI container, deploys database -> Convex backend -> dashboard -> frontend, waits for exact Railway deployment IDs and public readiness, maps `main` to GitHub Environment `Railway / development` and `release` to `Railway / production`, and serializes deployments per environment.

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

1. Create all four Railway services, select their service-specific config files, attach both required volumes, and disable Railway GitHub source autodeploy.
2. Choose stable `INSTANCE_NAME` / `INSTANCE_SECRET`, generate the matching admin key offline, and set it as a sealed frontend variable.
3. Configure public Convex domains, private references, and sealed `CONVEX_ENV_BETTER_AUTH_SECRET` / optional OpenAI sources.
4. Configure the `Railway / development` and `Railway / production` GitHub Environments with their Railway Project Tokens, environment/service IDs, and four public health URLs; `main` deploys to development and `release` deploys to production.
5. Run the GitHub Actions deployment and verify ordered service success, bounded waits, function-env sync, function deploy, and runtime secret scrubbing.
6. Smoke test sign-up, sign-in, sign-out, task CRUD isolation, AI preview/execute, and dynamic route refresh.

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
- Use Railway public domains for browser-facing Convex URLs; use private domains for backend-to-database and frontend-pre-deploy-to-Convex traffic only.
- Keep `INSTANCE_NAME`, `INSTANCE_SECRET`, and the derived self-hosted admin key stable and mutually consistent.
- GitHub Actions is the only push deployment trigger and serializes database -> backend -> dashboard -> frontend; keep Railway GitHub source autodeploy disabled to avoid duplicate unordered deployments.
- Dependency waits and CLI operations are bounded; Railway does not retry failed pre-deploy, so fix/wait and redeploy frontend after a deadline failure.
- Railway backend container variables do not populate the Convex function environment; use `CONVEX_ENV_*` synchronization.
- The four-service topology makes frontend pre-deploy privileged; use a fifth deployer/CI job if stricter isolation is required.
