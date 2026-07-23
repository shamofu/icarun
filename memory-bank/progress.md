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
- Railway Node runtime pinned to Node.js 22 LTS via `engines.node` and `.nvmrc`.
- Root top-level `packageManager` removed so Railway avoids the Corepack pnpm shim issue.
- pnpm 11 `devEngines.packageManager` removed and `pnpm-lock.yaml` regenerated as a single YAML document for Railway pnpm 9 compatibility.
- `services/*` added to `pnpm-workspace.yaml`.
- Service packages added for `@icarun/convex-backend`, `@icarun/convex-dashboard`, and `@icarun/database`.
- Service-specific `railway.json` files added for frontend, Convex backend, Convex dashboard, and database.
- Docker Compose plan abandoned per user request.

## Not Started / Remaining

- Create Railway services from the same GitHub repository.
- Configure each Railway service to use its service-specific `railway.json`.
- Attach Railway volume to the database service at `/var/lib/postgresql/data`.
- Configure production self-hosted Convex backend environment variables.
- Generate self-hosted Convex admin key via `railway ssh` and `./generate_admin_key.sh`.
- Configure frontend variables `CONVEX_SELF_HOSTED_URL`, `CONVEX_SELF_HOSTED_ADMIN_KEY`, and `EXPO_PUBLIC_CONVEX_URL`.
- Full browser UI smoke test after Railway deployment.
- Real AI preview call with a configured `OPENAI_API_KEY`.
- Authentication.
- Rate limiting / quotas.

## Known Risks

### Railway per-service config

Railway `railway.json` configures one service/deployment, not an entire multi-service project.

Mitigation:

- use pnpm workspace packages for each service
- put a service-specific `railway.json` in each package
- set each Railway service's config file path explicitly

### Database service persistence

The repository-managed PostgreSQL service requires a Railway volume at `/var/lib/postgresql/data`.

Mitigation:

- attach the volume before production use
- keep backend and database in the same Railway region

### Convex self-host admin key

Self-hosted Convex deploy requires an admin key generated from the backend container.

Mitigation:

- run `railway ssh` on `convex-backend`
- run `./generate_admin_key.sh`
- store the resulting key only as `CONVEX_SELF_HOSTED_ADMIN_KEY` on the frontend build/deploy service

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

### Railway pnpm/Corepack compatibility

Railway previously had pnpm/Corepack and pnpm-lock parsing issues.

Mitigation:

- keep `engines.node` as `22.x`
- keep `.nvmrc` as `22`
- do not re-add root top-level `packageManager`
- do not re-add pnpm 11 `devEngines.packageManager`
- keep `pnpm-lock.yaml` as a single YAML document

### Expo dynamic route refresh

Static hosting may break `/tasks/[id]` refresh if no SPA fallback is configured.

Mitigation:

- use `web.output: 'single'`
- use `serve apps/mobile/dist --single`

## MVP Completion Checklist

The MVP is complete when:

- `pnpm install` succeeds
- `pnpm typecheck` succeeds
- `pnpm build` succeeds
- Railway database service persists data on a volume
- self-hosted Convex backend deploys and `/version` works
- Convex dashboard can log in with generated admin key
- Convex functions are deployed to the self-hosted backend
- `api.health.check` works from the frontend
- task CRUD works
- Expo Web UI can list/create/update/delete tasks
- AI preview works with configured provider key
- AI execute works after confirmation
- OpenAI key stays server-side
- static SPA deploy succeeds
- `/tasks/:id` works after browser refresh
