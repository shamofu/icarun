# Deployment Guide

icarun is designed as a Convex-backed Expo / React Native Web SPA.

The deployment has two parts:

1. Convex backend deployment
2. Static SPA frontend hosting

## Architecture

```txt
Static SPA host
  |
  | EXPO_PUBLIC_CONVEX_URL
  v
Convex backend
  |
  +-- Convex database
  |
  +-- Convex queries/mutations/actions
  |
  +-- OpenAI-compatible API via Convex env vars
```

## Required Services

- Convex project/deployment
- Static hosting provider for `apps/mobile/dist`

The static host can be Netlify, Vercel static output, GitHub Pages, Railway static hosting, or any provider that can serve an SPA with `index.html` fallback.

## Required Environment Variables

Frontend build-time variable:

```env
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

This is safe to expose to the client.

Convex backend environment variables:

```env
OPENAI_API_KEY=sk-your-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
```

Set backend secrets on the Convex deployment:

```bash
npx convex env set OPENAI_API_KEY sk-your-key
npx convex env set OPENAI_BASE_URL https://api.openai.com/v1
npx convex env set OPENAI_MODEL gpt-4.1-mini
```

Do not set server secrets as Expo public variables.

## Local Development

Install dependencies:

```bash
pnpm install
```

Start Convex dev:

```bash
pnpm --filter @icarun/mobile convex:dev
```

This creates/uses a Convex deployment, regenerates `convex/_generated`, and writes the local public Convex URL to `apps/mobile/.env.local`.

Start Expo Web:

```bash
pnpm --filter @icarun/mobile web
```

## Build Lifecycle

Expected root-level build:

```bash
pnpm build
```

This runs:

```bash
pnpm --filter @icarun/mobile build
```

and writes the static web output to:

```txt
apps/mobile/dist
```

## Convex Production Deploy

Deploy Convex functions and build against the production Convex URL:

```bash
pnpm --filter @icarun/mobile convex:deploy
```

The script uses:

```bash
convex deploy --cmd-url-env-var-name EXPO_PUBLIC_CONVEX_URL --cmd "expo export --platform web --output-dir dist"
```

`convex deploy` sets `EXPO_PUBLIC_CONVEX_URL` for the build command so the built frontend points at the production Convex deployment.

## SPA Fallback

Expo config must keep:

```ts
web: {
  bundler: 'metro',
  output: 'single'
}
```

The static host should serve `index.html` for non-file routes such as:

```txt
/tasks/abc123
/settings
```

## Deployment Checklist

Before deployment:

- `pnpm install` succeeds
- `pnpm typecheck` succeeds
- Convex functions are ready via `pnpm --filter @icarun/mobile convex:dev`
- `pnpm build` succeeds
- `apps/mobile/convex/_generated/` is committed
- `.env.example` is up to date
- Convex env vars are configured
- OpenAI key is not exposed to frontend
- SPA fallback is configured on the static host

After deployment:

- Open the app URL
- Check Settings for Convex health
- Create a task
- Refresh a dynamic task URL like `/tasks/<id>`
- Test AI preview with a safe command
- Confirm AI execute requires confirmation