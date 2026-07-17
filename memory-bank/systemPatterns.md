# System Patterns

## High-Level Architecture

```txt
Expo / React Native Web SPA
        |
        | HTTPS
        v
Express API Server
        |
        +--> PostgreSQL via Drizzle ORM
        |
        +--> OpenAI-compatible Chat Completions API
```

## Deployment Pattern

Use one Railway service.

The Express server should:

1. serve `/api/*`
2. serve Expo Web static assets
3. fallback non-API paths to `index.html`

This enables deep links such as:

```txt
/tasks/abc123
```

to work after refresh.

## Frontend Pattern

Use Expo Router.

Use React Query for server state.

Keep UI state local unless global state is truly needed.

## Backend Pattern

Use Express route modules:

```txt
routes/
  health.ts
  tasks.ts
  ai.ts
```

Use services for business logic:

```txt
services/
  taskService.ts
  openaiClient.ts
  aiTaskController.ts
```

Use validators for Zod schemas:

```txt
validators/
  taskSchemas.ts
  aiSchemas.ts
```

## Database Pattern

Use Drizzle schema files:

```txt
src/schema/
  index.ts
  tasks.ts
  aiOperationLogs.ts
```

Use drizzle-kit for migrations:

```txt
drizzle/migrations/
```

## AI Safety Pattern

AI task control must use:

```txt
preview
  -> validate
  -> confirm
  -> execute
```

Never:

- execute AI-generated SQL
- let AI choose arbitrary tables
- let AI bypass validation
- let AI directly mutate the database

## SPA Routing Pattern

Expo config:

```ts
web: {
  bundler: 'metro',
  output: 'single'
}
```

Express must return `index.html` for non-API, non-static requests.

## Railway Pattern

Railway build should run:

```bash
pnpm build
```

Railway pre-deploy should run:

```bash
pnpm --filter @icarun/server db:migrate
```

Railway start should run:

```bash
pnpm start
```

The server must use:

```ts
app.listen(port, '0.0.0.0')
```
