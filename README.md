# icarun

icarun is a task management application inspired by Bluesky's Expo / React Native / React Native Web architecture.

The app is designed as a web-first SPA with a server-side API and AI-assisted task control.

```txt
Expo / React Native Web SPA
        |
        v
Express API Server
        |
        +--> PostgreSQL via Drizzle ORM
        |
        +--> OpenAI-compatible Chat Completions API
```

## Core Goals

- Build a deployable task management MVP.
- Use Expo + React Native Web for the frontend.
- Use Express for the API server.
- Use PostgreSQL for persistence.
- Use Drizzle ORM and drizzle-kit, not Prisma.
- Support OpenAI-compatible providers for natural language task control.
- Deploy to Railway or a similar Node.js-compatible PaaS.
- Keep all secrets server-side.

## Why Drizzle

Drizzle is chosen over Prisma because PaaS deployment simplicity is important for this project.

Compared with Prisma, Drizzle avoids:

- Prisma Client generation as a required deployment step.
- Prisma query engine binary/runtime concerns.
- Extra deployment-time moving parts.

For this app's initial needs — tasks, AI operation logs, and simple filtering — Drizzle provides enough type safety while keeping deployment lightweight.

## Intended Workspace Layout

```txt
icarun/
  package.json
  pnpm-workspace.yaml
  railway.json
  .env.example
  README.md
  docs/

  apps/
    mobile/   # Expo / React Native Web app
    server/   # Express / Drizzle / PostgreSQL API server
```

## Frontend

The frontend should use:

- Expo
- React Native
- React Native Web
- Expo Router
- TypeScript
- React Query

Expo Web must be built as a SPA:

```ts
web: {
  bundler: 'metro',
  output: 'single'
}
```

This is required because task detail routes such as `/tasks/[id]` are dynamic and cannot be statically generated ahead of time.

## Backend

The backend should use:

- Express
- TypeScript
- PostgreSQL
- Drizzle ORM
- drizzle-kit
- Zod
- OpenAI-compatible Chat Completions API

The server serves both:

1. `/api/*` API routes
2. Expo Web static files from `apps/server/web-build`

Non-API routes must fall back to `index.html` for SPA routing.

## AI Safety Model

AI must not directly mutate the database.

The required flow is:

```txt
User command
  -> preview endpoint
  -> server validates AI output
  -> user confirms
  -> execute endpoint
  -> server mutates database
```

AI output must be parsed and validated with Zod before execution.

## Required API Routes

```txt
GET    /api/health

GET    /api/tasks
GET    /api/tasks/:id
POST   /api/tasks
PATCH  /api/tasks/:id
DELETE /api/tasks/:id

POST   /api/ai/commands/preview
POST   /api/ai/commands/execute
```

## Environment

Copy `.env.example` to the appropriate app-local `.env` files during implementation.

Secrets such as `OPENAI_API_KEY`, `DATABASE_URL`, and `APP_ACCESS_TOKEN` must never be exposed to Expo client code.

Only `EXPO_PUBLIC_*` values may be referenced from the Expo app.

## Railway Deployment

Railway should run the app as a single Node.js service.

Expected lifecycle:

```bash
pnpm install
pnpm build
pnpm --filter @icarun/server db:migrate
pnpm start
```

The Express server must listen on `process.env.PORT` and bind to `0.0.0.0`.

## Documentation

Important pre-implementation docs:

- `docs/implementation-plan.md`
- `docs/api-contract.md`
- `docs/ai-contract.md`
- `docs/database.md`
- `docs/deployment.md`
- `docs/security.md`
- `docs/adr/0001-use-drizzle.md`

## Current State

This is currently a greenfield project with project memory and design docs prepared. Application code has not yet been implemented.
