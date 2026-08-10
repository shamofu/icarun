# Deployment Guide

icarun is deployed from a single pnpm workspace repository to multiple Railway services. Docker Compose is intentionally not used for Railway deployment.

## Railway Service Layout

Create these Railway services from the same GitHub repository:

```txt
Railway project
  frontend           -> @icarun/mobile
  convex-backend     -> @icarun/convex-backend
  convex-dashboard   -> @icarun/convex-dashboard
  database           -> @icarun/database
```

The app uses Convex as the application backend/database API. PostgreSQL is only the persistence layer for self-hosted Convex; application code must not use PostgreSQL directly and must not add Drizzle, Prisma, or Express.


## Railway Builders and Skipped Builds

Railway Skipped Builds are managed with `build.watchPatterns` in each service's `railway.json`. Patterns are repository-root, gitignore-style paths (for example `/apps/mobile/**`). Keep these paths narrow enough to avoid unnecessary rebuilds, but include every file that can affect that service's deploy.

The frontend service uses Railpack, not Nixpacks:

```json
{
  "build": {
    "builder": "RAILPACK"
  }
}
```

The Convex backend, Convex dashboard, and database services intentionally remain `DOCKERFILE` builders because they wrap official upstream images (`ghcr.io/get-convex/convex-backend`, `ghcr.io/get-convex/convex-dashboard`, and `postgres:17`).

Current Watch Paths:

```txt
frontend
  /apps/mobile/**
  /package.json
  /pnpm-lock.yaml
  /pnpm-workspace.yaml
  /.nvmrc
  /railway.json
  /apps/mobile/railway.json
  /.gitattributes

convex-backend
  /services/convex-backend/**
  /.gitattributes

convex-dashboard
  /services/convex-dashboard/**
  /.gitattributes

database
  /services/database/**
  /.gitattributes
```


## Better Auth / HTTP Actions Requirement

Better Auth is mounted through `apps/mobile/convex/http.ts` and serves `/api/auth/*` from the Convex HTTP/site origin.

Self-hosted Convex listens on two ports:

```txt
3210 -> Convex API / websocket / queries / mutations / actions
3211 -> Convex HTTP actions / site routes, including Better Auth /api/auth/*
```

Railway must expose browser-reachable public URLs for both origins:

```env
EXPO_PUBLIC_CONVEX_URL=https://<convex-api-public-domain>       # routes to 3210
EXPO_PUBLIC_CONVEX_SITE_URL=https://<convex-site-public-domain> # routes to 3211
```

A single `convex-backend` Railway service exposes BOTH origins. In the service Public Networking section, generate two domains: one with target port `3210` (the API origin) and one with target port `3211` (the HTTP actions / Better Auth origin). Keep the healthcheck on the `3210` API origin (`/version`).

## Railway Reference Variables

The examples below assume Railway service names `database`, `convex-backend`,
`convex-dashboard`, and `frontend`. Use Railway UI autocomplete for the actual
reference names.

```env
# database service
POSTGRES_USER=convex
POSTGRES_PASSWORD=replace-with-db-password
POSTGRES_DB=convex_self_hosted
PGDATA=/var/lib/postgresql/data/pgdata

# convex-backend service (container/runtime configuration only)
PORT=3210
INSTANCE_SECRET=replace-with-a-long-random-secret
INSTANCE_NAME=convex-self-hosted
POSTGRES_URL=postgresql://${{ database.POSTGRES_USER }}:${{ database.POSTGRES_PASSWORD }}@${{ database.RAILWAY_PRIVATE_DOMAIN }}:5432
DO_NOT_REQUIRE_SSL=1
CONVEX_CLOUD_ORIGIN=https://<convex-api-public-domain>
CONVEX_SITE_ORIGIN=https://<convex-site-public-domain>
CONVEX_SITE_URL=https://<convex-site-public-domain>
DISABLE_METRICS_ENDPOINT=true
RUST_LOG=info

# convex-dashboard service
NEXT_PUBLIC_DEPLOYMENT_URL=https://<convex-api-public-domain>

# frontend service: public client values
EXPO_PUBLIC_CONVEX_URL=https://<convex-api-public-domain>
EXPO_PUBLIC_CONVEX_SITE_URL=https://<convex-site-public-domain>

# frontend service: deploy-only values
CONVEX_SELF_HOSTED_URL=http://${{ convex-backend.RAILWAY_PRIVATE_DOMAIN }}:3210
CONVEX_SELF_HOSTED_ADMIN_KEY=${{ shared.CONVEX_SELF_HOSTED_ADMIN_KEY }}
CONVEX_ENV_BETTER_AUTH_SECRET=${{ shared.BETTER_AUTH_SECRET }}
CONVEX_ENV_SITE_URL=https://<frontend-public-domain>
CONVEX_ENV_EXPO_APP_SCHEME=icarun

# optional function environment sources
CONVEX_ENV_OPENAI_API_KEY=${{ shared.OPENAI_API_KEY }}
CONVEX_ENV_OPENAI_BASE_URL=https://api.openai.com/v1
CONVEX_ENV_OPENAI_MODEL=gpt-4.1-mini
```

Railway container variables are **not** automatically Convex function
variables. The frontend pre-deploy helper maps `CONVEX_ENV_*` sources to the
unprefixed Convex deployment environment using `convex env set --force`, then
runs `convex deploy`. Values are sent over stdin and are not included in command
arguments or success logs. `BETTER_AUTH_SECRET` and `SITE_URL` are declared as
required in `apps/mobile/convex/convex.config.ts`; the OpenAI values are optional
and are only synchronized when provided.

Generate `CONVEX_SELF_HOSTED_ADMIN_KEY` before the first simultaneous deploy
from the same stable `INSTANCE_NAME` and `INSTANCE_SECRET` configured on
`convex-backend`. The official key generator is local and does not contact a
running backend:

```bash
export INSTANCE_NAME=convex-self-hosted
export INSTANCE_SECRET="$(openssl rand -hex 32)"
export CONVEX_BACKEND_IMAGE='ghcr.io/get-convex/convex-backend:19431ea0dd90bc55ae58dbbd06d9aa045f97336f@sha256:467964cc6af57ba3e757e3e6cb1fa09a1c577803a19f03f0f42c9c4b134b070c'
docker run --rm \
  --entrypoint ./generate_admin_key.sh \
  -e INSTANCE_NAME \
  -e INSTANCE_SECRET \
  "$CONVEX_BACKEND_IMAGE"
```

PowerShell equivalent:

```powershell
$env:INSTANCE_NAME = "convex-self-hosted"
$env:INSTANCE_SECRET = node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
$convexBackendImage = "ghcr.io/get-convex/convex-backend:19431ea0dd90bc55ae58dbbd06d9aa045f97336f@sha256:467964cc6af57ba3e757e3e6cb1fa09a1c577803a19f03f0f42c9c4b134b070c"
docker run --rm `
  --entrypoint ./generate_admin_key.sh `
  -e INSTANCE_NAME `
  -e INSTANCE_SECRET `
  $convexBackendImage
```

Store the printed key as a sealed Railway shared variable, and set the exact
instance name/secret values on `convex-backend`. Keep all three stable. If Docker
is unavailable, deploy the backend first, run `./generate_admin_key.sh` via
Railway SSH, set the frontend secret, and redeploy frontend; that fallback is not
first-deploy order-independent.

Public/private boundary:

- Public browser/client values use the `3210` and `3211` public domains.
- `convex-backend` -> `database` and frontend pre-deploy -> `convex-backend`
  traffic use Railway private networking.
- Never put a Railway private domain into `EXPO_PUBLIC_*` / `NEXT_PUBLIC_*`.
- Never prefix the admin key or `CONVEX_ENV_*` secrets with `EXPO_PUBLIC_`.
- Do not append a database name to `POSTGRES_URL`; Convex derives
  `convex_self_hosted` from `INSTANCE_NAME=convex-self-hosted`.

## Service Details

### frontend

Workspace package: `@icarun/mobile`

Builder: Railpack (`build.builder: "RAILPACK"`)

Watch Paths: `/apps/mobile/**`, `/package.json`, `/pnpm-lock.yaml`,
`/pnpm-workspace.yaml`, `/.nvmrc`, `/railway.json`,
`/apps/mobile/railway.json`, `/.gitattributes`

Config file: `apps/mobile/railway.json`

```bash
pnpm run railway:build:frontend   # Expo export only
pnpm run railway:deploy:frontend  # env sync + function deploy
pnpm run railway:start:frontend   # scrub deploy secrets + serve SPA
```

Required variables:

```env
EXPO_PUBLIC_CONVEX_URL=https://<convex-api-public-domain>
EXPO_PUBLIC_CONVEX_SITE_URL=https://<convex-site-public-domain>
CONVEX_SELF_HOSTED_URL=http://${{ convex-backend.RAILWAY_PRIVATE_DOMAIN }}:3210
CONVEX_SELF_HOSTED_ADMIN_KEY=${{ shared.CONVEX_SELF_HOSTED_ADMIN_KEY }}
CONVEX_ENV_BETTER_AUTH_SECRET=${{ shared.BETTER_AUTH_SECRET }}
CONVEX_ENV_SITE_URL=https://<frontend-public-domain>
```

Optional function settings:

```env
CONVEX_ENV_EXPO_APP_SCHEME=icarun
CONVEX_ENV_OPENAI_API_KEY=${{ shared.OPENAI_API_KEY }}
CONVEX_ENV_OPENAI_BASE_URL=https://api.openai.com/v1
CONVEX_ENV_OPENAI_MODEL=gpt-4.1-mini
```

Optional bounded controls (defaults shown):

```env
CONVEX_DEPLOY_OVERALL_TIMEOUT_SECONDS=1200
CONVEX_DEPLOY_WAIT_TIMEOUT_SECONDS=600
CONVEX_DEPLOY_POLL_INTERVAL_SECONDS=5
CONVEX_DEPLOY_REQUEST_TIMEOUT_SECONDS=10
CONVEX_DEPLOY_CLI_TIMEOUT_SECONDS=300
CONVEX_DEPLOY_MAX_ATTEMPTS=3
CONVEX_DEPLOY_RETRY_INTERVAL_SECONDS=10
```

`CONVEX_DEPLOY_OVERALL_TIMEOUT_SECONDS` is the hard deadline across readiness
checks, environment synchronization, deploy attempts, and retry delays. Each CLI
attempt also has its own deadline. Failed commands are terminated (SIGTERM,
then forced termination after a short grace period), so pre-deploy cannot wait
forever.

Only `EXPO_PUBLIC_*` values are bundled into the SPA. Because this is the chosen
four-service topology, the Railway frontend service still stores the Convex
admin key and function-source secrets for its build/pre-deploy phase. The start
launcher removes all deploy-only variables from itself and the static-server
child before serving traffic. For stricter least privilege, move this phase to a
fifth deployer service or CI job.

### convex-backend

Workspace package: `@icarun/convex-backend`

Builder: Dockerfile (`build.builder: "DOCKERFILE"`)

Watch Paths: `/services/convex-backend/**`, `/.gitattributes`

Config file: `services/convex-backend/railway.json`

Pinned image wrapper:

```txt
ghcr.io/get-convex/convex-backend:19431ea0dd90bc55ae58dbbd06d9aa045f97336f@sha256:467964cc6af57ba3e757e3e6cb1fa09a1c577803a19f03f0f42c9c4b134b070c
```

In this service's Public Networking section, generate one domain targeting port
`3210` (API) and one targeting port `3211` (HTTP actions / Better Auth). Attach a
Railway volume to `/convex/data`.

Required variables:

```env
PORT=3210
INSTANCE_SECRET=replace-with-a-long-random-secret
INSTANCE_NAME=convex-self-hosted
POSTGRES_URL=postgresql://${{ database.POSTGRES_USER }}:${{ database.POSTGRES_PASSWORD }}@${{ database.RAILWAY_PRIVATE_DOMAIN }}:5432
DO_NOT_REQUIRE_SSL=1
CONVEX_CLOUD_ORIGIN=https://<convex-api-public-domain>
CONVEX_SITE_ORIGIN=https://<convex-site-public-domain>
CONVEX_SITE_URL=https://<convex-site-public-domain>
DISABLE_METRICS_ENDPOINT=true
RUST_LOG=info
```

`POSTGRES_URL` must omit the database name and query parameters. The wrapper
performs a bounded **TCP reachability** check before invoking the official Convex
entrypoint; it does not authenticate or execute `SELECT 1`. Convex validates the
PostgreSQL protocol/credentials and fails normally if they are incorrect.

Optional controls:

```env
DATABASE_WAIT_TIMEOUT_SECONDS=600
DATABASE_WAIT_INTERVAL_SECONDS=2
DATABASE_CONNECT_TIMEOUT_SECONDS=5
```

The Railway healthcheck timeout is 900 seconds, restart-on-failure allows ten
restarts, and shutdown uses the upstream SIGINT/graceful-draining behavior.

Do not expect `BETTER_AUTH_SECRET`, `SITE_URL`, or `OPENAI_*` container values to
appear inside Convex functions. Their production values belong in the Convex
deployment environment and are synchronized by frontend pre-deploy.

### convex-dashboard

Workspace package: `@icarun/convex-dashboard`

Builder: Dockerfile (`build.builder: "DOCKERFILE"`)

Watch Paths: `/services/convex-dashboard/**`, `/.gitattributes`

Config file: `services/convex-dashboard/railway.json`

Pinned image:

```txt
ghcr.io/get-convex/convex-dashboard:19431ea0dd90bc55ae58dbbd06d9aa045f97336f@sha256:5f4620ca0640ed863a8c5109123b9831157e889c6294e28c5e96ea0a62375efb
```

Required variable:

```env
NEXT_PUBLIC_DEPLOYMENT_URL=https://<convex-api-public-domain>
```

Backend and dashboard use the same immutable upstream revision. Before changing
that revision, export/backup Convex data, review upstream migrations, and update
both Dockerfiles together.

### database

Workspace package: `@icarun/database`

Builder: Dockerfile (`build.builder: "DOCKERFILE"`)

Watch Paths: `/services/database/**`, `/.gitattributes`

Config file:

```txt
services/database/railway.json
```

Attach a Railway volume at:

```txt
/var/lib/postgresql/data
```

Required variables:

```env
POSTGRES_USER=convex
POSTGRES_PASSWORD=replace-with-db-password
POSTGRES_DB=convex_self_hosted
PGDATA=/var/lib/postgresql/data/pgdata
```

## GitHub Actions Deployment Order

The one-time resources and values must exist before the first deployment:

1. Create all four Railway services and select each service-specific
   `railway.json` while keeping the repository root as the build root.
2. Attach the database volume at `/var/lib/postgresql/data` and the Convex volume
   at `/convex/data`.
3. Choose stable `INSTANCE_NAME` / `INSTANCE_SECRET`, derive the matching admin
   key with the pinned image, and configure sealed secrets.
4. Generate public domains for ports `3210` / `3211` and configure all public,
   private, and `CONVEX_ENV_*` values.
5. Disable Railway's GitHub source autodeploy for these services. GitHub Actions
   is the single deployment trigger; enabling both paths causes duplicate,
   unordered deployments.

Branch-to-environment mapping. Each Railway environment has its own set of
services, domains, and secrets, so create a matching GitHub Environment per
Railway environment:

```txt
push to main      -> GitHub Environment "Railway / development" -> Railway development
push to release   -> GitHub Environment "Railway / production"  -> Railway production
workflow_dispatch -> the Environment selected in the run input
```

Create both GitHub Environments (`Railway / development` and
`Railway / production`) with those names, including the spaces and slash; use the
shown casing consistently even though GitHub compares Environment names without
case sensitivity. Configure the same secret and variables in each, but with values
scoped to that Railway environment (its own Project Token, environment ID,
service IDs, and public
health URLs).

Add this Environment secret to each Environment:

```txt
RAILWAY_TOKEN             # Railway Project Token scoped to that Railway environment
```

Add these Environment variables to each Environment. Service IDs are preferred to
names:

```txt
RAILWAY_PROJECT_ID
RAILWAY_ENVIRONMENT_ID
RAILWAY_DATABASE_SERVICE_ID
RAILWAY_BACKEND_SERVICE_ID
RAILWAY_DASHBOARD_SERVICE_ID
RAILWAY_FRONTEND_SERVICE_ID
CONVEX_API_HEALTH_URL       # https://<convex-api-domain>/version
CONVEX_SITE_HEALTH_URL      # https://<convex-site-domain>/ (2xx/3xx/4xx proves reachability)
DASHBOARD_HEALTH_URL        # https://<dashboard-domain>/
FRONTEND_HEALTH_URL         # https://<frontend-domain>/
```

`.github/workflows/deploy-railway.yml` runs typecheck/build first, then
`scripts/deploy-railway.mjs` uploads and waits for each service in this order:

```txt
database deployment succeeds
  -> convex-backend starts after bounded PostgreSQL TCP wait
    -> public 3210 /version and 3211 origins respond
      -> convex-dashboard deploys and passes its public health probe
        -> frontend pre-deploy waits for /version
          -> synchronizes Convex function environment
            -> deploys Convex functions
              -> scrubs deploy secrets and starts the frontend
```

The workflow uses `railway up --detach --json` to capture the exact deployment
ID, then polls that ID until `SUCCESS`; it does not mistake build completion for
runtime readiness. Failed and timed-out deployments stop the chain and print a
bounded tail of build/deploy logs. GitHub concurrency is serialized per target
Environment with `cancel-in-progress: false`, because canceling an Actions run
does not necessarily cancel a Railway deployment already in progress. Because the
concurrency group includes the environment name, a `Railway / development`
deploy and a `Railway / production` deploy never block or cancel each other.

Both the backend and frontend still retain bounded dependency waits. This
protects manual Railway redeploys and restarts in addition to the CI ordering.
The database has no HTTP health endpoint, so effective database readiness is
confirmed by the backend wrapper reaching PostgreSQL and Convex subsequently
passing `/version`.

The workflow runs from the repository root. Railway CLI does not select a config
file per invocation, so configure each service's Config File Path once in
Railway:

```txt
database          /services/database/railway.json
convex-backend    /services/convex-backend/railway.json
convex-dashboard  /services/convex-dashboard/railway.json
frontend          /apps/mobile/railway.json
```

After deployment, confirm the API `/version` returns HTTP 200 (`unknown` body is
acceptable), then smoke test auth, task isolation/CRUD, AI preview/execute, and
SPA route refresh.

### Manual fallback

If Actions cannot be used, redeploy from Railway in the same order. The bounded
waits tolerate an out-of-order manual restart while dependencies become ready
within their deadlines. Railway does not retry a failed frontend pre-deploy
command; after correcting the dependency, redeploy frontend explicitly.

Railway pre-deploy occupies one build-queue slot, so queued services may start
later according to the workspace's concurrency limit.

### GitHub Actions security

- Use a Railway Project Token in `RAILWAY_TOKEN`, not a broader account token.
- Store the token as a GitHub Environment secret and use protection rules for
  production if required.
- The workflow intentionally does not call `railway variable list`: its JSON can
  contain raw values, while correctly sealed values may be omitted entirely.
  Service startup remains the authoritative configuration check.
- Never print Railway CLI variable JSON or upload it as an artifact.
- Keep the workflow's Railway CLI version pinned and update it intentionally.
- Do not enable Railway GitHub autodeploy while this workflow is active.

## Order-Independent Runtime Restarts

The deployment workflow is ordered, while service runtime behavior remains
resilient to independent restarts:

```txt
database
  -> convex-backend bounded PostgreSQL wait
    -> frontend bounded Convex wait / deploy retry
```

The dashboard does not need the backend to start its process, but CI deploys it
only after both public Convex origins respond. Its Railway healthcheck timeout
and restart allowance cover slower cold starts.

After deployment, confirm the API `/version` returns HTTP 200 (`unknown` body is
acceptable), then smoke test auth, task isolation/CRUD, AI preview/execute, and
SPA route refresh.

## Local Development

```bash
pnpm install
pnpm --filter @icarun/mobile convex:dev
pnpm --filter @icarun/mobile web
```

Local Convex writes these frontend-safe values to `apps/mobile/.env.local`:

```env
EXPO_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
EXPO_PUBLIC_CONVEX_SITE_URL=http://127.0.0.1:3211
```

## Validation

Before deployment:

```bash
pnpm typecheck
pnpm build
```

After deployment:

- Open `https://<convex-api-domain>/version` and verify HTTP 200; `unknown` as the body is acceptable.
- Open the frontend Railway URL.
- Sign up, sign out, sign in again.
- Create, update, complete, and delete a task.
- Refresh a dynamic route such as `/tasks/<id>` and verify SPA fallback works.
- Set sealed `CONVEX_ENV_OPENAI_API_KEY` on `frontend`, redeploy it so pre-deploy synchronizes the value, then test AI preview and confirmed execute.

## Security Notes

- `EXPO_PUBLIC_CONVEX_URL` and `EXPO_PUBLIC_CONVEX_SITE_URL` are public and safe for the client.
- Never expose `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`, `BETTER_AUTH_SECRET`, or `CONVEX_SELF_HOSTED_ADMIN_KEY` as `EXPO_PUBLIC_*` variables.
- AI must continue to use preview -> confirmation -> execute.
- Application code must continue to use Convex APIs, not PostgreSQL directly.
- Do not commit Railway-generated secrets, local `.env*`, or local Convex runtime state.
- Treat the frontend Railway service as privileged because its pre-deploy phase owns the Convex admin key; the runtime launcher scrubs it before serving.


