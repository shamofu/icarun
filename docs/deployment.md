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

The examples below assume service names `database`, `convex-backend`, `convex-dashboard`, and `frontend`. Use Railway UI autocomplete for actual reference names.

```env
# database service
POSTGRES_USER=convex
POSTGRES_PASSWORD=replace-with-db-password
POSTGRES_DB=convex_self_hosted
PGDATA=/var/lib/postgresql/data/pgdata

# convex-backend service
PORT=3210
INSTANCE_SECRET=replace-with-a-long-random-secret
INSTANCE_NAME=convex-self-hosted
POSTGRES_URL=postgresql://${{ database.POSTGRES_USER }}:${{ database.POSTGRES_PASSWORD }}@${{ database.RAILWAY_PRIVATE_DOMAIN }}:5432
DO_NOT_REQUIRE_SSL=1
CONVEX_CLOUD_ORIGIN=https://<convex-api-public-domain>
CONVEX_SITE_ORIGIN=https://<convex-site-public-domain>
CONVEX_SITE_URL=https://<convex-site-public-domain>
BETTER_AUTH_SECRET=replace-with-long-random-secret
SITE_URL=https://<frontend-public-domain>
EXPO_APP_SCHEME=icarun
DISABLE_METRICS_ENDPOINT=true
RUST_LOG=info
OPENAI_API_KEY=sk-your-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini

# convex-dashboard service
NEXT_PUBLIC_DEPLOYMENT_URL=https://<convex-api-public-domain>

# frontend service
EXPO_PUBLIC_CONVEX_URL=https://<convex-api-public-domain>
EXPO_PUBLIC_CONVEX_SITE_URL=https://<convex-site-public-domain>
SITE_URL=https://<frontend-public-domain>
CONVEX_SELF_HOSTED_URL=https://<convex-api-public-domain>
CONVEX_SELF_HOSTED_ADMIN_KEY=${{ shared.CONVEX_SELF_HOSTED_ADMIN_KEY }}
```

`CONVEX_SELF_HOSTED_ADMIN_KEY` is generated after the backend is running with `./generate_admin_key.sh`. It may be pasted directly into the frontend service, but a sealed Railway shared variable is preferred.

Public vs private domain rule:

- Use public URLs for all browser/client-facing values.
- Use `RAILWAY_PRIVATE_DOMAIN` only for server-to-server database traffic in `POSTGRES_URL`.
- Never use `RAILWAY_PRIVATE_DOMAIN` in Expo client variables.
- Do not append the database name to `POSTGRES_URL`; Convex derives `convex_self_hosted` from `INSTANCE_NAME=convex-self-hosted`.

## Service Details

### frontend

Workspace package: `@icarun/mobile`

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

Required variables:

```env
EXPO_PUBLIC_CONVEX_URL=https://<convex-api-public-domain>
EXPO_PUBLIC_CONVEX_SITE_URL=https://<convex-site-public-domain>
SITE_URL=https://<frontend-public-domain>
CONVEX_SELF_HOSTED_URL=https://<convex-api-public-domain>
CONVEX_SELF_HOSTED_ADMIN_KEY=${{ shared.CONVEX_SELF_HOSTED_ADMIN_KEY }}
```

`EXPO_PUBLIC_CONVEX_URL` and `EXPO_PUBLIC_CONVEX_SITE_URL` are bundled into the client and are not secrets. `CONVEX_SELF_HOSTED_ADMIN_KEY` is a build/deploy secret and must never be exposed to frontend code.

### convex-backend

Workspace package: `@icarun/convex-backend`

Config file:

```txt
services/convex-backend/railway.json
```

Image wrapper:

```txt
ghcr.io/get-convex/convex-backend:latest
```

In this single service Public Networking section, generate two public domains: one with target port `3210` (API origin, used for `CONVEX_CLOUD_ORIGIN` / `EXPO_PUBLIC_CONVEX_URL`) and one with target port `3211` (HTTP actions / Better Auth origin, used for `CONVEX_SITE_ORIGIN` / `CONVEX_SITE_URL` / `EXPO_PUBLIC_CONVEX_SITE_URL`). Attach a Railway volume to `/convex/data`.

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
BETTER_AUTH_SECRET=replace-with-long-random-secret
SITE_URL=https://<frontend-public-domain>
EXPO_APP_SCHEME=icarun
DISABLE_METRICS_ENDPOINT=true
RUST_LOG=info
OPENAI_API_KEY=sk-your-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
```

Convex requires `POSTGRES_URL` without database name or query parameters. `BETTER_AUTH_SECRET` should be a stable high-entropy secret, e.g. `openssl rand -base64 32`.

After first deploy, generate an admin key:

```bash
railway ssh
./generate_admin_key.sh
```

### convex-dashboard

Workspace package: `@icarun/convex-dashboard`

Config file:

```txt
services/convex-dashboard/railway.json
```

Required variables:

```env
NEXT_PUBLIC_DEPLOYMENT_URL=https://<convex-api-public-domain>
```

### database

Workspace package: `@icarun/database`

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

## Deployment Order

1. Create/deploy the database service, attach its volume at `/var/lib/postgresql/data`, and set `PGDATA=/var/lib/postgresql/data/pgdata`.
2. Create/deploy the convex-backend service, attach its volume at `/convex/data`, set `PORT=3210`, and set `POSTGRES_URL` pointed at the database private host without a database path.
3. Generate a public API domain for `convex-backend` and set its Public Networking target port to `3210`.
4. In the same `convex-backend` service Public Networking section, generate a second public domain with target port `3211`, and set it as `CONVEX_SITE_ORIGIN`, `CONVEX_SITE_URL`, and `EXPO_PUBLIC_CONVEX_SITE_URL`.
5. Confirm `https://<convex-api-domain>/version` returns HTTP 200. The response body may be `unknown`.
6. Run `./generate_admin_key.sh` inside `convex-backend` via Railway SSH.
7. Create/deploy `convex-dashboard` with `NEXT_PUBLIC_DEPLOYMENT_URL` set to the API public URL.
8. Create/deploy `frontend` with `EXPO_PUBLIC_CONVEX_URL`, `EXPO_PUBLIC_CONVEX_SITE_URL`, `SITE_URL`, `CONVEX_SELF_HOSTED_URL`, and `CONVEX_SELF_HOSTED_ADMIN_KEY` set.
9. Smoke test sign-up, sign-in, sign-out, task CRUD, AI preview/execute, and SPA route refresh.

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
- Configure `OPENAI_API_KEY` on `convex-backend`, then test AI preview and confirmed execute.

## Security Notes

- `EXPO_PUBLIC_CONVEX_URL` and `EXPO_PUBLIC_CONVEX_SITE_URL` are public and safe for the client.
- Never expose `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`, `BETTER_AUTH_SECRET`, or `CONVEX_SELF_HOSTED_ADMIN_KEY` as `EXPO_PUBLIC_*` variables.
- AI must continue to use preview -> confirmation -> execute.
- Application code must continue to use Convex APIs, not PostgreSQL directly.
- Do not commit Railway-generated secrets, local `.env*`, or local Convex runtime state.


