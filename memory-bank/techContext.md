# Tech Context

## Runtime

Use Node.js.

Current local environment is expected to use:

```txt
Node 24.x
pnpm 11.x
```

## Package Manager

Use pnpm.

Do not use npm or yarn unless explicitly requested.

## Frontend Stack

Use:

- Expo
- React Native
- React Native Web
- Expo Router
- TypeScript
- React Query

## Backend Stack

Use:

- Express
- TypeScript
- Drizzle ORM
- drizzle-kit
- PostgreSQL
- Zod
- OpenAI-compatible Chat Completions API

## Database

Use PostgreSQL.

Use Drizzle ORM.

Use drizzle-kit migrations.

Do not use Prisma.

## Deployment

Primary target:

```txt
Railway
```

Deployment style:

```txt
single Node.js service
```

The service should:

- build the Expo Web app
- build the Express server
- run Drizzle migrations
- start Express
- serve web + API from one public URL

## Environment Variables

Server-side:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/icarun

OPENAI_API_KEY=sk-your-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini

APP_ORIGIN=http://localhost:3000
DEV_WEB_ORIGIN=http://localhost:8081

APP_ACCESS_TOKEN=replace-with-long-random-token
```

Frontend-safe:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

Never expose these to the frontend:

```env
OPENAI_API_KEY
DATABASE_URL
APP_ACCESS_TOKEN
```

## Recommended Root Scripts

```json
{
  "scripts": {
    "dev": "pnpm --parallel --filter @icarun/server --filter @icarun/mobile dev",
    "dev:server": "pnpm --filter @icarun/server dev",
    "dev:mobile": "pnpm --filter @icarun/mobile dev",
    "build": "pnpm --filter @icarun/mobile build:web && pnpm --filter @icarun/server build",
    "start": "pnpm --filter @icarun/server start",
    "typecheck": "pnpm -r typecheck",
    "db:generate": "pnpm --filter @icarun/server db:generate",
    "db:migrate": "pnpm --filter @icarun/server db:migrate",
    "db:studio": "pnpm --filter @icarun/server db:studio"
  }
}
```

## Recommended Server Scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

## Recommended Mobile Scripts

```json
{
  "scripts": {
    "dev": "expo start",
    "web": "expo start --web",
    "build:web": "expo export --platform web --output-dir ../server/web-build",
    "typecheck": "tsc --noEmit"
  }
}
```

## Railway Config Direction

Use:

```txt
<project-root>/railway.json
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
