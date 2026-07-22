# Progress

## Done

- Project direction updated to Convex.
- ADR 0002 added and ADR 0001 superseded.
- pnpm workspace created.
- Expo / React Native Web app skeleton created.
- Convex dependency added.
- Local Convex deployment configured during validation.
- Convex generated files created.
- Convex schema added.
- `tasks` table added.
- `aiOperationLogs` table added.
- Health query added.
- Task CRUD queries/mutations added.
- AI preview action added.
- AI execute action added.
- Zod AI validation added.
- OpenAI-compatible client helper added.
- AI command UI added.
- Task list screen added.
- Task detail screen added.
- Settings screen added.
- `.env.example` updated for Convex.
- README updated for Convex.
- docs updated for Convex.
- project rules updated for Convex.
- TypeScript typecheck has passed once (`tsc --noEmit`).
- Convex functions have compiled and become ready against local deployment once.
- Basic Convex function runtime checks performed (`health.check`, task create/list/remove, AI confirmation guard).
- Mobile dependencies updated to Expo SDK 57-compatible versions.
- Updated dependency set passes Expo dependency check, peer dependency check, TypeScript typecheck, and Expo Web build.
- Railway config-as-code added for Nixpacks build and SPA start command.
- Root `railway:build` and `start` scripts added.
- `serve` dependency added to host `apps/mobile/dist` with SPA fallback.
- Railway Node runtime pinned to Node.js 22 LTS via `engines.node` and `.nvmrc`.
- Root top-level `packageManager` removed so Nixpacks detects pnpm from `pnpm-lock.yaml` instead of using the Corepack shim that failed on Railway Node 24.10.0.
- pnpm 11 `devEngines.packageManager` removed and `pnpm-lock.yaml` regenerated as a single YAML document after Railway pnpm 9 rejected the multi-document lockfile.

## Not Started / Remaining

- Real production Convex deployment setup.
- Production OpenAI-compatible env var configuration.
- Railway service setup: connect GitHub repo, set source branch to `release`, set `CONVEX_DEPLOY_KEY`, and run first deploy.
- Full browser UI smoke test after Expo SDK 57 dependency update.
- Real AI preview call with a configured `OPENAI_API_KEY`.
- Authentication.
- Rate limiting / quotas.

## Known Risks

### Convex local deployment artifacts

Local Convex runtime state is generated under `apps/mobile/.convex/` and must not be committed.

Mitigation:

- ignore `apps/*/.convex/`

### Convex generated files

`apps/mobile/convex/_generated/` is required for typechecking.

Mitigation:

- commit generated files
- regenerate with `pnpm --filter @icarun/mobile convex:dev`

### OpenAI-compatible provider differences

Some providers may not support:

```json
{
  "response_format": {
    "type": "json_object"
  }
}
```

Mitigation:

- retry without `response_format`
- always parse JSON
- always validate with Zod

### Railway Corepack pnpm startup

Railway previously selected Node 24.10.0 and failed before dependency installation while Corepack launched pnpm 11.13.1 with `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`. The failing stack was inside Corepack and `/root/.cache/node/corepack/pnpm/11.13.1/bin/pnpm.cjs`, before app code ran.

Mitigation:

- remove the root top-level `packageManager` field so Nixpacks detects pnpm from `pnpm-lock.yaml` instead of Corepack
- pin Railway/Nixpacks to Node.js 22 LTS with `package.json` `engines.node: 22.x`
- add `.nvmrc` with `22`
- do not use pnpm 11 `devEngines.packageManager` while Railway is using detected `pnpm-9_x`, because it can add lockfile metadata that pnpm 9 cannot parse

### Railway pnpm 9 broken lockfile

Railway/Nixpacks selected `pnpm-9_x` and then failed with `ERR_PNPM_BROKEN_LOCKFILE: expected a single document in the stream, but found more`. The lockfile contained two YAML documents because pnpm 11 `devEngines.packageManager` metadata had been written at the top.

Mitigation:

- remove root `devEngines.packageManager`
- regenerate `pnpm-lock.yaml` so it has only one YAML document and no extra `---` separators
- allow Railway to use detected `pnpm-9_x` for now (`engines.pnpm: >=9 <12`)

### Railway release deployment

The repo config can define Railway build/start behavior, but the GitHub source branch is configured in Railway service settings.

Mitigation:

- set Railway service source branch to `release`
- keep Railway root directory at the repository root
- set Railway service variable `CONVEX_DEPLOY_KEY`
- ensure `railway.json`, `package.json`, and `pnpm-lock.yaml` are committed to the `release` branch

### Expo dynamic route refresh

Static hosting may break `/tasks/[id]` refresh if no SPA fallback is configured.

Mitigation:

- use `web.output: 'single'`
- configure host index.html fallback

## MVP Completion Checklist

The MVP is complete when:

- `pnpm install` succeeds
- `pnpm typecheck` succeeds
- `pnpm build` succeeds
- Convex functions are deployed
- `api.health.check` works
- task CRUD works
- Expo Web UI can list/create/update/delete tasks
- AI preview works with configured provider key
- AI execute works after confirmation
- OpenAI key stays server-side
- static SPA deploy succeeds
- `/tasks/:id` works after browser refresh