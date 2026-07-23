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

Use pnpm. Do not use npm or yarn unless explicitly requested.

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
- Better Auth (`@convex-dev/better-auth`, `better-auth`, `@better-auth/expo`)

## Backend Stack

Use:

- Self-hosted Convex on Railway
- TypeScript Convex functions
- Convex schema validators (`convex/values`)
- `@convex-dev/better-auth` component for auth persistence/JWT integration
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

Railway config-as-code applies to one service, so each service has its own `railway.json`.

## Environment Variables

Recommended Railway variable wiring:

```env
# frontend service
EXPO_PUBLIC_CONVEX_URL=https://<convex-api-public-domain>
EXPO_PUBLIC_CONVEX_SITE_URL=https://<convex-site-public-domain>
SITE_URL=https://<frontend-public-domain>
CONVEX_SELF_HOSTED_URL=https://<convex-api-public-domain>
CONVEX_SELF_HOSTED_ADMIN_KEY=${{ shared.CONVEX_SELF_HOSTED_ADMIN_KEY }}

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
OPENAI_API_KEY=sk-your-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini

# convex-dashboard service
NEXT_PUBLIC_DEPLOYMENT_URL=https://<convex-api-public-domain>

# database service
POSTGRES_USER=convex
POSTGRES_PASSWORD=replace-with-db-password
POSTGRES_DB=convex_self_hosted
PGDATA=/var/lib/postgresql/data/pgdata
```

Public Railway domains are required for browser-facing Convex URLs. Convex API origin must route to port `3210`; Convex site/auth origin must route to port `3211`. Railway private domains are used only for `convex-backend` -> `database` traffic.

`/version` on the Convex API origin may return `unknown`; HTTP 200 and Railway healthy status are the success criteria.

Never expose these to the frontend as public Expo variables:

```env
OPENAI_API_KEY
OPENAI_BASE_URL
OPENAI_MODEL
CONVEX_SELF_HOSTED_ADMIN_KEY
BETTER_AUTH_SECRET
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

Do not add the legacy top-level `packageManager` field or pnpm 11 `devEngines.packageManager` back to the root `package.json` without re-validating Railway.


