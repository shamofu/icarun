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

## Railway Deployment

Railway hosts the Expo Web static SPA from `apps/mobile/dist`. The Convex backend is still deployed to Convex Cloud; Railway only serves the built frontend.

This repository includes `railway.json` for Railway config-as-code:

- build uses Nixpacks and runs `pnpm run railway:build`.
- `railway:build` runs `pnpm --filter @icarun/mobile convex:deploy`.
- `convex:deploy` deploys Convex functions and runs the Expo Web export with `EXPO_PUBLIC_CONVEX_URL` set to the production Convex URL.
- start runs `serve apps/mobile/dist --single`, which serves the SPA and rewrites non-file routes such as `/tasks/<id>` to `index.html`.

### Railway GitHub settings

In Railway, connect the GitHub repository to a service and configure the service source branch to:

```txt
release
```

Railway's source branch is a service setting in the Railway dashboard, not a value that can be committed in `railway.json`. Keep the Railway root directory at the repository root so the pnpm workspace and `railway.json` are visible.

### Railway service variables

Set this variable on the Railway service:

```env
CONVEX_DEPLOY_KEY=prod:your-convex-deploy-key
```

Generate the production deploy key in the Convex dashboard. Do not set `OPENAI_API_KEY`, `OPENAI_BASE_URL`, or `OPENAI_MODEL` as Expo public variables; those provider secrets belong on the Convex deployment via `npx convex env set ...`.

Railway provides `PORT` automatically. The `serve` package reads `PORT` when no explicit listen port is supplied.

### Deploy flow

```txt
push to release
  -> Railway GitHub autodeploy for the release branch
  -> pnpm install
  -> pnpm run railway:build
       -> convex deploy using CONVEX_DEPLOY_KEY
       -> expo export writes apps/mobile/dist with production EXPO_PUBLIC_CONVEX_URL
  -> pnpm run start
       -> serve apps/mobile/dist --single on Railway's PORT
```

## Deployment Checklist

Before deployment:

- `pnpm install` succeeds
- `pnpm typecheck` succeeds
- Convex functions are ready via `pnpm --filter @icarun/mobile convex:dev`
- `pnpm build` succeeds
- `railway.json` is committed
- Railway service is connected to the GitHub `release` branch
- Railway service variable `CONVEX_DEPLOY_KEY` is set
- `apps/mobile/convex/_generated/` is committed
- `.env.example` is up to date
- Convex env vars are configured
- OpenAI key is not exposed to frontend
- SPA fallback is configured on the static host
- Railway start command serves `apps/mobile/dist` with `serve --single`

After deployment:

- Open the app URL
- Check Settings for Convex health
- Create a task
- Refresh a dynamic task URL like `/tasks/<id>`
- Test AI preview with a safe command
- Confirm AI execute requires confirmation