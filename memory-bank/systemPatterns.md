# System Patterns

## High-Level Architecture

```txt
Expo / React Native Web SPA
        |
        | convex/react
        v
Convex backend
        |
        +--> Convex database
        |
        +--> Convex action -> OpenAI-compatible Chat Completions API
```

## Deployment Pattern

Use Convex for backend functions and database.

Use static SPA hosting for the web app output:

```txt
apps/mobile/dist
```

The static host must serve `index.html` for dynamic routes such as:

```txt
/tasks/abc123
```

## Frontend Pattern

Use Expo Router.

Use Convex React hooks for server state:

```ts
useQuery(api.tasks.list, args)
useMutation(api.tasks.create)
useAction(api.ai.preview)
```

Keep UI state local unless global state is truly needed.

## Backend Pattern

Use Convex function modules:

```txt
convex/
  health.ts
  tasks.ts
  ai.ts
  aiInternal.ts
```

Use helpers for reusable backend logic:

```txt
convex/lib/
  aiSchemas.ts
  openai.ts
  prompt.ts
  serializers.ts
```

## Database Pattern

Use Convex schema:

```txt
convex/schema.ts
```

Convex automatically adds `_id` and `_creationTime`. Map them to app-facing `id` and `createdAt` in serializers.

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

The static host should return `index.html` for non-file routes.

## Convex Pattern

Run during development:

```bash
pnpm --filter @icarun/mobile convex:dev
```

Run for production deploy/build:

```bash
pnpm --filter @icarun/mobile convex:deploy
```

Generated files under `apps/mobile/convex/_generated/` should be committed.

Local runtime files under `apps/mobile/.convex/` should not be committed.