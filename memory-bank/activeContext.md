# Active Context

## Current Status

The project has been migrated from the prior PostgreSQL + Drizzle + Express plan to a Convex-backed architecture.

Current implemented structure includes:

```txt
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
.env.example
.gitignore
apps/mobile/
  app/
  src/
  convex/
```

## Recent Changes

- Added pnpm workspace.
- Added Expo / React Native Web app skeleton.
- Added Convex backend under `apps/mobile/convex/`.
- Added Convex schema for `tasks` and `aiOperationLogs`.
- Added task CRUD Convex queries/mutations.
- Added health query.
- Added AI preview/execute Convex actions.
- Added Zod AI action validation.
- Added Expo UI screens for task list, task detail, and settings.
- Added AI command bar using preview -> confirm -> execute.
- Added ADR 0002: Use Convex.
- Marked ADR 0001 as superseded.
- Updated project rules, docs, README, and memory bank for Convex.
- Updated mobile dependencies to Expo SDK 57-compatible versions.
- Verified updated dependencies with Expo dependency check, peer check, typecheck, and web build.
- Added Railway deployment config for release-branch GitHub autodeploy.
- Added root Railway build/start scripts and `serve` for SPA hosting.
- Pinned Railway/Nixpacks Node runtime to Node.js 22 LTS.
- Removed the root top-level `packageManager` field so Railway/Nixpacks avoids the Corepack pnpm shim that failed on Node 24.10.0.

## Current Direction

Use Convex as the database and backend source of truth.

Main reasons:

- user requested Convex
- realtime updates
- TypeScript functions
- no ORM/migration layer
- simpler AI action model
- no Express REST API server needed for MVP

## Immediate Next Steps

1. Run Convex dev validation if backend functions or generated files change again.
2. Ensure local runtime state is ignored.
3. Commit generated Convex files but not local `.convex/` data.
4. Configure real Convex production deployment.
5. Set OpenAI-compatible provider env vars on Convex.
6. Configure Railway GitHub service branch to `release` and set `CONVEX_DEPLOY_KEY`.
7. Push the release branch and verify Railway deploy logs.
8. Perform a full browser UI smoke test.

## Open Decisions

- Railway is the selected static SPA host for release-branch deployment.
- Whether to add full authentication later.
- Whether to add rate limiting / quotas for AI actions.
- Whether to normalize tags after MVP.
- Whether to add richer task date parsing / timezone controls.

## Active Warnings

- Do not use PostgreSQL, Drizzle ORM, drizzle-kit, Prisma, or Express unless explicitly requested.
- Do not expose OpenAI secrets to Expo.
- Do not use Expo `web.output: 'static'` with dynamic task routes.
- Do not commit local Convex runtime state (`apps/mobile/.convex/`).
- Do not commit private local env files (`apps/mobile/.env.local`).
- Convex generated files under `apps/mobile/convex/_generated/` are required for typecheck and should be committed.
- Railway cannot read the release branch trigger from `railway.json`; set the service source branch to `release` in Railway.
- Railway requires `CONVEX_DEPLOY_KEY` as a service variable for `convex deploy` during build.
- Railway uses pnpm-lock.yaml detection for pnpm; avoid the legacy top-level `packageManager` field in root package.json.

- Do not reintroduce the root top-level `packageManager` field without re-validating Railway install logs; it can route pnpm through Corepack.
