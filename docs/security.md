# Security Notes

icarun includes AI-assisted task control, so safety and secret handling are important even for the MVP.

## Secret Management

Never expose these to Expo client code:

```env
OPENAI_API_KEY
DATABASE_URL
APP_ACCESS_TOKEN
```

Only frontend-safe variables may use the `EXPO_PUBLIC_` prefix.

Allowed client variable:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

## AI Safety

AI must not directly mutate the database.

Required flow:

```txt
preview
  -> validate
  -> user confirmation
  -> execute
```

AI output must be:

- parsed as JSON
- validated with Zod
- restricted to allowed action types
- rejected if invalid

Never execute AI-generated SQL.

## Allowed AI Actions

Only these action types are allowed:

```txt
create_task
update_task
delete_task
summarize_tasks
```

Unknown action types must be rejected.

## Destructive Operations

Always require explicit user confirmation for:

- delete actions
- bulk updates
- bulk deletes
- ambiguous AI commands

Verify task existence before update/delete.

## Authentication

MVP may use bearer token auth:

```http
Authorization: Bearer <APP_ACCESS_TOKEN>
```

Protect at least:

- task mutation endpoints
- AI preview endpoint
- AI execute endpoint

A full auth system may be added later.

## Rate Limiting

AI endpoints should be rate-limited because they can trigger provider costs.

Rate limit:

- `POST /api/ai/commands/preview`
- `POST /api/ai/commands/execute`

Optional later:

- task mutation endpoints

## Input Validation

Validate with Zod:

- request bodies
- route params
- query params
- environment variables
- AI output

Reject invalid inputs before database operations.

## Error Handling

Use a consistent JSON error format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": {}
  }
}
```

Do not leak stack traces in production.

## CORS

Do not use unrestricted `*` CORS for private APIs.

Production should usually be same-origin.

Development may allow:

```env
DEV_WEB_ORIGIN=http://localhost:8081
```

## Logging

Do log:

- AI operation status
- validation errors
- provider errors
- execution results

Do not log:

- OpenAI API keys
- bearer tokens
- database URLs
- full request headers containing secrets

## Database Safety

- Use Drizzle for database access.
- Do not use raw SQL unless necessary and reviewed.
- Do not execute user-generated or AI-generated SQL.
- Use parameterized queries through Drizzle.
- Verify task IDs before updates/deletes.

## Frontend Safety

Expo code must not import server-only modules.

Frontend code must not reference:

```txt
process.env.OPENAI_API_KEY
process.env.DATABASE_URL
process.env.APP_ACCESS_TOKEN
```

If the frontend needs configuration, use `EXPO_PUBLIC_*` only.
