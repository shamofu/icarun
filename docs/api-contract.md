# Convex Function Contract

This document defines the initial icarun backend contract.

The previous HTTP REST API contract has been replaced by Convex functions plus Better Auth HTTP routes.

## General Rules

- Frontend calls Convex functions through `convex/react`.
- Better Auth signs users in/out through `/api/auth/*` on the Convex HTTP/site origin.
- Reads use queries.
- Writes use mutations.
- External side effects such as OpenAI-compatible provider calls use actions.
- Function arguments are validated with Convex `v` validators.
- AI output is validated with Zod.
- Task and AI functions require authentication unless explicitly noted.
- Tasks are scoped by `ownerId`; users cannot read or mutate other users' tasks.

## Error Shape

Convex functions throw errors rather than returning HTTP error responses. Prefer stable error messages and code-bearing custom errors where practical.

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

## Task Type

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

`ownerId` is stored server-side and intentionally not exposed in the app-facing `Task` shape.

## Auth Routes / Functions

Better Auth HTTP routes are registered in `convex/http.ts`:

```txt
/api/auth/*
```

The current user can be read from Convex:

```txt
api.auth.getCurrentUser
```

## api.health.check

Returns backend status. Does not require authentication.

### Arguments

```ts
{}
```

### Response

```json
{ "ok": true }
```

## api.tasks.list

Returns the authenticated user's task list.

### Arguments

```ts
{
  status?: 'todo' | 'in_progress' | 'done' | 'archived'
  priority?: 'low' | 'medium' | 'high'
  q?: string
  tag?: string
}
```

### Response

```ts
Task[]
```

Throws `FORBIDDEN` if unauthenticated.

## api.tasks.get

Returns a single task or null. Returns null for tasks owned by another user.

### Arguments

```ts
{ id: Id<'tasks'> }
```

### Response

```ts
Task | null
```

Throws `FORBIDDEN` if unauthenticated.

## api.tasks.create

Creates a task owned by the authenticated user.

### Arguments

```ts
{
  title: string
  description?: string | null
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string | null
  tags?: string[]
}
```

### Response

```ts
Task
```

Throws `FORBIDDEN` if unauthenticated.

## api.tasks.update

Updates an authenticated user's own task.

### Arguments

```ts
{
  id: Id<'tasks'>
  title?: string
  description?: string | null
  status?: 'todo' | 'in_progress' | 'done' | 'archived'
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string | null
  tags?: string[]
}
```

### Response

```ts
Task
```

Throws `FORBIDDEN` if unauthenticated. Throws `NOT_FOUND` if the task does not exist or belongs to another user.

## api.tasks.remove

Deletes an authenticated user's own task.

### Arguments

```ts
{ id: Id<'tasks'> }
```

### Response

```ts
{ ok: true }
```

Throws `FORBIDDEN` if unauthenticated. Throws `NOT_FOUND` if the task does not exist or belongs to another user.

## api.ai.preview

Creates a preview of AI-proposed task operations for the authenticated user.

This action must not mutate tasks and must only include the authenticated user's tasks in LLM context.

### Arguments

```ts
{ input: string }
```

### Response

```ts
{
  message: string
  actions: AiTaskAction[]
  requiresConfirmation: boolean
}
```

Throws `FORBIDDEN` if unauthenticated.

## api.ai.execute

Executes previously previewed and validated AI actions for the authenticated user.

### Arguments

```ts
{
  actions: AiTaskAction[]
  confirmed?: boolean
}
```

### Response

```ts
{
  ok: true
  results: Array<Record<string, unknown>>
}
```

Throws `FORBIDDEN` if unauthenticated or not confirmed. Throws `NOT_FOUND` for update/delete targets that do not exist or belong to another user.

## AI Execution Safety

Before execution:

- validate actions with Zod
- reject unknown action types
- verify task existence and ownership for update/delete
- require confirmation for all AI actions
- log operation status where possible
