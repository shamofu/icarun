# System Patterns

## High-Level Architecture

```txt
Expo / React Native Web SPA
        |
        | convex/react
        v
Self-hosted Convex backend on Railway
        |
        +--> PostgreSQL persistence used internally by Convex
        |
        +--> Convex action -> OpenAI-compatible Chat Completions API
```

The application still treats Convex as the database/backend source of truth. PostgreSQL is not an application-facing database and must not be accessed directly by frontend/backend app code.

## Railway Monorepo Deployment Pattern

Do not use Docker Compose for Railway deployment.

Railway config-as-code (`railway.json`) configures one Railway service/deployment. The repository manages multiple services through pnpm workspace packages, each with a service-specific `railway.json`:

```txt
railway.json                                  # frontend default / root compatibility
apps/mobile/railway.json                     # frontend service
services/convex-backend/railway.json         # self-hosted Convex backend service
services/convex-dashboard/railway.json       # self-hosted Convex dashboard service
services/database/railway.json               # PostgreSQL service
```

Railway services should all point at the same GitHub repository. Configure each service to use the appropriate config file path. Keep the repository root visible so pnpm workspace files are available.

## Service Layout

```txt
frontend
  package: @icarun/mobile
  build: pnpm run railway:build:frontend
  start: pnpm run railway:start:frontend

convex-backend
  package: @icarun/convex-backend
  image wrapper: ghcr.io/get-convex/convex-backend:latest

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

# browser-facing Convex URLs use the backend public domain
CONVEX_CLOUD_ORIGIN=https://${{ RAILWAY_PUBLIC_DOMAIN }}
CONVEX_SITE_ORIGIN=https://${{ RAILWAY_PUBLIC_DOMAIN }}
EXPO_PUBLIC_CONVEX_URL=${{ convex-backend.CONVEX_CLOUD_ORIGIN }}
CONVEX_SELF_HOSTED_URL=${{ convex-backend.CONVEX_CLOUD_ORIGIN }}
NEXT_PUBLIC_DEPLOYMENT_URL=${{ convex-backend.CONVEX_CLOUD_ORIGIN }}
```

Public-vs-private rule: browser/client-facing values use Railway public domains; server-to-server database traffic uses Railway private domains. Do not put `RAILWAY_PRIVATE_DOMAIN` into Expo public variables.

Convex backend should set `PORT=3210`, and its Railway Public Networking target port should be `3210`. `/version` returning `unknown` is acceptable when the HTTP status is 200.

## Frontend Pattern

Use Expo Router.

Use Convex React hooks for server state:

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
  health.ts
  tasks.ts
  ai.ts
  aiInternal.ts
```

Use helpers for reusable backend logic:

```txt
convex/lib/
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

Convex automatically adds `_id` and `_creationTime`. Map them to app-facing `id` and `createdAt` in serializers.

Self-hosted Convex persists internally to PostgreSQL on Railway. The Convex `POSTGRES_URL` must not include the database name or query parameters. With `INSTANCE_NAME=convex-self-hosted`, the database name is `convex_self_hosted`. Railway PostgreSQL must use `PGDATA=/var/lib/postgresql/data/pgdata` so `initdb` does not fail on a volume mount root containing `lost+found`.

## AI Safety Pattern

AI task control must use:

```txt
preview
  -> validate
  -> confirm
  -> execute
```

Never:

- execute AI-generated SQL
- let AI choose arbitrary tables
- let AI bypass validation
- let AI directly mutate the database
- expose OpenAI secrets to the frontend

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
CONVEX_SELF_HOSTED_URL
CONVEX_SELF_HOSTED_ADMIN_KEY
```

Generated files under `apps/mobile/convex/_generated/` should be committed.
Local runtime files under `apps/mobile/.convex/` should not be committed.
