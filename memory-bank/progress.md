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

## Not Started / Remaining

- Real production Convex deployment setup.
- Production OpenAI-compatible env var configuration.
- Static SPA host selection and deployment.
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