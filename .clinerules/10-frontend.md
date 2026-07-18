# Frontend Rules — Expo / React Native Web + Convex

The frontend is an Expo app using React Native and React Native Web.

## Stack

Use:

- Expo
- React Native
- React Native Web
- Expo Router
- TypeScript
- Convex React client (`convex/react`)
- React Native StyleSheet or simple themed components

Do not use browser-only React libraries unless they are confirmed compatible with React Native Web.

React Query is no longer required for server state because Convex provides realtime queries and mutations.

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
  Convex/server status
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
- SPA output avoids dynamic route refresh problems on compatible hosts.

## State Management

Use Convex for server state.

Recommended usage:

```ts
useQuery(api.tasks.list, args)
useQuery(api.tasks.get, { id })
useMutation(api.tasks.create)
useMutation(api.tasks.update)
useMutation(api.tasks.remove)
useAction(api.ai.preview)
useAction(api.ai.execute)
```

Avoid unnecessary global state.

## Convex Client

Create a small Convex client in:

```txt
apps/mobile/src/lib/convex.ts
```

Use:

```env
EXPO_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
```

Only public frontend-safe variables may use the `EXPO_PUBLIC_` prefix.

Never reference these in frontend code:

```env
OPENAI_API_KEY
OPENAI_BASE_URL
OPENAI_MODEL
```

## AI Command UI

The AI command bar should follow this flow:

```txt
User input
  -> api.ai.preview Convex action
  -> Show proposed actions
  -> User confirms
  -> api.ai.execute Convex action
  -> Convex realtime queries refresh UI
```

Never execute AI actions immediately without preview and confirmation.

## TypeScript

Use TypeScript everywhere.

Use path aliases:

```json
{
  "paths": {
    "#/*": ["./src/*"],
    "@/*": ["./*"]
  }
}
```

`@/*` is used for imports from `apps/mobile/convex/_generated/*`.