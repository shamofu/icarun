> SUPERSEDED by ADR 0002 (Use Convex). icarun migrated off PostgreSQL + Drizzle
> + Express to Convex. This ADR is retained for history only. See
> docs/adr/0002-use-convex.md.
# ADR 0001 — Use Drizzle ORM Instead of Prisma

## Status

Accepted

## Context

icarun is a task management app intended to deploy primarily to Railway or a similar Node.js-compatible PaaS.

The backend needs PostgreSQL persistence for:

- tasks
- AI operation logs
- simple future user/account features

The initial schema is small and does not require a heavy ORM abstraction.

The project values:

- deployment simplicity
- lightweight runtime
- clear migrations
- TypeScript support
- PostgreSQL compatibility

## Decision

Use Drizzle ORM with drizzle-kit for database access and migrations.

Do not use Prisma unless explicitly requested later.

## Rationale

Drizzle is preferred because it avoids several deployment-time concerns associated with Prisma:

- no Prisma Client generation step required for runtime code
- no Prisma query engine binary to ship
- fewer PaaS build/runtime moving parts
- lighter runtime model
- SQL-oriented migrations that are easy to inspect
- good fit for relatively simple PostgreSQL schemas

The app's initial database needs are straightforward, so Prisma's higher-level relational abstraction is not necessary for the MVP.

## Alternatives Considered

### Prisma

Pros:

- excellent developer experience
- strong generated client
- Prisma Studio
- common in TypeScript apps

Cons for this project:

- requires Prisma Client generation
- includes query engine/runtime considerations
- adds deployment-time steps
- heavier than needed for the initial schema

### Raw SQL

Pros:

- full control
- minimal abstraction

Cons:

- more manual typing
- more repetitive validation/mapping code
- easier to drift from TypeScript types

## Consequences

Positive:

- simpler PaaS deployment
- lighter server runtime
- explicit SQL/migration visibility
- enough type safety for MVP

Negative:

- requires more SQL knowledge than Prisma
- some CRUD/relation workflows may be more verbose
- fewer high-level abstractions

## Implementation Notes

Use:

```txt
drizzle-orm
drizzle-kit
PostgreSQL
```

Use schema files under:

```txt
apps/server/src/schema/
```

Use migrations under:

```txt
apps/server/drizzle/migrations/
```

Recommended scripts:

```json
{
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio"
}
```

Use `db:push` only for local prototyping, not production.

Railway pre-deploy should run:

```bash
pnpm --filter @icarun/server db:migrate
```
