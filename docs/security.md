# Security Notes

icarun includes AI-assisted task control, so safety and secret handling are important even for the MVP.

## Secret Management

Never expose these to Expo client code:

```env
OPENAI_API_KEY
OPENAI_BASE_URL
OPENAI_MODEL
```

Only frontend-safe variables may use the `EXPO_PUBLIC_` prefix.

Allowed client variable:

```env
EXPO_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
```

`EXPO_PUBLIC_CONVEX_URL` is a public deployment URL, not a secret.

Set server-only secrets in the Convex deployment environment:

```bash
npx convex env set OPENAI_API_KEY sk-your-key
npx convex env set OPENAI_BASE_URL https://api.openai.com/v1
npx convex env set OPENAI_MODEL gpt-4.1-mini
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

A full auth system is out of scope for the first MVP unless explicitly requested.

If auth is added later, prefer Convex-supported auth patterns or providers. Do not put backend-only bearer tokens into Expo client code.

## Rate Limiting

AI actions can trigger provider costs.

Potential later improvements:

- add per-user auth
- add Convex-side usage logging
- add provider-side limits
- add app-level throttling around `api.ai.preview` and `api.ai.execute`

## Input Validation

Validate with Convex `v` validators:

- function arguments
- schema fields
- enum-like literal unions

Validate with Zod:

- AI model output
- AI action arrays before execution

Reject invalid inputs before database operations.

## Error Handling

Do not leak secrets in errors.

Prefer stable logical error codes/messages for:

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

## Logging

Do log:

- AI operation status
- validation errors
- provider errors
- execution results

Do not log:

- OpenAI API keys
- full request headers containing secrets
- unrelated private user data

## Database Safety

- Use Convex for persistence.
- AI actions must not write raw documents directly.
- AI actions execute through validated mutations.
- Do not execute user-generated or AI-generated SQL.
- Verify task IDs before updates/deletes.

## Frontend Safety

Expo code must not import server-only modules that read `process.env.OPENAI_API_KEY`.

Frontend code must not reference:

```txt
process.env.OPENAI_API_KEY
process.env.OPENAI_BASE_URL
process.env.OPENAI_MODEL
```

If the frontend needs configuration, use `EXPO_PUBLIC_*` only.