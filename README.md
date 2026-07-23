# icarun

icarun is a task management application inspired by Bluesky's Expo / React Native / React Native Web architecture.

The app is designed as a Convex-backed SPA deployed from a pnpm workspace to Railway services:

```txt
Expo / React Native Web SPA
        |
        | convex/react + Better Auth client
        v
Self-hosted Convex backend on Railway
        +--> Better Auth HTTP routes (/api/auth/*)
        +--> PostgreSQL persistence used internally by Convex
        +--> Convex actions for OpenAI-compatible Chat Completions API
```

## Core Goals

- Build a deployable task management MVP.
- Use Expo + React Native Web for the frontend.
- Use Convex for persistence, backend functions, realtime updates, and auth integration.
- Support Better Auth email/password accounts with per-user task isolation.
- Support OpenAI-compatible providers for natural language task control.
- Keep all secrets server-side in Convex deployment environment variables.
- Keep the web app deployable as an SPA.

## Why Convex

Convex replaces the previous PostgreSQL + Drizzle + Express application plan. It provides:

- a realtime database
- TypeScript backend functions
- queries, mutations, actions, and HTTP routes
- generated end-to-end types
- simple client integration via `convex/react`
- server-side environment variables for AI and auth secrets

PostgreSQL is only used internally by self-hosted Convex and is not accessed by application code.

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
- Better Auth (`@convex-dev/better-auth` + `better-auth` + `@better-auth/expo`)

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

Important functions/routes:

```txt
api.health.check
api.auth.getCurrentUser
api.tasks.list
api.tasks.get
api.tasks.create
api.tasks.update
api.tasks.remove
api.ai.preview
api.ai.execute
HTTP /api/auth/* via convex/http.ts
```

The Convex schema is defined in:

```txt
apps/mobile/convex/schema.ts
```

Tasks now store `ownerId` and all task CRUD operations require an authenticated Convex identity. Existing pre-auth tasks without `ownerId` are intentionally hidden after account mode is enabled.

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

AI preview/execute require authentication and only use the current user's tasks as LLM context.

## Environment

Frontend-safe values:

```env
EXPO_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
EXPO_PUBLIC_CONVEX_SITE_URL=http://127.0.0.1:3211
```

`EXPO_PUBLIC_CONVEX_URL` is the Convex API origin. `EXPO_PUBLIC_CONVEX_SITE_URL` is the Convex HTTP/site origin used by Better Auth `/api/auth/*` routes.

Server-only values must be set on the Convex deployment/backend, not in Expo client code:

```bash
npx convex env set OPENAI_API_KEY sk-your-key
npx convex env set OPENAI_BASE_URL https://api.openai.com/v1
npx convex env set OPENAI_MODEL gpt-4.1-mini
npx convex env set BETTER_AUTH_SECRET <long-random-secret>
npx convex env set SITE_URL <frontend-origin>
```

Never expose `OPENAI_API_KEY`, `BETTER_AUTH_SECRET`, or `CONVEX_SELF_HOSTED_ADMIN_KEY` to frontend code.

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

Better Auth adds one important Railway requirement: the self-hosted Convex backend serves API traffic on port `3210` and HTTP actions on port `3211`. The app needs public browser-reachable origins for both:

```env
EXPO_PUBLIC_CONVEX_URL=https://<convex-api-public-domain>       # routes to 3210
EXPO_PUBLIC_CONVEX_SITE_URL=https://<convex-site-public-domain> # routes to 3211
```

Expose both origins from the single `convex-backend` service: in its Railway Public Networking section, generate one domain targeting port `3210` (API) and one targeting port `3211` (HTTP actions / Better Auth). See `docs/deployment.md` for the full Railway variable list.

Railway Skipped Builds are configured through `build.watchPatterns` in each service `railway.json`. The frontend service uses Railpack (`build.builder: "RAILPACK"`); the Convex backend, dashboard, and database services remain Dockerfile builders because they wrap official upstream images.

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

The project now includes an Expo + Convex MVP with Better Auth email/password accounts, per-user task isolation, task CRUD, AI preview/execute functions, and local Convex validation.
