---
paths:
  - "apps/server/**"
---

# Backend Rules — Express API

The backend is a Node.js + Express API server.

It serves both:

1. `/api/*` API routes
2. Expo Web static files from `web-build`

## Stack

Use:

- Node.js
- Express
- TypeScript
- Drizzle ORM
- drizzle-kit
- PostgreSQL
- Zod
- OpenAI-compatible Chat Completions API

Do not use Prisma.

## Required Routes

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

## Express Route Order

Route order matters.

Use this order:

```txt
1. API routes
2. Static assets
3. SPA fallback
```

Expected behavior:

```txt
/api/health       -> API route
/api/tasks        -> API route
/assets/*         -> static file
/tasks/abc123     -> web-build/index.html
/settings         -> web-build/index.html
```

The SPA fallback must return `index.html` for non-API routes.

## Railway Server Binding

Railway injects `PORT`.

Use:

```ts
const port = Number(process.env.PORT) || 3000

app.listen(port, '0.0.0.0')
```

Do not bind only to `localhost` in production.

## Validation

Use Zod for:

- request bodies
- query parameters
- route params
- AI output
- environment variables where practical

Do not trust client input.

Do not trust AI output.

## Error Format

Use a consistent error response shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": {}
  }
}
```

Common error codes:

```txt
VALIDATION_ERROR
NOT_FOUND
UNAUTHORIZED
FORBIDDEN
AI_PARSE_ERROR
AI_VALIDATION_ERROR
AI_PROVIDER_ERROR
DATABASE_ERROR
INTERNAL_ERROR
```

Do not leak stack traces in production.

## CORS

Production should usually be same-origin because Express serves the frontend.

Development may allow the Expo web dev server.

Use environment variables:

```env
APP_ORIGIN=http://localhost:3000
DEV_WEB_ORIGIN=http://localhost:8081
```

Do not use unrestricted `*` CORS for private APIs.

## Authentication

MVP may use simple bearer token authentication.

Use:

```env
APP_ACCESS_TOKEN=replace-with-long-random-token
```

Require:

```txt
Authorization: Bearer <APP_ACCESS_TOKEN>
```

Protect at least:

- task mutation endpoints
- AI endpoints

A full auth system is out of scope for the first MVP unless explicitly requested.

## OpenAI-Compatible API

Support OpenAI-compatible providers through:

```env
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=
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

1. Retry without `response_format` if appropriate.
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
8. AI endpoints should be rate-limited.
9. AI operations should be logged where possible.

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
