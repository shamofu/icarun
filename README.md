# icarun

icarun is a task management application inspired by Bluesky's Expo / React Native / React Native Web architecture.

The app is now designed as a Convex-backed SPA deployed from a pnpm workspace to Railway services:

```txt
Expo / React Native Web SPA
        |
        | convex/react
        v
Self-hosted Convex backend on Railway
        +--> PostgreSQL persistence used internally by Convex
        +--> Convex actions for OpenAI-compatible Chat Completions API
```

## Core Goals

- Build a deployable task management MVP.
- Use Expo + React Native Web for the frontend.
- Use Convex for persistence, backend functions, and realtime updates.
- Support OpenAI-compatible providers for natural language task control.
- Keep all secrets server-side in Convex deployment environment variables.
- Keep the web app deployable as an SPA.

## Why Convex

Convex replaces the previous PostgreSQL + Drizzle + Express plan. It provides:

- a realtime database
- TypeScript backend functions
- queries, mutations, and actions
- generated end-to-end types
- simple client integration via `convex/react`
- server-side environment variables for AI provider secrets

Because Convex supplies the backend function layer, the MVP does not need an Express REST API server, Drizzle ORM, drizzle-kit migrations, Prisma, or a `DATABASE_URL`.

## Workspace Layout

```txt
icarun/
  package.json
  pnpm-workspace.yaml
  .env.example
  README.md
  docs/
  memory-bank/

  apps/
    mobile/
      app.config.ts
      app/
      src/
      convex/

  services/
    convex-backend/
    convex-dashboard/
    database/
```

## Frontend

The frontend uses:

- Expo
- React Native
- React Native Web
- Expo Router
- TypeScript
- Convex React client

Expo Web is built as a SPA:

```ts
web: {
  bundler: 'metro',
  output: 'single'
}
```

This is required because task detail routes such as `/tasks/[id]` are dynamic and created at runtime.

## Backend

The backend lives in:

```txt
apps/mobile/convex/
```

Important functions:

```txt
api.health.check
api.tasks.list
api.tasks.get
api.tasks.create
api.tasks.update
api.tasks.remove
api.ai.preview
api.ai.execute
```

The Convex schema is defined in:

```txt
apps/mobile/convex/schema.ts
```

## AI Safety Model

AI must not directly mutate the database.

The required flow is:

```txt
User command
  -> api.ai.preview
  -> Convex action calls OpenAI-compatible API
  -> server validates AI output with Zod
  -> frontend shows proposed changes
  -> user confirms
  -> api.ai.execute
  -> server validates again and runs Convex mutations
```

AI output must be parsed and validated with Zod before execution.

## Environment

Frontend-safe value:

```env
EXPO_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
```

This is written to `apps/mobile/.env.local` by `npx convex dev` for local development.

Server-only values must be set on the Convex deployment, not in Expo client code:

```bash
npx convex env set OPENAI_API_KEY sk-your-key
npx convex env set OPENAI_BASE_URL https://api.openai.com/v1
npx convex env set OPENAI_MODEL gpt-4.1-mini
```

Never expose `OPENAI_API_KEY` to frontend code.

## Development

Install dependencies:

```bash
pnpm install
```

Start / configure Convex:

```bash
pnpm --filter @icarun/mobile convex:dev
```

Start Expo Web:

```bash
pnpm --filter @icarun/mobile web
```

Run typecheck:

```bash
pnpm typecheck
```

Build the web SPA:

```bash
pnpm build
```

## Deployment

Deploy Convex backend and build the frontend:

```bash
pnpm --filter @icarun/mobile convex:deploy
```

The generated web build is written to:

```txt
apps/mobile/dist
```

Host that directory with any static hosting provider that supports SPA fallback to `index.html`.


## Railway Monorepo Services

Docker Compose is not used for Railway deployment. This repository is a pnpm workspace that manages all Railway services from one GitHub repository:

```txt
@icarun/mobile             -> frontend SPA
@icarun/convex-backend     -> self-hosted Convex backend image wrapper
@icarun/convex-dashboard   -> self-hosted Convex dashboard image wrapper
@icarun/database           -> PostgreSQL image wrapper for Convex persistence
```

Railway `railway.json` config-as-code applies to one service/deployment, so each deployable service has its own config file:

```txt
railway.json
apps/mobile/railway.json
services/convex-backend/railway.json
services/convex-dashboard/railway.json
services/database/railway.json
```

Create separate Railway services from the same repository and point each service at the matching config file path. PostgreSQL is only used internally by self-hosted Convex; application code continues to use Convex queries, mutations, and actions.

## Documentation

Important docs:

- `docs/implementation-plan.md`
- `docs/api-contract.md`
- `docs/ai-contract.md`
- `docs/database.md`
- `docs/deployment.md`
- `docs/security.md`
- `docs/adr/0002-use-convex.md`

## Current State

The project now includes a working Expo + Convex MVP skeleton with task CRUD, AI preview/execute functions, and local Convex validation.
