# Progress

## Done

- Project direction updated to Convex.
- ADR 0002 added and ADR 0001 superseded.
- pnpm workspace created.
- Expo / React Native Web app skeleton created.
- Convex dependency added.
- Local Convex deployment configured during validation.
- Convex generated files created.
- Convex schema added.
- `tasks` table added.
- `aiOperationLogs` table added.
- Health query added.
- Task CRUD queries/mutations added.
- AI preview action added.
- AI execute action added.
- Zod AI validation added.
- OpenAI-compatible client helper added.
- AI command UI added.
- Task list screen added.
- Task detail screen added.
- Settings screen added.
- `.env.example` updated for Convex.
- README updated for Convex.
- docs updated for Convex.
- project rules updated for Convex.
- TypeScript typecheck has passed once (`tsc --noEmit`).
- Convex functions have compiled and become ready against local deployment once.
- Basic Convex function runtime checks performed (`health.check`, task create/list/remove, AI confirmation guard).
- Mobile dependencies updated to Expo SDK 57-compatible versions.
- Updated dependency set passes Expo dependency check, peer dependency check, TypeScript typecheck, and Expo Web build.
- Railway Node runtime pinned to Node.js 22 LTS via `engines.node` and `.nvmrc`.
- Root top-level `packageManager` removed so Railway avoids the Corepack pnpm shim issue.
- pnpm 11 `devEngines.packageManager` removed and `pnpm-lock.yaml` regenerated as a single YAML document for Railway pnpm 9 compatibility.
- `services/*` added to `pnpm-workspace.yaml`.
- Service packages added for `@icarun/convex-backend`, `@icarun/convex-dashboard`, and `@icarun/database`.
- Service-specific `railway.json` files added for frontend, Convex backend, Convex dashboard, and database.
- Docker Compose plan abandoned per user request.
- Railway Convex backend healthcheck mitigation identified: set `PORT=3210` and Public Networking target port `3210`.
- Railway database `lost+found` mitigation identified: set `PGDATA=/var/lib/postgresql/data/pgdata`.
- Railway deployment docs updated with reference variables, `PGDATA`, `PORT=3210`, and `/version` `unknown` guidance.
- Better Auth email/password authentication added.
- Better Auth Convex component registered and generated.
- Convex HTTP auth routes added under `/api/auth/*`.
- Tasks now include optional `ownerId`; new task operations require authentication and write `ownerId`.
- Task CRUD and AI preview/execute are scoped to the authenticated user.
- Railway frontend config now uses Railpack instead of Nixpacks, and all service Watch Paths are normalized for Skipped Builds.
- Railway runtime restarts are order-independent after one-time setup; bounded waits cover independent manual restarts while GitHub Actions orders push deployments.
- Convex backend now performs a bounded PostgreSQL TCP reachability wait before the official entrypoint.
- Expo export and Convex function deployment are separated; Railway pushes functions from a bounded, retrying pre-deploy command.
- Offline admin-key bootstrapping from stable Convex instance credentials is documented for simultaneous first deploys.
- Pre-deploy now synchronizes required Convex function variables over stdin, enforces overall/per-CLI deadlines, and strips deploy secrets before SPA serving.
- Convex backend/dashboard images are pinned to the same immutable revision.
- GitHub Actions now validates the app and deploys database -> Convex backend -> dashboard -> frontend, polling exact Railway deployment IDs and public readiness before advancing.
- Actions maps `main` to GitHub Environment `Railway / development` and `release` to `Railway / production`; runs are serialized per environment without canceling in-flight Railway deployments, and required Railway/GitHub Environment configuration is validated before upload.

## Not Started / Remaining

- Create Railway services from the same GitHub repository.
- Configure each Railway service to use its service-specific `railway.json`.
- Attach Railway volume to the database service at `/var/lib/postgresql/data`.
- Configure production self-hosted Convex backend environment variables.
- Expose Convex HTTP actions/site origin on port `3211` for Better Auth.
- Generate the self-hosted Convex admin key offline from the production `INSTANCE_NAME` / `INSTANCE_SECRET`, then store it as a sealed Railway variable.
- Configure frontend public URLs, Convex deploy credentials, required `CONVEX_ENV_BETTER_AUTH_SECRET` / `CONVEX_ENV_SITE_URL`, and optional OpenAI sources.
- Disable Railway GitHub source autodeploy and configure the GitHub `Railway / development` / `Railway / production` Environments with their Railway IDs, Project Tokens, and health URLs.
- Full browser UI smoke test after the GitHub Actions Railway deployment.
- Real AI preview call after synchronizing `CONVEX_ENV_OPENAI_API_KEY`.
- Rate limiting / quotas.

## Known Risks

### Railway per-service config

Railway `railway.json` configures one service/deployment, not an entire multi-service project.

Mitigation:

- use pnpm workspace packages for each service
- put a service-specific `railway.json` in each package
- set each Railway service's config file path explicitly

### Database service persistence

The repository-managed PostgreSQL service requires a Railway volume at `/var/lib/postgresql/data` and `PGDATA=/var/lib/postgresql/data/pgdata`.

Mitigation:

- attach the volume before production use
- set `PGDATA=/var/lib/postgresql/data/pgdata` to avoid `lost+found` initdb failures
- keep backend and database in the same Railway region

### Railway Convex backend public ports

The self-hosted Convex backend listens on `3210` for the API and `3211` for HTTP actions. Better Auth uses HTTP actions for `/api/auth/*`, so production must expose both origins publicly.

Mitigation:

- expose Convex API / `CONVEX_CLOUD_ORIGIN` on port `3210`
- expose Convex site / `CONVEX_SITE_ORIGIN` on port `3211`
- keep `/version` healthcheck on the `3210` API origin
- set `EXPO_PUBLIC_CONVEX_SITE_URL` to the browser-reachable `3211` origin

### Railway reference variable safety

Railway reference variables reduce duplication but must preserve network boundaries.

Mitigation:

- use public domains for browser-facing Convex URLs
- use private domains for `convex-backend` -> `database` and frontend-pre-deploy -> `convex-backend` traffic
- store the admin key and `CONVEX_ENV_*` secrets as sealed frontend deployment variables, never as `EXPO_PUBLIC_*`
- remember frontend pre-deploy is privileged in the four-service topology; runtime scrubs secrets before serving

### Convex self-host admin key

Self-hosted Convex deploy requires an admin key derived from the same stable `INSTANCE_NAME` and `INSTANCE_SECRET` used by the backend.

Mitigation:

- generate the key before first deploy with the official image's local `generate_admin_key.sh`
- set the exact same instance name/secret on `convex-backend`
- store the derived key only as sealed `CONVEX_SELF_HOSTED_ADMIN_KEY` on the frontend build/deploy service
- do not rotate one of these values independently

### Bounded Railway dependency waits

The backend depends on PostgreSQL TCP reachability, and the frontend pre-deploy step depends on Convex readiness. Railway uses reference variables for batched startup ordering, but GitHub push deploys run independently.

Mitigation:

- wait for PostgreSQL in the backend image wrapper (600-second default)
- use a longer backend healthcheck timeout (900 seconds)
- apply one overall deadline plus per-CLI deadlines to env sync and function deploy
- wait for `/version`, synchronize Convex function env, and retry `convex deploy`
- fail clearly rather than waiting indefinitely; Railway will not retry pre-deploy, so redeploy frontend after correcting/waiting

### Convex image upgrades

Backend and dashboard are pinned to the same immutable upstream revision. Self-hosted backend upgrades may run database migrations.

Mitigation:

- update both Dockerfiles to the same upstream revision
- export/backup Convex data and save function environment before upgrade
- review migration logs and upstream upgrade guidance

### Convex generated files

`apps/mobile/convex/_generated/` is required for typechecking.

Mitigation:

- commit generated files
- regenerate with `pnpm --filter @icarun/mobile convex:dev`

### OpenAI-compatible provider differences

Some providers may not support `response_format`.

Mitigation:

- retry without `response_format`
- always parse JSON
- always validate with Zod

### Railway Skipped Builds / Watch Paths

Railway services may skip builds when changed files do not match `build.watchPatterns`.

Mitigation:

- keep frontend watch paths aligned with all files that affect Expo/Convex deploys
- keep Dockerfile image-wrapper service watch paths limited to their own directories plus `/.gitattributes`
- manually redeploy from Railway when intentionally changing service settings outside watched paths

### Railway pnpm/Corepack compatibility

Railway previously had pnpm/Corepack and pnpm-lock parsing issues.

Mitigation:

- keep `engines.node` as `22.x`
- keep `.nvmrc` as `22`
- do not re-add root top-level `packageManager`
- do not re-add pnpm 11 `devEngines.packageManager`
- keep `pnpm-lock.yaml` as a single YAML document

### Expo dynamic route refresh

Static hosting may break `/tasks/[id]` refresh if no SPA fallback is configured.

Mitigation:

- use `web.output: 'single'`
- use `apps/mobile/scripts/start-frontend.mjs` to scrub deploy secrets and run `serve --single`

## MVP Completion Checklist

The MVP is complete when:

- `pnpm install` succeeds
- `pnpm typecheck` succeeds
- `pnpm build` succeeds
- Railway database service persists data on a volume
- self-hosted Convex backend deploys and `/version` returns HTTP 200, even if the body is `unknown`
- Convex dashboard can log in with generated admin key
- Convex functions are deployed to the self-hosted backend
- Better Auth sign-up/sign-in/sign-out works
- `api.health.check` works from the frontend
- task CRUD works per authenticated user
- Expo Web UI can list/create/update/delete tasks
- AI preview works with configured provider key and only sees the current user's tasks
- AI execute works after confirmation
- OpenAI and Better Auth secrets stay server-side
- static SPA deploy succeeds
- `/tasks/:id` works after browser refresh
