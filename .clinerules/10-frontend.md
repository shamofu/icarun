---
paths:
  - "apps/mobile/**"
---

# Frontend Rules — Expo / React Native Web

The frontend is an Expo app using React Native and React Native Web.

## Stack

Use:

- Expo
- React Native
- React Native Web
- Expo Router
- TypeScript
- React Query
- React Native StyleSheet or simple themed components

Do not use browser-only React libraries unless they are confirmed compatible with React Native Web.

## Routing

Use Expo Router.

Initial screens:

```txt
/
  Task list
  Filters
  AI command bar
  New task button

/tasks/[id]
  Task detail
  Edit task
  Complete task
  Delete task

/settings
  API/server status
  Basic settings
```

## Expo Web Output

The web app must be built as a SPA.

In `apps/mobile/app.config.ts`, use:

```ts
web: {
  bundler: 'metro',
  output: 'single'
}
```

Do not use:

```ts
web: {
  output: 'static'
}
```

Reason:

- The app uses dynamic routes like `/tasks/[id]`.
- Task IDs are created at runtime.
- Static export cannot know all task URLs at build time.
- Refreshing `/tasks/abc123` may 404 with static output.
- SPA output plus Express fallback solves this.

## Web Build Output

The Expo Web build should output to:

```txt
<project-root>/apps/server/web-build
```

Recommended script:

```json
{
  "scripts": {
    "build:web": "expo export --platform web --output-dir ../server/web-build"
  }
}
```

Do not export into a directory that contains server source files.

## State Management

Use React Query for server state.

Recommended hooks:

```ts
useTasks()
useTask(id)
useCreateTask()
useUpdateTask()
useDeleteTask()
usePreviewAiCommand()
useExecuteAiCommand()
```

Avoid unnecessary global state.

## API Client

Create a small API client in:

```txt
<project-root>/apps/mobile/src/lib/api.ts
```

Use:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

Only public frontend-safe variables may use the `EXPO_PUBLIC_` prefix.

Never reference these in frontend code:

```env
OPENAI_API_KEY
DATABASE_URL
APP_ACCESS_TOKEN
```

## AI Command UI

The AI command bar should follow this flow:

```txt
User input
  -> POST /api/ai/commands/preview
  -> Show proposed actions
  -> User confirms
  -> POST /api/ai/commands/execute
  -> Refresh tasks
```

Never execute AI actions immediately without preview and confirmation.

## TypeScript

Use TypeScript everywhere.

Prefer path alias:

```json
{
  "paths": {
    "#/*": ["./src/*"]
  }
}
```

This mirrors the style used by Bluesky.
