# Implementation Plan

This plan should be followed when implementing icarun with Convex.

## Principles

- Use pnpm for all commands.
- Use Convex for persistence and backend functions.
- Do not use PostgreSQL, Drizzle ORM, drizzle-kit, Prisma, or Express unless explicitly requested.
- Keep secrets server-side in Convex deployment environment variables.
- Preserve Expo Web as an SPA using `web.output: 'single'`.
- Validate Convex function arguments with `convex/values` validators.
- Validate all AI outputs with Zod.
- AI operations must use preview -> confirmation -> execute.

## Phase 1 — Workspace Foundation

Create the monorepo foundation:

```txt
pnpm-workspace.yaml
apps/mobile/
```

Root package goals:

- private workspace root
- pnpm scripts for build/typecheck/Convex
- no npm/yarn commands

Recommended root scripts:

```json
{
  "scripts": {
    "dev": "pnpm --filter @icarun/mobile dev",
    "dev:web": "pnpm --filter @icarun/mobile web",
    "convex:dev": "pnpm --filter @icarun/mobile convex:dev",
    "convex:deploy": "pnpm --filter @icarun/mobile convex:deploy",
    "build": "pnpm --filter @icarun/mobile build",
    "typecheck": "pnpm -r typecheck"
  }
}
```

## Phase 2 — Expo App

Create `apps/mobile` using Expo + TypeScript.

Use:

- Expo Router
- React Native Web
- Convex React client
- `#/*` path alias for `src`
- `@/*` path alias for app root/Convex generated imports

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

## Phase 3 — Convex Backend Foundation

Add:

- `convex`
- `apps/mobile/convex.json`
- `apps/mobile/convex/schema.ts`
- `apps/mobile/convex/health.ts`

Run:

```bash
pnpm --filter @icarun/mobile convex:dev
```

This creates a deployment, writes `EXPO_PUBLIC_CONVEX_URL`, and generates `convex/_generated`.

## Phase 4 — Task CRUD Functions

Implement:

```txt
api.tasks.list
api.tasks.get
api.tasks.create
api.tasks.update
api.tasks.remove
```

Use Convex `v` validators for arguments.

## Phase 5 — Web/Convex Integration

Create Convex client:

```txt
apps/mobile/src/lib/convex.ts
```

Wrap the app with `ConvexProvider`.

Use:

```env
EXPO_PUBLIC_CONVEX_URL
```

Never reference server secrets in client code.

## Phase 6 — Task UI

Implement:

- task list
- status filters
- task creation
- task detail
- edit task
- complete task
- delete task
- settings health display

## Phase 7 — OpenAI-Compatible Action

Create backend helpers:

```txt
apps/mobile/convex/lib/openai.ts
apps/mobile/convex/lib/prompt.ts
apps/mobile/convex/lib/aiSchemas.ts
```

Use Convex env:

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

## Phase 8 — AI Preview Action

Implement:

```txt
api.ai.preview
```

Responsibilities:

- validate request args
- load relevant current tasks if needed
- call OpenAI-compatible API from Convex action
- parse JSON
- validate AI actions with Zod
- return proposed actions
- never mutate tasks

## Phase 9 — AI Execute Action

Implement:

```txt
api.ai.execute
```

Responsibilities:

- validate submitted actions
- verify task IDs exist for update/delete
- require confirmation for delete and bulk actions
- execute allowed operations only through task mutations
- log operation result

## Phase 10 — AI Command UI

Frontend flow:

```txt
User input
  -> preview
  -> show proposed changes
  -> confirm/cancel
  -> execute
  -> Convex realtime query updates UI
```

Never execute AI output immediately from preview.

## Phase 11 — Deployment

Build the frontend independently of the backend:

```bash
pnpm build
```

Deploy Convex functions separately:

```bash
pnpm convex:deploy
```

On Railway, run bounded function-environment synchronization and Convex deploy
in pre-deploy. GitHub Actions orders database -> Convex backend -> dashboard ->
frontend and waits for each deployment/readiness check. Runtime dependency waits
remain bounded so independent manual restarts can tolerate dependencies becoming
ready within the overall deadline.

Static build output:

```txt
apps/mobile/dist
```

Host the output on an SPA-compatible static host.

## Phase 12 — Verification

Run when possible:

```bash
pnpm install
pnpm --filter @icarun/mobile convex:dev
pnpm typecheck
pnpm build
```

Verify:

- `api.health.check` works
- task CRUD works
- Expo Web app loads
- `/tasks/:id` refresh works on deployed static host
- AI preview rejects invalid output
- AI execute requires confirmation
- OpenAI key stays server-side