# Deployment Guide

icarun is designed to deploy to Railway or a similar Node.js-compatible PaaS.

The preferred deployment is a single Node.js service that serves both:

1. Express API routes under `/api/*`
2. Expo Web SPA static files

## Architecture

```txt
Railway Node.js Service
  |
  +-- Express API
  |
  +-- Expo Web static files
  |
  +-- SPA fallback to index.html
  |
  +-- PostgreSQL via DATABASE_URL
  |
  +-- OpenAI-compatible API via server-side env
```

## Required Railway Services

- Node.js app service
- PostgreSQL database service

## Required Environment Variables

```env
NODE_ENV=production
PORT=<injected by Railway>

DATABASE_URL=${{Postgres.DATABASE_URL}}

OPENAI_API_KEY=sk-your-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini

APP_ORIGIN=https://your-app.up.railway.app
APP_ACCESS_TOKEN=replace-with-long-random-token
```

Do not set server secrets as Expo public variables.

Only variables prefixed with `EXPO_PUBLIC_` may be referenced in frontend code.

## Build Lifecycle

Expected root-level build:

```bash
pnpm build
```

Expected root-level start:

```bash
pnpm start
```

Expected migration command:

```bash
pnpm --filter @icarun/server db:migrate
```

## railway.json

Expected file:

```txt
railway.json
```

Expected shape:

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "buildCommand": "pnpm build"
  },
  "deploy": {
    "preDeployCommand": "pnpm --filter @icarun/server db:migrate",
    "startCommand": "pnpm start",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

## Server Binding

Railway injects `PORT`.

The Express server must use:

```ts
const port = Number(process.env.PORT) || 3000
app.listen(port, '0.0.0.0')
```

Do not bind only to `localhost` in production.

## Web Build Output

Expo Web should output into the server app:

```txt
apps/server/web-build
```

Recommended mobile script:

```json
{
  "build:web": "expo export --platform web --output-dir ../server/web-build"
}
```

Do not export into server source directories.

## SPA Fallback

Express route order must be:

1. API routes
2. static assets
3. SPA fallback

Expected behavior:

```txt
/api/health       -> API response
/api/tasks        -> API response
/assets/*         -> static asset
/tasks/abc123     -> web-build/index.html
/settings         -> web-build/index.html
```

This requires Expo config:

```ts
web: {
  bundler: 'metro',
  output: 'single'
}
```

Do not use `web.output: 'static'` for this app because task detail routes are dynamic.

## CORS

Production should normally be same-origin because Express serves the frontend.

Development can allow Expo dev server:

```env
DEV_WEB_ORIGIN=http://localhost:8081
```

Do not use unrestricted `*` CORS for private APIs.

## Deployment Checklist

Before deployment:

- `pnpm install` succeeds
- `pnpm typecheck` succeeds
- `pnpm build` succeeds
- Drizzle migrations exist
- `.env.example` is up to date
- Railway env vars are configured
- OpenAI key is not exposed to frontend
- Express listens on `0.0.0.0`
- SPA fallback is implemented

After deployment:

- Check Railway logs
- Open the app URL
- Test `/api/health`
- Create a task
- Refresh a dynamic task URL like `/tasks/<id>`
- Test AI preview with a safe command
- Confirm AI execute requires confirmation
