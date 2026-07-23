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
  start: pnpm run railway:start:frontend

convex-backend
  package: @icarun/convex-backend
  image wrapper: ghcr.io/get-convex/convex-backend:latest
  api port: 3210
  http/site/auth port: 3211

convex-dashboard
  package: @icarun/convex-dashboard
  image wrapper: ghcr.io/get-convex/convex-dashboard:latest

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
CONVEX_SELF_HOSTED_URL=https://<convex-api-public-domain>
NEXT_PUBLIC_DEPLOYMENT_URL=https://<convex-api-public-domain>
```

Public-vs-private rule: browser/client-facing values use public domains; server-to-server database traffic uses Railway private domains. Do not put `RAILWAY_PRIVATE_DOMAIN` into Expo public variables.

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

Run for Railway frontend deploy/build against self-hosted Convex:

```bash
pnpm run railway:build:frontend
```

Required frontend build/deploy variables:

```env
EXPO_PUBLIC_CONVEX_URL
EXPO_PUBLIC_CONVEX_SITE_URL
SITE_URL
CONVEX_SELF_HOSTED_URL
CONVEX_SELF_HOSTED_ADMIN_KEY
```

Generated files under `apps/mobile/convex/_generated/` should be committed. Local runtime files under `apps/mobile/.convex/` should not be committed.
