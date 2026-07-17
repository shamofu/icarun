# Progress

## Done

- Project direction defined.
- Drizzle chosen over Prisma.
- Expo / React Native Web architecture selected.
- Express API architecture selected.
- PostgreSQL selected.
- Railway selected as primary PaaS target.
- OpenAI-compatible API integration design selected.
- Preview-confirm-execute AI safety model selected.
- Cline project memory structure drafted.

## Not Started

- pnpm workspace setup
- Expo app setup
- Express server setup
- Drizzle installation
- drizzle-kit configuration
- database schema
- migrations
- task CRUD API
- task UI
- AI preview endpoint
- AI execute endpoint
- AI command UI
- auth
- rate limiting
- Railway deployment
- local verification

## Known Risks

### Drizzle config version differences

drizzle-kit config syntax may vary by version.

Mitigation:

- check installed drizzle-kit docs/version before final implementation

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

- support fallback retry without `response_format`
- always parse JSON
- always validate with Zod

### Expo monorepo complexity

Expo + Metro can have issues with workspace packages.

Mitigation:

- avoid `packages/shared` at first
- duplicate small types initially
- add Metro config only when necessary

### Railway monorepo detection

Railway may not infer the intended build/start commands.

Mitigation:

- provide `railway.json`
- explicitly set build command
- explicitly set pre-deploy migration command
- explicitly set start command

### Dynamic route 404s

Static web export may break `/tasks/[id]` refresh.

Mitigation:

- use `web.output: 'single'`
- add Express SPA fallback

## MVP Completion Checklist

The MVP is complete when:

- `pnpm install` succeeds
- `pnpm build` succeeds
- `pnpm start` starts the server
- `/api/health` works
- task CRUD works
- Expo Web UI can list/create/update/delete tasks
- AI preview works
- AI execute works after confirmation
- OpenAI key stays server-side
- Drizzle migrations run in deployment
- Railway deploy succeeds
- `/tasks/:id` works after browser refresh
