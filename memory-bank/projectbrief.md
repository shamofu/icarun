# Project Brief — icarun

icarun is a task management application inspired by Bluesky's Expo / React Native / React Native Web architecture.

The goal is to build a deployable MVP with:

- Expo / React Native Web frontend
- Express backend API
- PostgreSQL database
- Drizzle ORM and drizzle-kit migrations
- OpenAI-compatible natural language task control
- Railway deployment support
- Server-side secret management
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
- Railway deployment configuration

## Out of Scope Initially

The first MVP should not include:

- full multi-user authentication
- teams
- shared workspaces
- native app store builds
- complex role-based permissions
- advanced analytics
- complex tag normalization
- Prisma
- AI-generated SQL execution

## Primary Technical Decision

Use Drizzle ORM instead of Prisma.

Reason:

- simpler PaaS deployment
- no Prisma Client generation step
- no Prisma query engine binary
- lighter runtime
- easier migration visibility
- sufficient for the app's relational needs
