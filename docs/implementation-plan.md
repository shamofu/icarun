# Implementation Plan

This plan should be followed when implementing icarun from the current greenfield state.

## Principles

- Use pnpm for all commands.
- Use Drizzle ORM and drizzle-kit, not Prisma.
- Keep secrets server-side.
- Preserve Railway deployability at every phase.
- Keep Expo Web as an SPA using `web.output: 'single'`.
- Validate all API inputs with Zod.
- Validate all AI outputs with Zod.
- AI operations must use preview → confirmation → execute.

## Phase 1 — Workspace Foundation

Create the monorepo foundation:

```txt
pnpm-workspace.yaml
apps/mobile/
apps/server/
```

Root package goals:

- private workspace root
- pnpm scripts for build/start/typecheck
- no npm/yarn commands

Recommended root scripts:

```json
{
  "scripts": {
    "dev": "pnpm --parallel --filter @icarun/server --filter @icarun/mobile dev",
    "dev:server": "pnpm --filter @icarun/server dev",
    "dev:mobile": "pnpm --filter @icarun/mobile dev",
    "build": "pnpm --filter @icarun/mobile build:web && pnpm --filter @icarun/server build",
    "start": "pnpm --filter @icarun/server start",
    "typecheck": "pnpm -r typecheck"
  }
}
```

## Phase 2 — Express Server Skeleton

Create `apps/server` with:

- TypeScript
- Express
- Zod
- `/api/health`
- consistent JSON error shape
- environment validation
- CORS allowlist

Server must listen with:

```ts
const port = Number(process.env.PORT) || 3000
app.listen(port, '0.0.0.0')
```

## Phase 3 — Drizzle and PostgreSQL

Add:

- `drizzle-orm`
- `drizzle-kit`
- `postgres` or another Drizzle-compatible PostgreSQL driver
- `apps/server/drizzle.config.ts`
- `apps/server/src/db.ts`
- `apps/server/src/schema/*`

Initial tables:

- `tasks`
- `ai_operation_logs`

Generate migrations using drizzle-kit.

Do not use `db:push` in production.

## Phase 4 — Task CRUD API

Implement:

```txt
GET    /api/tasks
GET    /api/tasks/:id
POST   /api/tasks
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
```

Add Zod schemas for:

- create task body
- update task body
- route params
- task list filters

Protect mutation endpoints with bearer auth if `APP_ACCESS_TOKEN` is configured.

## Phase 5 — Expo App

Create `apps/mobile` using Expo + TypeScript.

Use:

- Expo Router
- React Native Web
- React Query
- `#/*` path alias

Initial routes:

```txt
/
/tasks/[id]
/settings
```

Configure Expo Web as SPA:

```ts
web: {
  bundler: 'metro',
  output: 'single'
}
```

## Phase 6 — Web/API Integration

Create API client:

```txt
apps/mobile/src/lib/api.ts
```

Use only:

```env
EXPO_PUBLIC_API_BASE_URL
```

Never reference server secrets in client code.

Add React Query hooks:

- `useTasks`
- `useTask`
- `useCreateTask`
- `useUpdateTask`
- `useDeleteTask`

## Phase 7 — Static Serving and SPA Fallback

Expo Web build output:

```txt
apps/server/web-build
```

Recommended mobile script:

```json
{
  "build:web": "expo export --platform web --output-dir ../server/web-build"
}
```

Express route order:

1. API routes
2. static assets
3. SPA fallback to `index.html`

## Phase 8 — OpenAI-Compatible Client

Create server-side client:

```txt
apps/server/src/services/openaiClient.ts
```

Use env:

```env
OPENAI_API_KEY
OPENAI_BASE_URL
OPENAI_MODEL
```

Default request:

```json
{
  "temperature": 0.1,
  "response_format": {
    "type": "json_object"
  }
}
```

If provider rejects `response_format`, retry without it when appropriate.

## Phase 9 — AI Preview Endpoint

Implement:

```txt
POST /api/ai/commands/preview
```

Responsibilities:

- validate request body
- load relevant current tasks if needed
- call OpenAI-compatible API
- parse JSON
- validate AI actions with Zod
- return proposed actions
- never mutate DB

## Phase 10 — AI Execute Endpoint

Implement:

```txt
POST /api/ai/commands/execute
```

Responsibilities:

- validate submitted actions
- verify task IDs exist for update/delete
- require confirmation for delete and bulk actions
- execute allowed operations only
- log operation result

## Phase 11 — AI Command UI

Frontend flow:

```txt
User input
  -> preview
  -> show proposed changes
  -> confirm/cancel
  -> execute
  -> invalidate/refetch tasks
```

Never execute AI output immediately from preview.

## Phase 12 — Auth and Rate Limiting

Add simple bearer auth for:

- task mutations
- AI endpoints

Add rate limiting for:

- AI preview
- AI execute

## Phase 13 — Railway Deployment

Add:

```txt
railway.json
```

Expected lifecycle:

```bash
pnpm build
pnpm --filter @icarun/server db:migrate
pnpm start
```

Configure Railway variables:

- `DATABASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`
- `APP_ACCESS_TOKEN`
- `NODE_ENV=production`

## Phase 14 — Verification

Run when possible:

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm start
```

Verify:

- `/api/health`
- task CRUD
- Expo Web app loads
- `/tasks/:id` refresh works
- AI preview rejects invalid output
- AI execute requires confirmation
- secrets are not in frontend bundle
