# icarun — Project Rules

icarun is a task management application inspired by Bluesky's Expo / React Native / React Native Web architecture.

The app should be designed as:

```txt
Expo / React Native Web SPA
        |
        v
Express API Server
        |
        +--> PostgreSQL via Drizzle ORM
        |
        +--> OpenAI-compatible Chat Completions API
```

## Core Decisions

- Use Expo + React Native + React Native Web for the frontend.
- Use Express for the backend API.
- Use PostgreSQL for persistence.
- Use Drizzle ORM and drizzle-kit.
- Do not use Prisma unless explicitly requested.
- Use pnpm as the package manager.
- Deploy primarily to Railway or a similar Node.js-compatible PaaS.
- Keep OpenAI-compatible API calls on the server.
- Never expose secrets to the Expo client.

## Non-negotiable Rules

- Do not introduce Prisma.
- Use Drizzle ORM for database access.
- Use drizzle-kit for migrations.
- Never expose `OPENAI_API_KEY` to frontend code.
- Never expose `DATABASE_URL` to frontend code.
- Never expose `APP_ACCESS_TOKEN` to frontend code.
- Only `EXPO_PUBLIC_*` variables may be used in Expo client code.
- AI must not directly write to the database.
- AI output must be validated before execution.
- Task operations from AI must use preview → confirmation → execute.
- The web app must be deployed as a SPA.
- Expo Web should use `web.output: 'single'`.
- Express must serve the web build with an `index.html` fallback.
- The server must listen on `process.env.PORT`.
- The server must bind to `0.0.0.0` in production.

## Current Project State

Project root:

```txt
<project-root>
```

This is currently a greenfield project.

Known current files:

```txt
package.json
pnpm-lock.yaml
```

The current root `package.json` uses:

```json
{
  "type": "module",
  "devEngines": {
    "packageManager": {
      "name": "pnpm",
      "version": "^11.11.0"
    }
  }
}
```

Use pnpm for all commands.

## Target Workspace Layout

```txt
icarun/
  package.json
  pnpm-workspace.yaml
  railway.json
  .env.example
  .gitignore
  README.md

  apps/
    mobile/
      package.json
      app.config.ts
      tsconfig.json
      babel.config.js
      metro.config.js
      app/
        _layout.tsx
        index.tsx
        tasks/
          [id].tsx
        settings.tsx
      src/
        components/
        features/
          tasks/
          ai/
        lib/
          api.ts
          queryClient.ts
        theme/

    server/
      package.json
      tsconfig.json
      drizzle.config.ts
      src/
        index.ts
        env.ts
        db.ts
        schema/
          index.ts
          tasks.ts
          aiOperationLogs.ts
        routes/
          health.ts
          tasks.ts
          ai.ts
        services/
          taskService.ts
          openaiClient.ts
          aiTaskController.ts
        validators/
          taskSchemas.ts
          aiSchemas.ts
      drizzle/
        migrations/
      web-build/
```

Avoid adding a shared package at the beginning.

Reason:

- Expo + monorepo + Metro can add complexity.
- The first MVP should prioritize deployability.
- Duplicate small types initially if necessary.
- Extract `packages/shared` later only when the structure stabilizes.

## Cline Working Rules

When working on this project:

1. Inspect existing files before editing.
2. Do not assume dependencies are installed.
3. Use pnpm, not npm or yarn.
4. Do not introduce Prisma.
5. Prefer Drizzle and drizzle-kit for all database work.
6. Keep secrets server-side.
7. Preserve Railway deployability.
8. Preserve Expo Web SPA behavior.
9. Validate API inputs with Zod.
10. Validate AI outputs with Zod.
11. Do not execute AI-generated SQL.
12. Run typecheck/build after implementation when possible.
13. Explain any migration or deployment-impacting change.
14. Use absolute Windows paths when referring to local files.

## Preferred Implementation Order

If implementing from scratch, proceed in this order:

1. Create pnpm workspace.
2. Create Express server skeleton.
3. Add `/api/health`.
4. Add Drizzle config.
5. Add Drizzle schema.
6. Add drizzle-kit migrations.
7. Add task CRUD API.
8. Create Expo app.
9. Connect Expo app to API.
10. Add Expo Web build output to `apps/server/web-build`.
11. Add Express static serving and SPA fallback.
12. Add Railway config.
13. Add OpenAI-compatible client.
14. Add AI preview endpoint.
15. Add AI execute endpoint.
16. Add AI command UI.
17. Add simple bearer auth.
18. Add rate limiting for AI endpoints.
19. Verify locally.
20. Prepare Railway deployment notes.
