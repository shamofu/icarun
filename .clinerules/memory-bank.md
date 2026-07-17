# Cline Memory Bank Instructions

My memory resets between sessions, so I rely on the Memory Bank for project continuity.

At the start of every task, I must read all files in:

```txt
memory-bank/
```

The Memory Bank is the source of long-term project context.

## Required Files

```txt
memory-bank/
  projectbrief.md
  productContext.md
  systemPatterns.md
  techContext.md
  activeContext.md
  progress.md
```

## File Purposes

1. `projectbrief.md`
   - Core requirements
   - Project goals
   - Scope boundaries
   - Source of truth for what this project is

2. `productContext.md`
   - Why the project exists
   - Problems it solves
   - User experience goals

3. `systemPatterns.md`
   - Architecture
   - Technical decisions
   - Component relationships
   - Critical implementation paths

4. `techContext.md`
   - Technologies used
   - Development setup
   - Constraints
   - Tooling
   - Deployment assumptions

5. `activeContext.md`
   - Current work focus
   - Recent changes
   - Next steps
   - Open decisions
   - Updated most frequently

6. `progress.md`
   - What works
   - What is left
   - Known issues
   - Milestones

## Update Rules

Update the Memory Bank when:

- significant implementation changes are made
- architecture decisions change
- migrations are added
- deployment behavior changes
- user explicitly asks to update memory
- context needs to be preserved before starting a new task

When asked to "update memory bank", review all memory-bank files and update them accurately.

The Memory Bank should remain concise, factual, and useful for future Cline sessions.
