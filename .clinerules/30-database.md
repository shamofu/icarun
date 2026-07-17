---
paths:
  - "apps/server/src/schema/**"
  - "apps/server/drizzle/**"
  - "apps/server/drizzle.config.ts"
---

# Database Rules — Drizzle ORM / PostgreSQL

Use Drizzle ORM and drizzle-kit.

Do not use Prisma.

## Why Drizzle

Drizzle is preferred for this project because PaaS deployment simplicity is important.

Compared with Prisma, Drizzle has:

- no Prisma Client generation step
- no Prisma query engine binary
- lighter runtime
- fewer deployment-time moving parts
- clearer SQL-oriented migrations
- good compatibility with serverless-style environments
- enough power for this app's relatively simple relational needs

The initial app needs:

- tasks
- optional tags later
- AI operation logs
- optional users later

Prisma's higher-level ORM abstraction is not necessary for the first MVP.

## Drizzle Config

Use:

```txt
<project-root>/apps/server/drizzle.config.ts
```

Expected shape:

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

Important:

- Confirm the installed drizzle-kit version before finalizing config.
- drizzle-kit config APIs may vary between versions.

## Migration Commands

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

Use:

```bash
pnpm --filter @icarun/server db:generate
pnpm --filter @icarun/server db:migrate
```

Use `db:push` only for local prototyping.

Do not use `db:push` in production unless explicitly requested.

## Initial Database Tables

### tasks

Fields:

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

### ai_operation_logs

Add this table either in MVP or soon after.

Fields:

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

Reason:

- AI actions should be auditable.
- AI parse and validation errors need debugging.
- Dangerous or rejected AI operations should be traceable.

## Tags

Use `text[]` for tags initially.

If tag management becomes complex later, migrate to normalized tables:

```txt
tags
task_tags
```

Do not over-engineer tags in the first MVP.
