# icarun — Project Rules

icarun is a task management application inspired by Bluesky's Expo / React Native / React Native Web architecture.

The app is designed as:

```txt
Expo / React Native Web SPA
        |
        | convex/react
        v
Convex backend
        +--> Convex database
        +--> Convex actions for OpenAI-compatible Chat Completions API
```

## Core Decisions

- Use Expo + React Native + React Native Web for the frontend.
- Use Expo Router for routing.
- Use Convex for persistence, backend functions, and realtime client updates.
- Use Convex queries for reads, mutations for writes, and actions for OpenAI-compatible calls.
- Do not use PostgreSQL, Drizzle ORM, drizzle-kit, Prisma, or an Express REST API unless explicitly requested later.
- Use pnpm as the package manager.
- Deploy the Convex backend with Convex tooling.
- Deploy the web app as a static SPA to any compatible host.
- Keep OpenAI-compatible API calls in Convex backend actions.
- Never expose secrets to the Expo client.

## Non-negotiable Rules

- Use Convex as the database/backend source of truth.
- Do not introduce PostgreSQL, Drizzle ORM, drizzle-kit, Prisma, or Express for the MVP unless explicitly requested.
- Never expose `OPENAI_API_KEY` to frontend code.
- Never expose backend-only Convex environment variables to frontend code.
- Only `EXPO_PUBLIC_*` variables may be used in Expo client code.
- `EXPO_PUBLIC_CONVEX_URL` is frontend-safe and required by the Expo app.
- AI must not directly write to the database.
- AI output must be validated before execution.
- Task operations from AI must use preview -> confirmation -> execute.
- The web app must be deployed as a SPA.
- Expo Web should use `web.output: 'single'`.
- Convex generated files under `convex/_generated/` should be committed after codegen.
- Local Convex runtime state (`.convex/`) and local env files must not be committed.

## Current Project State

The project now contains a pnpm workspace with an Expo/React Native Web app under:

```txt
apps/mobile/
```

The Convex backend lives inside the mobile app project:

```txt
apps/mobile/convex/
```

Important current files:

```txt
package.json
pnpm-workspace.yaml
.env.example
.gitignore
apps/mobile/package.json
apps/mobile/app.config.ts
apps/mobile/app/
apps/mobile/convex/
apps/mobile/src/
```

## Target Workspace Layout

```txt
icarun/
  package.json
  pnpm-workspace.yaml
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
      convex.json
      app/
        _layout.tsx
        index.tsx
        tasks/
          [id].tsx
        settings.tsx
      src/
        features/
          ai/
        lib/
          convex.ts
        theme/
      convex/
        schema.ts
        health.ts
        tasks.ts
        ai.ts
        aiInternal.ts
        lib/
          aiSchemas.ts
          openai.ts
          prompt.ts
          serializers.ts
        _generated/
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
4. Use Convex for database and backend functions.
5. Do not introduce PostgreSQL, Drizzle, drizzle-kit, Prisma, or Express unless explicitly requested.
6. Keep secrets server-side in Convex deployment environment variables.
7. Preserve Expo Web SPA behavior.
8. Validate AI outputs with Zod.
9. Use Convex `v` validators for function arguments and schema definitions.
10. Do not execute AI-generated SQL.
11. Run typecheck/build after implementation when possible.
12. Run Convex codegen/dev validation when possible.
13. Explain any deployment-impacting change.
14. Use absolute Windows paths when referring to local files in responses.
15. Do not commit private local paths, local usernames, local Convex runtime state, or machine-specific generated data.

## Preferred Implementation Order

If implementing from scratch, proceed in this order:

1. Create pnpm workspace.
2. Create Expo app.
3. Add Convex dependency and configure a Convex deployment.
4. Add `convex/schema.ts`.
5. Add health query.
6. Add task queries/mutations.
7. Add Expo Router screens.
8. Connect Expo app to Convex with `ConvexProvider`.
9. Add AI Zod schemas.
10. Add OpenAI-compatible Convex action for preview.
11. Add AI execute action with confirmation checks.
12. Add AI command UI.
13. Verify locally with Convex dev/codegen and TypeScript.
14. Prepare deployment notes for Convex backend and static SPA hosting.