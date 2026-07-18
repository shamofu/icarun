# Project Brief — icarun

icarun is a task management application inspired by Bluesky's Expo / React Native / React Native Web architecture.

The goal is to build a deployable MVP with:

- Expo / React Native Web frontend
- Convex backend and database
- Convex queries, mutations, and actions
- OpenAI-compatible natural language task control
- static SPA deployment support
- server-side secret management through Convex environment variables
- SPA routing that works with dynamic task URLs

## MVP Scope

The MVP should include:

- task list
- task detail
- task creation
- task editing
- task completion
- task deletion
- task filtering
- AI command preview
- AI command execution after confirmation
- Convex deployment configuration
- static SPA build output

## Out of Scope Initially

The first MVP should not include:

- full multi-user authentication
- teams
- shared workspaces
- native app store builds
- complex role-based permissions
- advanced analytics
- complex tag normalization
- PostgreSQL
- Drizzle ORM
- drizzle-kit
- Prisma
- Express REST API server
- AI-generated SQL execution

## Primary Technical Decision

Use Convex instead of PostgreSQL + Drizzle + Express.

Reason:

- user requested Convex
- realtime data updates
- TypeScript backend functions
- no separate REST API server
- no ORM/migration layer
- simpler AI server-side secret handling
- preview -> confirm -> execute AI model maps naturally to Convex actions plus mutations