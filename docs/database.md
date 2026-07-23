# Database Design

icarun uses Convex for persistence and backend functions.

Do not use PostgreSQL, Drizzle ORM, drizzle-kit, Prisma, or SQL migrations unless explicitly requested later.

## Why Convex

Convex is chosen because the project owner requested it and because it fits the MVP well:

- realtime task updates via `convex/react`
- TypeScript backend functions
- built-in query / mutation / action model
- no separate Express REST API server
- no ORM or migration layer
- server-side environment variables for OpenAI-compatible provider secrets

## Schema

Expected path:

```txt
apps/mobile/convex/schema.ts
```

Convex schema example:

```ts
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    description: v.union(v.string(), v.null()),
    status: v.union(
      v.literal('todo'),
      v.literal('in_progress'),
      v.literal('done'),
      v.literal('archived')
    ),
    priority: v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high')
    ),
    dueDate: v.union(v.string(), v.null()),
    tags: v.array(v.string()),
    updatedAt: v.string()
  })
})
```

Convex automatically adds `_id` and `_creationTime` to every document.

## Table: tasks

Purpose: stores user tasks.

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

## Table: aiOperationLogs

Purpose: audit AI preview and execute behavior.

Recommended fields:

```txt
input
actions
result
status
_creationTime
```

Recommended statuses:

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

PostgreSQL is only used as the internal persistence layer for self-hosted Convex on Railway. Application code must still use Convex queries, mutations, and actions rather than connecting to PostgreSQL directly.

When using the repository-managed `postgres:17` service on Railway, attach the volume at:

```txt
/var/lib/postgresql/data
```

Set PostgreSQL's data directory to a subdirectory under that mount:

```env
PGDATA=/var/lib/postgresql/data/pgdata
```

Railway volumes can contain `lost+found` at the mount root. If PostgreSQL initializes directly in `/var/lib/postgresql/data`, `initdb` may fail with `directory exists but is not empty`. Using the `pgdata` subdirectory avoids that failure while keeping the data on the persistent volume.

Convex connects to Postgres with a URL that does not include the database name:

```env
POSTGRES_URL=postgresql://${{ database.POSTGRES_USER }}:${{ database.POSTGRES_PASSWORD }}@${{ database.RAILWAY_PRIVATE_DOMAIN }}:5432
```

With `INSTANCE_NAME=convex-self-hosted`, Convex uses the database named `convex_self_hosted`.

## Codegen / Deployment Policy

Run Convex tooling when schema or functions change:

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
- Verify task existence before update/delete.
- Require confirmation for destructive or bulk AI actions.