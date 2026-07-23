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

The app still uses Convex as the application backend/database API. PostgreSQL is only the persistence layer for the self-hosted Convex backend; application code must not use PostgreSQL directly and must not add Drizzle, Prisma, or Express.

## Why there are multiple railway.json files

Railway config-as-code (`railway.json`) configures a single Railway service/deployment. It is not a multi-service manifest. To manage all services in one repository, this project uses pnpm workspace packages and a service-specific `railway.json` in each deployable package:

```txt
railway.json                                  # frontend default / backwards-compatible root config
apps/mobile/railway.json                     # frontend service config
services/convex-backend/railway.json         # Convex backend service config
services/convex-dashboard/railway.json       # Convex dashboard service config
services/database/railway.json               # PostgreSQL service config
```

When creating each Railway service, set the service's config file path to the matching file above. Keep the service root directory at the repository root for this shared pnpm workspace unless Railway's UI requires otherwise. Watch patterns in each config prevent unrelated changes from triggering every service.

## Service Details

### frontend

Workspace package:

```txt
@icarun/mobile
```

Config file:

```txt
apps/mobile/railway.json
```

Build command:

```bash
pnpm run railway:build:frontend
```

Start command:

```bash
pnpm run railway:start:frontend
```

The build command runs Convex deploy for the self-hosted deployment and exports the Expo Web SPA to `apps/mobile/dist`.

Required variables:

```env
EXPO_PUBLIC_CONVEX_URL=https://your-convex-backend.up.railway.app
CONVEX_SELF_HOSTED_URL=https://your-convex-backend.up.railway.app
CONVEX_SELF_HOSTED_ADMIN_KEY=your-self-hosted-convex-admin-key
```

`EXPO_PUBLIC_CONVEX_URL` is frontend-safe and is bundled into the client. `CONVEX_SELF_HOSTED_ADMIN_KEY` is a build/deploy secret and must never be exposed to frontend code.

### convex-backend

Workspace package:

```txt
@icarun/convex-backend
```

Config file:

```txt
services/convex-backend/railway.json
```

Image wrapper:

```txt
ghcr.io/get-convex/convex-backend:latest
```

Generate a public Railway domain for the backend service. Convex listens on port 3210; use the generated domain as the public Convex URL. Attach a Railway volume to the backend service at /convex/data for Convex local runtime/storage data.

Required variables:

```env
INSTANCE_SECRET=replace-with-a-long-random-secret
INSTANCE_NAME=convex-self-hosted
POSTGRES_URL=postgresql://convex:password@database.railway.internal:5432
DO_NOT_REQUIRE_SSL=1
CONVEX_CLOUD_ORIGIN=https://your-convex-backend.up.railway.app
CONVEX_SITE_ORIGIN=https://your-convex-backend.up.railway.app
DISABLE_METRICS_ENDPOINT=true
RUST_LOG=info
OPENAI_API_KEY=sk-your-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
```

Convex requires `POSTGRES_URL` without the database name or query parameters. With `INSTANCE_NAME=convex-self-hosted`, the Convex database name is `convex_self_hosted`.

After first deploy, generate an admin key:

```bash
railway ssh
./generate_admin_key.sh
```

Store the generated key in the frontend service as `CONVEX_SELF_HOSTED_ADMIN_KEY` and use it to log into the dashboard.

### convex-dashboard

Workspace package:

```txt
@icarun/convex-dashboard
```

Config file:

```txt
services/convex-dashboard/railway.json
```

Image wrapper:

```txt
ghcr.io/get-convex/convex-dashboard:latest
```

Generate a public Railway domain for the dashboard service.

Required variables:

```env
NEXT_PUBLIC_DEPLOYMENT_URL=https://your-convex-backend.up.railway.app
```

Open the dashboard URL and enter the admin key generated from the backend service.

### database

Workspace package:

```txt
@icarun/database
```

Config file:

```txt
services/database/railway.json
```

Image wrapper:

```txt
postgres:17
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
```

Do not expose this service publicly unless needed for emergency maintenance. Keep it on Railway private networking for application use.

## Deployment Order

1. Create/deploy the database service and attach its volume at /var/lib/postgresql/data.
2. Create/deploy the convex-backend service, attach its volume at /convex/data, and set POSTGRES_URL pointed at the database host without a database path.
3. Generate a public domain for `convex-backend`.
4. Run `./generate_admin_key.sh` inside `convex-backend` via Railway SSH.
5. Create/deploy `convex-dashboard` with `NEXT_PUBLIC_DEPLOYMENT_URL` set to the backend public URL.
6. Create/deploy `frontend` with `EXPO_PUBLIC_CONVEX_URL`, `CONVEX_SELF_HOSTED_URL`, and `CONVEX_SELF_HOSTED_ADMIN_KEY` set.
7. Smoke test the SPA and Convex health query.

## Local Development

Install dependencies:

```bash
pnpm install
```

Run Convex dev locally or against the configured self-hosted backend:

```bash
pnpm --filter @icarun/mobile convex:dev
```

Run Expo Web:

```bash
pnpm --filter @icarun/mobile web
```

## Validation

Before deployment:

```bash
pnpm typecheck
pnpm build
```

After deployment:

- Open the frontend Railway URL.
- Check Settings for Convex health.
- Create, update, complete, and delete a task.
- Refresh a dynamic route such as `/tasks/<id>` and verify SPA fallback works.
- Configure `OPENAI_API_KEY` on `convex-backend`, then test AI preview and confirmed execute.

## Security Notes

- Only `EXPO_PUBLIC_CONVEX_URL` is public and safe for the client.
- Never expose `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`, or `CONVEX_SELF_HOSTED_ADMIN_KEY` as `EXPO_PUBLIC_*` variables.
- AI must continue to use preview -> confirmation -> execute.
- Application code must continue to use Convex APIs, not PostgreSQL directly.
- Do not commit Railway-generated secrets, local `.env*`, or local Convex runtime state.
