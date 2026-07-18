# Convex Function Contract

This document defines the initial icarun backend contract.

The previous HTTP REST API contract has been replaced by Convex functions.

## General Rules

- Frontend calls Convex functions through `convex/react`.
- Reads use queries.
- Writes use mutations.
- External side effects such as OpenAI-compatible provider calls use actions.
- Function arguments are validated with Convex `v` validators.
- AI output is validated with Zod.

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

## api.health.check

Returns backend status.

### Arguments

```ts
{}
```

### Response

```json
{ "ok": true }
```

## api.tasks.list

Returns task list.

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

## api.tasks.get

Returns a single task or null.

### Arguments

```ts
{ id: Id<'tasks'> }
```

### Response

```ts
Task | null
```

## api.tasks.create

Creates a task.

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

## api.tasks.update

Updates a task.

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

Throws `NOT_FOUND` if the task does not exist.

## api.tasks.remove

Deletes a task.

### Arguments

```ts
{ id: Id<'tasks'> }
```

### Response

```ts
{ ok: true }
```

Throws `NOT_FOUND` if the task does not exist.

## api.ai.preview

Creates a preview of AI-proposed task operations.

This action must not mutate tasks.

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

## api.ai.execute

Executes previously previewed and validated AI actions.

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

## AI Execution Safety

Before execution:

- validate actions with Zod
- reject unknown action types
- verify task existence for update/delete
- require confirmation for delete actions
- require confirmation for bulk actions
- log operation where possible