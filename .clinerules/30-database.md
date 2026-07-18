# Database Rules — Convex

Use Convex for persistence and backend functions.

Do not use PostgreSQL, Drizzle ORM, drizzle-kit, Prisma, or SQL migrations unless explicitly requested later.

## Why Convex

Convex is preferred for this project because the user requested Convex and because the MVP benefits from:

- realtime client updates
- TypeScript backend functions
- built-in query/mutation/action model
- no separate Express API server
- no SQL/ORM migration layer
- server-side environment variables for AI secrets
- simpler frontend data fetching via `convex/react`

## Schema File

Expected path:

```txt
apps/mobile/convex/schema.ts
```

Expected shape:

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

Convex automatically adds:

```txt
_id
_creationTime
```

Map those to application-facing fields:

```txt
id = _id
createdAt = new Date(_creationTime).toISOString()
```

## Tables

### tasks

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

### aiOperationLogs

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

Use `string[]` / `v.array(v.string())` for tags in the MVP.

Do not over-engineer tags initially.

If tag features become complex, later add normalized structures or derived indexes as needed.

## Deployment / Codegen Policy

Run Convex tooling when backend functions or schema change:

```bash
pnpm --filter @icarun/mobile convex:dev
```

For production backend deployment:

```bash
pnpm --filter @icarun/mobile convex:deploy
```

Generated files under `apps/mobile/convex/_generated/` should be committed.

Local runtime files under `apps/mobile/.convex/` must not be committed.

## Database Safety

- Do not execute AI-generated SQL.
- AI actions must not write directly to Convex tables.
- AI actions must call validated mutations for writes.
- Validate all AI output before execution.
- Verify task existence before update/delete.
- Require confirmation for destructive or bulk AI actions.