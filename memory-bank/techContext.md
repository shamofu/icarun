# Tech Context

## Runtime

Use Node.js for local tooling and Expo/Convex development.

Railway/Nixpacks runtime is pinned to Node.js 22 LTS (`engines.node: 22.x` and `.nvmrc: 22`). The root `package.json` intentionally omits both the legacy top-level `packageManager` field and pnpm 11 `devEngines.packageManager` so Railway can use its detected pnpm version and the lockfile stays pnpm-9-readable.

Current local environment has been verified with:

```txt
Node 24.18.0
pnpm 11.13.1
```

## Package Manager

Use pnpm.

Do not use npm or yarn unless explicitly requested.

## Workspace

The repository is a pnpm workspace:

```txt
apps/*
services/*
```

Current deployable workspace packages:

```txt
@icarun/mobile
@icarun/convex-backend
@icarun/convex-dashboard
@icarun/database
```

## Frontend Stack

Use:

- Expo SDK 57
- React 19
- React Native 0.86
- React Native Web 0.21
- Expo Router 57
- TypeScript 6
- Convex React client

## Backend Stack

Use:

- Self-hosted Convex on Railway
- TypeScript Convex functions
- Convex schema validators (`convex/values`)
- Zod for AI output validation
- OpenAI-compatible Chat Completions API from Convex actions

## Database

Use Convex as the application database/backend source of truth.

Self-hosted Convex persists internally to a PostgreSQL service on Railway. PostgreSQL is not application-facing. Do not add Drizzle ORM, drizzle-kit, Prisma, or Express.

## Deployment

Target Railway services:

```txt
frontend           @icarun/mobile
convex-backend     @icarun/convex-backend
convex-dashboard   @icarun/convex-dashboard
database           @icarun/database
```

Docker Compose is intentionally not used.

Railway config-as-code applies to one service, so each service has its own `railway.json`:

```txt
railway.json
apps/mobile/railway.json
services/convex-backend/railway.json
services/convex-dashboard/railway.json
services/database/railway.json
```

## Environment Variables

Frontend-safe:

```env
EXPO_PUBLIC_CONVEX_URL=https://your-convex-backend.up.railway.app
```

Frontend build/deploy secret for self-hosted Convex:

```env
CONVEX_SELF_HOSTED_URL=https://your-convex-backend.up.railway.app
CONVEX_SELF_HOSTED_ADMIN_KEY=your-admin-key
```

Convex backend server-only:

```env
INSTANCE_SECRET=replace-with-a-long-random-secret
INSTANCE_NAME=convex-self-hosted
POSTGRES_URL=postgresql://convex:password@database.railway.internal:5432
DO_NOT_REQUIRE_SSL=1
CONVEX_CLOUD_ORIGIN=https://your-convex-backend.up.railway.app
CONVEX_SITE_ORIGIN=https://your-convex-backend.up.railway.app
OPENAI_API_KEY=sk-your-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
```

Dashboard:

```env
NEXT_PUBLIC_DEPLOYMENT_URL=https://your-convex-backend.up.railway.app
```

Database:

```env
POSTGRES_USER=convex
POSTGRES_PASSWORD=replace-with-db-password
POSTGRES_DB=convex_self_hosted
```

Never expose these to the frontend as public Expo variables:

```env
OPENAI_API_KEY
OPENAI_BASE_URL
OPENAI_MODEL
CONVEX_SELF_HOSTED_ADMIN_KEY
INSTANCE_SECRET
POSTGRES_URL
POSTGRES_PASSWORD
```

## Root Scripts

```json
{
  "scripts": {
    "dev": "pnpm --filter @icarun/mobile dev",
    "dev:web": "pnpm --filter @icarun/mobile web",
    "convex:dev": "pnpm --filter @icarun/mobile convex:dev",
    "convex:deploy": "pnpm --filter @icarun/mobile convex:deploy",
    "build": "pnpm --filter @icarun/mobile build",
    "typecheck": "pnpm -r typecheck",
    "railway:build": "pnpm run railway:build:frontend",
    "railway:build:frontend": "pnpm --filter @icarun/mobile convex:deploy",
    "railway:start": "pnpm run railway:start:frontend",
    "railway:start:frontend": "serve apps/mobile/dist --single",
    "start": "pnpm run railway:start:frontend"
  }
}
```

## Mobile Scripts

```json
{
  "scripts": {
    "dev": "expo start",
    "web": "expo start --web",
    "build": "expo export --platform web --output-dir dist",
    "convex:dev": "convex dev",
    "convex:deploy": "convex deploy --cmd-url-env-var-name EXPO_PUBLIC_CONVEX_URL --cmd \"expo export --platform web --output-dir dist\"",
    "typecheck": "tsc --noEmit"
  }
}
```

## Convex Notes

`pnpm --filter @icarun/mobile convex:dev` configures a deployment, pushes functions, and regenerates `convex/_generated`.

For self-hosted production deploy, set `CONVEX_SELF_HOSTED_URL` and `CONVEX_SELF_HOSTED_ADMIN_KEY` on the Railway frontend service, then run `pnpm run railway:build:frontend`.

Generated files under `apps/mobile/convex/_generated/` should be committed.

Local files under `apps/mobile/.convex/` and `apps/mobile/.env.local` should not be committed.

## Railway pnpm/Corepack Note

Do not add the legacy top-level `packageManager` field or pnpm 11 `devEngines.packageManager` back to the root `package.json` without re-validating Railway. The top-level `packageManager` previously routed pnpm through Corepack, and `devEngines.packageManager` caused pnpm 11 to write an extra `packageManagerDependencies` YAML document that Railway pnpm 9 rejected with `ERR_PNPM_BROKEN_LOCKFILE`.
