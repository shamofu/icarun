# Backend Rules — Convex

The backend is a Convex backend co-located with the Expo app under:

```txt
apps/mobile/convex/
```

It serves application backend functionality through Convex functions:

1. queries for reads
2. mutations for writes
3. actions for side effects such as OpenAI-compatible API calls

There is no Express REST API server in the MVP.

## Stack

Use:

- Convex
- TypeScript
- Convex schema validators (`convex/values`)
- Zod for AI output validation
- OpenAI-compatible Chat Completions API from Convex actions

Do not use PostgreSQL, Drizzle ORM, drizzle-kit, Prisma, or Express unless explicitly requested later.

## Required Functions

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

Internal helpers may live in `convex/aiInternal.ts`.

## Validation

Use Convex `v` validators for:

- function arguments
- schema fields
- enum-like literal unions

Use Zod for:

- AI output parsing and validation
- AI action schema validation before execution

Do not trust client input.

Do not trust AI output.

## Error Handling

Convex functions throw errors to clients. Prefer stable error messages and code-bearing custom errors where practical.

Common logical codes:

```txt
VALIDATION_ERROR
NOT_FOUND
FORBIDDEN
AI_PARSE_ERROR
AI_VALIDATION_ERROR
AI_PROVIDER_ERROR
DATABASE_ERROR
INTERNAL_ERROR
```

Do not leak secrets in errors.

## Authentication

A full auth system is out of scope for the first MVP unless explicitly requested.

If authentication is added later, prefer Convex-supported auth integrations or Convex auth patterns. Do not reintroduce a private bearer token into the Expo client.

## OpenAI-Compatible API

Support OpenAI-compatible providers through Convex deployment environment variables:

```env
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
```

Set them with:

```bash
npx convex env set OPENAI_API_KEY sk-your-key
npx convex env set OPENAI_BASE_URL https://api.openai.com/v1
npx convex env set OPENAI_MODEL gpt-4.1-mini
```

Default request direction:

```json
{
  "model": "gpt-4.1-mini",
  "messages": [],
  "temperature": 0.1,
  "response_format": {
    "type": "json_object"
  }
}
```

Some providers may not support `response_format`.

If rejected:

1. Retry without `response_format` when appropriate.
2. Always parse JSON.
3. Always validate with Zod.
4. Never execute invalid output.

## AI Safety

Mandatory rules:

1. AI must never directly access the database.
2. AI must never produce raw SQL to execute.
3. AI must only return allowed action types.
4. Unknown action types must be rejected.
5. Update/delete operations must verify task existence.
6. Delete actions require user confirmation.
7. Bulk updates require user confirmation.
8. AI operations should be logged where possible.

Allowed AI actions:

```ts
type AiTaskAction =
  | {
      type: 'create_task'
      payload: {
        title: string
        description?: string | null
        priority?: 'low' | 'medium' | 'high'
        dueDate?: string | null
        tags?: string[]
      }
    }
  | {
      type: 'update_task'
      payload: {
        id: string
        title?: string
        description?: string | null
        status?: 'todo' | 'in_progress' | 'done' | 'archived'
        priority?: 'low' | 'medium' | 'high'
        dueDate?: string | null
        tags?: string[]
      }
    }
  | {
      type: 'delete_task'
      payload: {
        id: string
      }
    }
  | {
      type: 'summarize_tasks'
      payload: {
        status?: 'todo' | 'in_progress' | 'done' | 'archived'
      }
    }
```