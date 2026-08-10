# System Patterns

## High-Level Architecture

```txt
Expo / React Native Web SPA
        |
        | convex/react + Better Auth client
        v
Self-hosted Convex backend on Railway
        |
        +--> Better Auth HTTP routes (/api/auth/*)
        |
        +--> PostgreSQL persistence used internally by Convex
        |
        +--> Convex action -> OpenAI-compatible Chat Completions API
```

The application treats Convex as the database/backend source of truth. PostgreSQL is not application-facing and must not be accessed directly by frontend/backend app code.

## Railway Monorepo Deployment Pattern

Do not use Docker Compose for Railway deployment.

Railway config-as-code (`railway.json`) configures one Railway service/deployment. The repository manages multiple services through pnpm workspace packages, each with a service-specific `railway.json`:

Railway Skipped Builds are controlled by `build.watchPatterns` in each service config. Frontend builds use Railpack (`build.builder: "RAILPACK"`); image-wrapper services use Dockerfile builders. Watch paths are repository-root patterns such as `/apps/mobile/**` and `/services/convex-backend/**`; all services also watch `/.gitattributes` because it controls container script line endings.

GitHub Actions is the only push deployment trigger, maps `main` to Railway `development` and `release` to Railway `production`, and orders database -> Convex backend -> dashboard -> frontend by polling the exact Railway deployment IDs and public health endpoints; Railway GitHub source autodeploy stays disabled. Runtime restarts remain order-independent. The Convex wrapper performs bounded PostgreSQL TCP waits. Frontend build only exports Expo; pre-deploy has one overall deadline, synchronizes `CONVEX_ENV_*` sources into the Convex function environment, and retries function deploy. On deadline expiry, redeploy the failed dependent service. Frontend startup scrubs deploy credentials before serving.

```txt
railway.json
apps/mobile/railway.json
services/convex-backend/railway.json
services/convex-dashboard/railway.json
services/database/railway.json
```

## Service Layout

```txt
frontend
  package: @icarun/mobile
  build: pnpm run railway:build:frontend
  pre-deploy: pnpm run railway:deploy:frontend
  start: pnpm run railway:start:frontend

convex-backend
  package: @icarun/convex-backend
  image wrapper: ghcr.io/get-convex/convex-backend:19431ea0dd90bc55ae58dbbd06d9aa045f97336f@sha256:467964cc6af57ba3e757e3e6cb1fa09a1c577803a19f03f0f42c9c4b134b070c
  api port: 3210
  http/site/auth port: 3211

convex-dashboard
  package: @icarun/convex-dashboard
  image wrapper: ghcr.io/get-convex/convex-dashboard:19431ea0dd90bc55ae58dbbd06d9aa045f97336f@sha256:5f4620ca0640ed863a8c5109123b9831157e889c6294e28c5e96ea0a62375efb

database
  package: @icarun/database
  image wrapper: postgres:17
  volume: /var/lib/postgresql/data
  pgdata: /var/lib/postgresql/data/pgdata
```

## Railway Variable Reference Pattern

Use Railway reference variables to avoid duplicated service values:

```env
# convex-backend -> database over private networking
POSTGRES_URL=postgresql://${{ database.POSTGRES_USER }}:${{ database.POSTGRES_PASSWORD }}@${{ database.RAILWAY_PRIVATE_DOMAIN }}:5432

# browser-facing Convex URLs use public domains
CONVEX_CLOUD_ORIGIN=https://<convex-api-public-domain>        # routes to 3210
CONVEX_SITE_ORIGIN=https://<convex-site-public-domain>        # routes to 3211
EXPO_PUBLIC_CONVEX_URL=https://<convex-api-public-domain>
EXPO_PUBLIC_CONVEX_SITE_URL=https://<convex-site-public-domain>
NEXT_PUBLIC_DEPLOYMENT_URL=https://<convex-api-public-domain>

# frontend pre-deploy -> Convex uses private networking
CONVEX_SELF_HOSTED_URL=http://${{ convex-backend.RAILWAY_PRIVATE_DOMAIN }}:3210
```

Public-vs-private rule: browser/client-facing values use public domains. Backend-to-database traffic and the frontend pre-deploy command use Railway private domains. Do not put `RAILWAY_PRIVATE_DOMAIN` into Expo public variables.

Convex API networking targets port `3210`; Better Auth HTTP/site routes require a separate browser-reachable origin targeting port `3211`. `/version` on `3210` returning `unknown` is acceptable when the HTTP status is 200.

## Frontend Pattern

Use Expo Router.

Use `ConvexBetterAuthProvider` at the root, then use Convex React hooks for authenticated server state:

```ts
useQuery(api.tasks.list, args)
useMutation(api.tasks.create)
useAction(api.ai.preview)
```

Keep UI state local unless global state is truly needed.

## Backend Pattern

Use Convex function modules:

```txt
convex/
  auth.ts
  http.ts
  health.ts
  tasks.ts
  ai.ts
  aiInternal.ts
```

Use helpers for reusable backend logic:

```txt
convex/lib/
  auth.ts
  aiSchemas.ts
  openai.ts
  prompt.ts
  serializers.ts
```

## Database Pattern

Use Convex schema:

```txt
apps/mobile/convex/schema.ts
```

Tasks use `ownerId` to isolate data per Better Auth / Convex JWT subject. Existing pre-auth tasks without `ownerId` are hidden after account mode is enabled.

## AI Safety Pattern

AI task control must use:

```txt
preview
  -> validate
  -> confirm
  -> execute
```

AI preview/execute require authentication and only operate on the authenticated user's tasks.

Never:

- execute AI-generated SQL
- let AI choose arbitrary tables
- let AI bypass validation
- let AI directly mutate the database
- expose OpenAI or Better Auth secrets to the frontend

## SPA Routing Pattern

Expo config:

```ts
web: {
  bundler: 'metro',
  output: 'single'
}
```

The static host should return `index.html` for non-file routes.

## Convex Pattern

Run during development:

```bash
pnpm --filter @icarun/mobile convex:dev
```

Railway separates the frontend phases:

```bash
pnpm run railway:build:frontend   # Expo export only
pnpm run railway:deploy:frontend  # bounded env sync + Convex deploy
```

Required frontend build/deploy variables:

```env
EXPO_PUBLIC_CONVEX_URL
EXPO_PUBLIC_CONVEX_SITE_URL
CONVEX_SELF_HOSTED_URL
CONVEX_SELF_HOSTED_ADMIN_KEY
CONVEX_ENV_BETTER_AUTH_SECRET
CONVEX_ENV_SITE_URL
```

Generated files under `apps/mobile/convex/_generated/` should be committed. Local runtime files under `apps/mobile/.convex/` should not be committed.
