# ADR 0002 - Use Convex Instead of PostgreSQL + Drizzle + Express

## Status

Accepted. Supersedes ADR 0001 (Use Drizzle ORM Instead of Prisma).

## Context

icarun originally targeted a PostgreSQL database accessed through Drizzle ORM,
fronted by an Express REST API, deployed as a single Node.js service on Railway.

The project owner requested moving the database to Convex
(https://www.convex.dev/).

Convex is not a drop-in replacement for PostgreSQL. It is a reactive backend
platform that bundles together:

- a document database
- server-side functions (queries, mutations, actions) written in TypeScript
- client libraries with real-time subscriptions
- deployment tooling and a hosted (or self-hostable) backend

Because Convex provides the database AND the server function layer AND the client
transport, adopting it replaces most of the previous backend stack, not just the
database driver.

## Decision

Adopt Convex as the backend for icarun.

- Data lives in Convex tables defined in convex/schema.ts.
- Task CRUD is implemented as Convex queries and mutations.
- AI task control is implemented as Convex actions (preview / execute).
- The Expo / React Native Web client talks to Convex directly via convex/react
  (useQuery / useMutation / useAction) with real-time updates.
- PostgreSQL, Drizzle ORM, drizzle-kit, and the Express API server are removed.

## Consequences

Positive:

- No SQL, no ORM, no migration tooling to run at deploy time.
- No Express server to build, host, or route.
- Real-time updates come for free via Convex subscriptions.
- The AI safety model is stronger: there is no SQL surface at all, so
  "AI-generated SQL execution" is structurally impossible. AI output is still
  validated with Zod before any mutation runs.
- Secrets (OPENAI_API_KEY etc.) live in the Convex deployment environment and
  are never bundled into the client.

Negative / trade-offs:

- Convex is a different mental model (documents + functions, not tables + SQL).
- The backend runs on Convex (cloud or self-hosted), not as a plain Node service
  on Railway. The frontend is deployed separately as a static SPA.
- Convex generated code (convex/_generated) must be present for typechecking;
  it is produced by `npx convex dev` / `npx convex codegen`.

## Notes on the Previous Decision

ADR 0001 chose Drizzle over Prisma for PaaS deployment simplicity. That reasoning
is now moot because Convex removes the ORM/SQL layer entirely. ADR 0001 is kept
for history but is superseded by this ADR.