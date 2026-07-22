# Tech Context

## Runtime

Use Node.js for local tooling and Expo/Convex development.

Current local environment has been verified with:

```txt
Node 24.18.0
pnpm 11.13.1
```

## Package Manager

Use pnpm.

Do not use npm or yarn unless explicitly requested.

## Frontend Stack

Use:

- Expo SDK 57
- React 19
- React Native 0.86
- React Native Web 0.21
- Expo Router 57
- TypeScript 6
- Convex React client

## Backend Stack

Use:

- Convex
- TypeScript Convex functions
- Convex schema validators (`convex/values`)
- Zod for AI output validation
- OpenAI-compatible Chat Completions API from Convex actions

## Database

Use Convex.

Do not use PostgreSQL, Drizzle ORM, drizzle-kit, Prisma, or Express for the MVP unless explicitly requested later.

## Deployment

Primary backend target:

```txt
Convex Cloud or compatible Convex deployment
```

Frontend deployment style:

```txt
static SPA hosting
```

The static host should:

- serve the Expo Web build output
- support `index.html` fallback for dynamic routes

Railway release deployment is configured with `railway.json` at the repository root. Railway uses Nixpacks, runs `pnpm run railway:build`, then starts `pnpm run start`. The Railway service source branch must be set to `release` in Railway.

## Environment Variables

Frontend-safe:

```env
EXPO_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
```

Convex server-side:

```env
OPENAI_API_KEY=sk-your-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
```

Railway service variable for production deploy/build:

```env
CONVEX_DEPLOY_KEY=prod:your-convex-deploy-key
```

Never expose these to the frontend or Railway frontend build as public Expo variables:

```env
OPENAI_API_KEY
OPENAI_BASE_URL
OPENAI_MODEL
```

## Root Scripts

```json
{
  "scripts": {
    "dev": "pnpm --filter @icarun/mobile dev",
    "dev:web": "pnpm --filter @icarun/mobile web",
    "convex:dev": "pnpm --filter @icarun/mobile convex:dev",
    "convex:deploy": "pnpm --filter @icarun/mobile convex:deploy",
    "build": "pnpm --filter @icarun/mobile build",
    "typecheck": "pnpm -r typecheck",
    "railway:build": "pnpm --filter @icarun/mobile convex:deploy",
    "start": "serve apps/mobile/dist --single"
  }
}
```

## Mobile Scripts

```json
{
  "scripts": {
    "dev": "expo start",
    "web": "expo start --web",
    "build": "expo export --platform web --output-dir dist",
    "convex:dev": "convex dev",
    "convex:deploy": "convex deploy --cmd-url-env-var-name EXPO_PUBLIC_CONVEX_URL --cmd \"expo export --platform web --output-dir dist\"",
    "typecheck": "tsc --noEmit"
  }
}
```

## Convex Notes

`pnpm --filter @icarun/mobile convex:dev` configures a deployment, pushes functions, and regenerates `convex/_generated`.

Generated files under `apps/mobile/convex/_generated/` should be committed.

Local files under `apps/mobile/.convex/` and `apps/mobile/.env.local` should not be committed.