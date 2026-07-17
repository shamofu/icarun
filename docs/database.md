# Database Design

icarun uses PostgreSQL with Drizzle ORM and drizzle-kit.

Do not use Prisma.

## Why Drizzle

Drizzle is chosen because this project prioritizes PaaS deployment simplicity.

Compared with Prisma, Drizzle provides:

- no Prisma Client generation step
- no Prisma query engine binary
- lighter runtime
- fewer deployment-time moving parts
- explicit SQL-oriented migrations
- sufficient type safety for a small task-management app

## Database Driver

Use a Drizzle-compatible PostgreSQL driver such as `postgres`.

The final driver should be selected during dependency installation and verified against the installed Drizzle version.

## Drizzle Config

Expected path:

```txt
apps/server/drizzle.config.ts
```

Expected direction:

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
})
```

Confirm the exact config shape with the installed `drizzle-kit` version.

## Schema Files

Expected layout:

```txt
apps/server/src/schema/
  index.ts
  tasks.ts
  aiOperationLogs.ts
```

## Table: tasks

Purpose: stores user tasks.

Recommended fields:

```txt
id
title
description
status
priority
dueDate
tags
createdAt
updatedAt
```

Recommended TypeScript shape:

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

Recommended PostgreSQL choices:

- `uuid` or text IDs
- `pgEnum` for status
- `pgEnum` for priority
- `text[]` for tags initially
- `timestamp with time zone` for dates

Recommended enums:

```ts
export const taskStatus = pgEnum('task_status', [
  'todo',
  'in_progress',
  'done',
  'archived'
])

export const taskPriority = pgEnum('task_priority', [
  'low',
  'medium',
  'high'
])
```

## Table: ai_operation_logs

Purpose: audit AI preview and execute behavior.

Recommended fields:

```txt
id
input
actions
result
status
createdAt
```

Recommended column types:

```txt
id: uuid or text
input: text
actions: jsonb
result: jsonb
status: text or enum
createdAt: timestamp with time zone
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

Use `text[]` for tags in the MVP.

Do not over-engineer tags initially.

If tag features become complex, later migrate to:

```txt
tags
task_tags
```

## Migration Policy

Use drizzle-kit migrations.

Recommended scripts:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

Use `db:generate` to create migration files.

Use `db:migrate` to apply migrations.

Use `db:push` only for local prototyping and only when explicitly acceptable.

Do not use `db:push` in production.

## Railway Migration

Railway pre-deploy should run:

```bash
pnpm --filter @icarun/server db:migrate
```

This ensures migrations are applied before the new server starts.

## Database Safety

- Do not execute AI-generated SQL.
- Do not accept table names or column names from user input.
- Validate all input before database operations.
- Verify task existence before update/delete.
- Use parameterized queries through Drizzle.
