# Security Notes

icarun includes Better Auth accounts and AI-assisted task control, so auth isolation, safety, and secret handling are important even for the MVP.

## Secret Management

Never expose these to Expo client code:

```env
OPENAI_API_KEY
OPENAI_BASE_URL
OPENAI_MODEL
CONVEX_SELF_HOSTED_ADMIN_KEY
BETTER_AUTH_SECRET
INSTANCE_SECRET
POSTGRES_URL
POSTGRES_PASSWORD
```

Only frontend-safe variables may use the `EXPO_PUBLIC_` prefix.

Allowed client variables:

```env
EXPO_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
EXPO_PUBLIC_CONVEX_SITE_URL=http://127.0.0.1:3211
```

`EXPO_PUBLIC_CONVEX_URL` and `EXPO_PUBLIC_CONVEX_SITE_URL` are public deployment URLs, not secrets. The site URL is required for Better Auth HTTP routes.

Set server-only secrets in the Convex deployment/backend environment:

```bash
npx convex env set OPENAI_API_KEY sk-your-key
npx convex env set OPENAI_BASE_URL https://api.openai.com/v1
npx convex env set OPENAI_MODEL gpt-4.1-mini
npx convex env set BETTER_AUTH_SECRET <long-random-secret>
npx convex env set SITE_URL <frontend-origin>
```

## Authentication

Authentication is implemented with Better Auth via `@convex-dev/better-auth`.

- Email/password sign-up and sign-in are enabled.
- The client uses Better Auth cookie/JWT exchange through `ConvexBetterAuthProvider`, not a private bearer token.
- Better Auth HTTP routes are mounted at `/api/auth/*` on the Convex HTTP/site origin.
- Tasks store `ownerId` and all task CRUD queries/mutations require an authenticated Convex identity.
- AI preview/execute require authentication and only include the current user's tasks in LLM context.
- Existing pre-auth tasks without `ownerId` are hidden after account mode is enabled.
- `BETTER_AUTH_SECRET` must remain server-side and must not use the `EXPO_PUBLIC_` prefix.

## Railway Domain and Reference Variable Safety

Use public domains for browser-facing Convex URLs:

```env
EXPO_PUBLIC_CONVEX_URL=https://<convex-api-public-domain>
EXPO_PUBLIC_CONVEX_SITE_URL=https://<convex-site-public-domain>
CONVEX_SELF_HOSTED_URL=https://<convex-api-public-domain>
NEXT_PUBLIC_DEPLOYMENT_URL=https://<convex-api-public-domain>
```

Use Railway private domains only for server-to-server traffic, currently backend-to-database:

```env
POSTGRES_URL=postgresql://${{ database.POSTGRES_USER }}:${{ database.POSTGRES_PASSWORD }}@${{ database.RAILWAY_PRIVATE_DOMAIN }}:5432
```

Do not put `RAILWAY_PRIVATE_DOMAIN` or `*.railway.internal` names into `EXPO_PUBLIC_*` variables; browsers cannot resolve Railway private DNS names.

Store `CONVEX_SELF_HOSTED_ADMIN_KEY` as a frontend build/deploy secret only. Prefer a sealed Railway shared variable referenced as `${{ shared.CONVEX_SELF_HOSTED_ADMIN_KEY }}`. Never prefix it with `EXPO_PUBLIC_`.

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

Verify task existence and ownership before update/delete.

## Rate Limiting

AI actions can trigger provider costs.

Potential later improvements:

- add app-level throttling around `api.ai.preview` and `api.ai.execute`
- add provider-side limits
- add per-user quotas

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
- Better Auth cookies/tokens
- full request headers containing secrets
- unrelated private user data

## Database Safety

- Use Convex for persistence.
- AI actions must not write raw documents directly.
- AI actions execute through validated mutations.
- Do not execute user-generated or AI-generated SQL.
- Verify task IDs and ownership before updates/deletes.

## Frontend Safety

Expo code must not import server-only modules that read `process.env.OPENAI_API_KEY` or `process.env.BETTER_AUTH_SECRET`.

Frontend code must not reference:

```txt
process.env.OPENAI_API_KEY
process.env.OPENAI_BASE_URL
process.env.OPENAI_MODEL
process.env.BETTER_AUTH_SECRET
```

If the frontend needs configuration, use `EXPO_PUBLIC_*` only. The only auth-related frontend public variable is `EXPO_PUBLIC_CONVEX_SITE_URL`.
