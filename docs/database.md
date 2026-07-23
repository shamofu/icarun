# Database Design

icarun uses Convex for persistence, backend functions, and Better Auth integration.

Do not use PostgreSQL, Drizzle ORM, drizzle-kit, Prisma, or SQL migrations for application data unless explicitly requested later.

## Why Convex

Convex is chosen because the project owner requested it and because it fits the MVP well:

- realtime task updates via `convex/react`
- TypeScript backend functions
- built-in query / mutation / action / HTTP route model
- Better Auth integration via `@convex-dev/better-auth`
- no separate Express REST API server
- no ORM or migration layer for application data
- server-side environment variables for OpenAI-compatible provider and auth secrets

## Schema

Expected path:

```txt
apps/mobile/convex/schema.ts
```

Current app schema shape:

```ts
export default defineSchema({
  tasks: defineTable({
    ownerId: v.optional(v.string()),
    title: v.string(),
    description: v.union(v.string(), v.null()),
    status: taskStatusValidator,
    priority: taskPriorityValidator,
    dueDate: v.union(v.string(), v.null()),
    tags: v.array(v.string()),
    updatedAt: v.string()
  })
    .index('by_owner', ['ownerId'])
    .index('by_owner_status', ['ownerId', 'status'])
    .index('by_owner_priority', ['ownerId', 'priority']),

  aiOperationLogs: defineTable({
    ownerId: v.optional(v.string()),
    input: v.string(),
    actions: v.optional(v.any()),
    result: v.optional(v.any()),
    status: aiLogStatusValidator
  }).index('by_owner', ['ownerId'])
})
```

Convex automatically adds `_id` and `_creationTime` to every document.

Better Auth component tables are generated and managed by `@convex-dev/better-auth`; do not manually edit those generated component tables.

## Table: tasks

Purpose: stores user tasks.

Important fields:

```txt
ownerId   Better Auth / Convex JWT subject for the owning user
title
description
status
priority
dueDate
tags
updatedAt
```

`ownerId` is optional only to keep existing pre-auth local documents schema-valid. New task writes require auth and always set `ownerId`; reads only return tasks for the authenticated user.

Application-facing TypeScript shape:

```ts
type Task = {
  id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done' | 'archived'
  priority: 'low' | 'medium' | 'high'
  dueDate: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
}
```

Mapping from Convex document to app type:

```txt
id        <- _id
createdAt <- new Date(_creationTime).toISOString()
```

`ownerId` is not exposed in the app-facing `Task` shape.

## Table: aiOperationLogs

Purpose: audit AI preview and execute behavior.

Fields:

```txt
ownerId
input
actions
result
status
_creationTime
```

Statuses:

```txt
previewed
executed
rejected
parse_error
validation_error
provider_error
execution_error
```

## Tags

Use `v.array(v.string())` for tags in the MVP.

If tag management becomes complex later, add normalized documents or derived indexes as needed.

## Self-hosted PostgreSQL on Railway

PostgreSQL is only used as the internal persistence layer for self-hosted Convex on Railway. Application code must still use Convex queries, mutations, actions, and HTTP routes rather than connecting to PostgreSQL directly.

When using the repository-managed `postgres:17` service on Railway, attach the volume at:

```txt
/var/lib/postgresql/data
```

Set PostgreSQL's data directory to a subdirectory under that mount:

```env
PGDATA=/var/lib/postgresql/data/pgdata
```

Convex connects to Postgres with a URL that does not include the database name:

```env
POSTGRES_URL=postgresql://${{ database.POSTGRES_USER }}:${{ database.POSTGRES_PASSWORD }}@${{ database.RAILWAY_PRIVATE_DOMAIN }}:5432
```

With `INSTANCE_NAME=convex-self-hosted`, Convex uses the database named `convex_self_hosted`.

## Codegen / Deployment Policy

Run Convex tooling when schema, auth component config, or functions change:

```bash
pnpm --filter @icarun/mobile convex:dev
```

Generated files in `apps/mobile/convex/_generated/` should be committed.

Local Convex runtime state in `apps/mobile/.convex/` must not be committed.

## Database Safety

- Do not execute AI-generated SQL.
- AI actions must not directly write task documents.
- AI actions call validated task mutations for writes.
- Validate all AI output with Zod before execution.
- Verify task existence and ownership before update/delete.
- Require authentication for task and AI operations.
