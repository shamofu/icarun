# Active Context

## Current Status

The project is greenfield.

Current known files:

```txt
package.json
pnpm-lock.yaml
```

No Expo app, Express server, Drizzle schema, or Railway config has been created yet.

## Current Direction

The project should be designed with Drizzle ORM instead of Prisma.

The main reasons are:

- easier PaaS deployment
- fewer generated artifacts
- no Prisma query engine binary
- simpler runtime model
- enough control for PostgreSQL
- better fit for Railway-style deployment simplicity

## Immediate Next Steps

When implementation begins:

1. Create pnpm workspace.
2. Create `apps/server`.
3. Add Express + TypeScript.
4. Add `/api/health`.
5. Add Drizzle + drizzle-kit.
6. Add database schema.
7. Add task CRUD API.
8. Create `apps/mobile`.
9. Add Expo Router screens.
10. Connect mobile web app to API.
11. Add static serving and SPA fallback.
12. Add Railway config.
13. Add OpenAI-compatible AI preview.
14. Add AI execute flow.
15. Add auth and rate limiting.

## Open Decisions

- Task ID format: UUID vs CUID/text.
- Whether status/priority should be PostgreSQL enums or text with validation.
- Whether `ai_operation_logs` belongs in the initial migration or immediately after CRUD.
- Whether simple bearer auth is enough for the first deployed MVP.
- Whether to add `packages/shared` later after the MVP stabilizes.

## Active Warnings

- Do not use Prisma.
- Do not expose server secrets to Expo.
- Do not use Expo `web.output: 'static'` with dynamic task routes.
- Do not rely on Railway auto-detection for monorepo commands.
- Confirm drizzle-kit config syntax against the installed version.
- Do not commit private local paths, local usernames, personal handles, or machine-specific absolute paths; use repo-relative paths or placeholders such as `<project-root>`.
