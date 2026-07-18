# AI Contract

This document defines the AI task-control contract for icarun.

## Purpose

icarun supports natural language task control through an OpenAI-compatible Chat Completions API called from Convex actions.

The AI must only propose structured actions. It must not directly access the database or execute operations.

## Required Flow

```txt
User input
  -> api.ai.preview Convex action
  -> action calls OpenAI-compatible API
  -> action parses JSON
  -> action validates with Zod
  -> frontend shows proposed actions
  -> user confirms
  -> api.ai.execute Convex action
  -> action validates again
  -> action executes allowed Convex mutations
```

## Environment Variables

Server-only Convex deployment environment variables:

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

These must never be referenced from Expo client code.

## Chat Completions Request Direction

Default request shape:

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

Some OpenAI-compatible providers may not support `response_format`.

If unsupported:

1. Retry without `response_format` if the failure indicates unsupported parameter behavior.
2. Always parse the returned content as JSON.
3. Always validate the parsed object with Zod.
4. Never execute invalid or unparseable AI output.

## System Prompt Direction

The system prompt should tell the model:

- Return only JSON.
- Do not include markdown fences.
- Do not include prose outside JSON.
- Use only allowed action types.
- Do not generate SQL.
- Do not invent task IDs.
- Use existing task IDs only when updating or deleting.
- If unsure, return no actions and a clarification message.

## Allowed AI Response Shape

```ts
type AiCommandPreview = {
  message: string
  actions: AiTaskAction[]
  requiresConfirmation: boolean
}
```

## Allowed Actions

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

## Forbidden AI Behavior

The AI must never:

- return SQL
- request direct database access
- invent arbitrary action types
- bypass confirmation
- mutate data during preview
- delete tasks without user confirmation
- perform bulk changes without user confirmation
- expose or request secrets

## Preview Action Responsibilities

`api.ai.preview` must:

- validate the user input
- optionally provide relevant task context to the model
- call the model server-side from Convex
- parse JSON
- validate actions with Zod
- determine whether confirmation is required
- return preview data only
- not mutate tasks

## Execute Action Responsibilities

`api.ai.execute` must:

- validate the request body
- validate all submitted actions
- verify update/delete task IDs exist
- require `confirmed: true` for destructive or bulk actions
- execute allowed operations through task mutations
- log the operation result when possible

## Confirmation Rules

Always require confirmation for:

- every AI action execution in the UI
- delete actions
- bulk update actions
- bulk delete actions
- ambiguous commands

## Invalid Output Handling

If AI output fails parsing or validation, throw a stable AI parse/validation error and do not execute partial actions.

## Logging

AI operation logs should record:

- input
- parsed actions, if any
- validation result
- execution result, if any
- status
- `_creationTime`

Do not log API keys or authorization headers.