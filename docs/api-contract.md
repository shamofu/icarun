# API Contract

This document defines the initial icarun HTTP API contract.

## General Rules

- All API routes are prefixed with `/api`.
- Request and response bodies are JSON.
- Validate all inputs with Zod.
- Do not leak stack traces in production.
- Mutation endpoints should require bearer auth in deployed environments.

## Authentication

MVP bearer authentication:

```http
Authorization: Bearer <APP_ACCESS_TOKEN>
```

Protect at least:

- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `POST /api/ai/commands/preview`
- `POST /api/ai/commands/execute`

## Error Format

Use a consistent error format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": {}
  }
}
```

Common codes:

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

## GET /api/health

Returns server status.

### Response

```json
{
  "ok": true
}
```

## GET /api/tasks

Returns task list.

### Query Parameters

```txt
status?: todo | in_progress | done | archived
priority?: low | medium | high
q?: string
tag?: string
```

### Response

```json
{
  "tasks": [
    {
      "id": "task-id",
      "title": "請求書確認",
      "description": null,
      "status": "todo",
      "priority": "medium",
      "dueDate": null,
      "tags": [],
      "createdAt": "2026-07-17T00:00:00.000Z",
      "updatedAt": "2026-07-17T00:00:00.000Z"
    }
  ]
}
```

## GET /api/tasks/:id

Returns a single task.

### Response

```json
{
  "task": {
    "id": "task-id",
    "title": "請求書確認",
    "description": null,
    "status": "todo",
    "priority": "medium",
    "dueDate": null,
    "tags": [],
    "createdAt": "2026-07-17T00:00:00.000Z",
    "updatedAt": "2026-07-17T00:00:00.000Z"
  }
}
```

Return `NOT_FOUND` if the task does not exist.

## POST /api/tasks

Creates a task.

### Request

```json
{
  "title": "請求書確認",
  "description": "7月分の請求書を確認する",
  "priority": "medium",
  "dueDate": "2026-07-18T09:00:00.000Z",
  "tags": ["仕事"]
}
```

### Response

```json
{
  "task": {
    "id": "task-id",
    "title": "請求書確認",
    "description": "7月分の請求書を確認する",
    "status": "todo",
    "priority": "medium",
    "dueDate": "2026-07-18T09:00:00.000Z",
    "tags": ["仕事"],
    "createdAt": "2026-07-17T00:00:00.000Z",
    "updatedAt": "2026-07-17T00:00:00.000Z"
  }
}
```

## PATCH /api/tasks/:id

Updates a task.

### Request

All fields are optional, but at least one field should be provided.

```json
{
  "title": "請求書確認を完了する",
  "description": null,
  "status": "done",
  "priority": "high",
  "dueDate": null,
  "tags": ["仕事", "経理"]
}
```

### Response

```json
{
  "task": {
    "id": "task-id",
    "title": "請求書確認を完了する",
    "description": null,
    "status": "done",
    "priority": "high",
    "dueDate": null,
    "tags": ["仕事", "経理"],
    "createdAt": "2026-07-17T00:00:00.000Z",
    "updatedAt": "2026-07-17T00:00:00.000Z"
  }
}
```

## DELETE /api/tasks/:id

Deletes a task.

### Response

```json
{
  "ok": true
}
```

## POST /api/ai/commands/preview

Creates a preview of AI-proposed task operations.

This endpoint must not mutate the database.

### Request

```json
{
  "input": "明日の朝9時に請求書確認のタスクを追加して"
}
```

### Response

```json
{
  "message": "次のタスクを追加します。",
  "actions": [
    {
      "type": "create_task",
      "payload": {
        "title": "請求書確認",
        "description": null,
        "priority": "medium",
        "dueDate": "2026-07-18T09:00:00.000Z",
        "tags": []
      }
    }
  ],
  "requiresConfirmation": true
}
```

## POST /api/ai/commands/execute

Executes previously previewed and validated AI actions.

### Request

```json
{
  "actions": [
    {
      "type": "create_task",
      "payload": {
        "title": "請求書確認",
        "description": null,
        "priority": "medium",
        "dueDate": "2026-07-18T09:00:00.000Z",
        "tags": []
      }
    }
  ],
  "confirmed": true
}
```

### Response

```json
{
  "ok": true,
  "results": [
    {
      "type": "create_task",
      "taskId": "task-id"
    }
  ]
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
