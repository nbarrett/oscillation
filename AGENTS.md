# AI Assistant Guide

This document provides guidance for AI code assistants working in this repository.

## ⚠️ CRITICAL RULES - READ FIRST

These rules MUST be followed in EVERY session without exception:

### 1. NO CODE COMMENTS
- **NEVER add comments to code** - use self-documenting method names instead
- This includes `//`, `/* */`, and any explanatory text in code
- Remove any comments you see during refactoring

### 2. NO AI ATTRIBUTION IN COMMITS
- **NEVER add AI attribution to commit messages**
- This means NO:
  - `🤖 Generated with [Claude Code](https://claude.ai/code)`
  - `Co-Authored-By: Claude <noreply@anthropic.com>`
  - Any similar AI tool attribution lines
- Commits should appear as if written by a human developer

### 3. FILE OPERATIONS
- **Always free to write/edit existing files and create new files** - no confirmation needed
- **NEVER commit without explicit user request** - user must say "commit" or similar
- **NEVER push without explicit user request** - user must say "push" or similar
- **NEVER proactively commit and push together** - wait for each to be requested separately

### 4. CODE STYLE
- **Always use double quotes** `"` not single quotes `'` for strings
- **No "get" prefixes** on methods (use `user()` not `getUser()`)
- **Follow existing patterns** - don't introduce new approaches
- **Use null instead of undefined**: Always use `null` for absence of value, never `undefined`

### 5. DRY PRINCIPLE (Don't Repeat Yourself)
- **EVERY request implicitly requires DRY abstractions for maintainability**
- **ALWAYS reuse existing components, hooks, and utilities** - never duplicate functionality
- **Before implementing ANY feature**:
  1. Search the codebase for existing implementations
  2. Check for similar components, hooks, or utilities
  3. If found, reuse and enhance rather than duplicate
  4. If similar functionality exists in multiple places, refactor to a shared abstraction first
- **When making changes**:
  - Ask: "Where else is this functionality used?"
  - Update all instances, or better yet, consolidate to a single reusable implementation
  - Look for wrapper components that might be duplicating logic

### 6. DEBUGGING AND LOGGING
- **NEVER use `console.log()` for debugging**
- **Use the existing `log` utility** from `@/lib/utils` (provides `log.debug`, `log.info`, `log.warn`, `log.error`)
- Debug logging is only visible in development mode
- Remove any temporary debug statements before completing work

### 7. INTERFACES AND TYPES
- **Keep related interfaces together** in appropriate files
- **Store types** are defined in their respective store files (e.g., `game-store.ts`)
- **API types** are defined near tRPC routers or in shared type files
- **Component prop types** can be defined inline for simple cases or extracted for complex/shared types

### 8. ERROR HANDLING
- **No empty catches**: Never add `catch {}` or `catch (e) {}` blocks without at least one of:
  - Logging a meaningful message through the log utility, or
  - Returning/falling back to a safe default value
- Prefer small, targeted try/catch blocks close to the failing operation

## Project Overview

Oscillation is a Next.js-based board game application using the T3 Stack architecture.

- **Repository**: https://github.com/nbarrett/oscillation
- **Hosting**: Fly.io (https://oscillation.fly.dev)
- **Architecture**: Next.js 14 (App Router) + tRPC + Drizzle ORM + Zustand

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **API Layer** | tRPC |
| **ORM** | Prisma |
| **Database** | PostgreSQL (Neon) |
| **State Management** | Zustand |
| **UI Framework** | Material UI |
| **Maps** | Leaflet with OS Maps |

## Project Structure

```
/oscillation
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Main game page
│   │   ├── providers.tsx       # tRPC + React Query + MUI providers
│   │   └── api/trpc/[trpc]/route.ts  # tRPC API handler
│   ├── components/             # React components
│   ├── server/
│   │   ├── db/
│   │   │   └── index.ts        # Prisma client
│   │   └── api/
│   │       ├── routers/        # tRPC routers
│   │       ├── root.ts         # Root router
│   │       └── trpc.ts         # tRPC setup
│   ├── lib/
│   │   ├── trpc/client.ts      # tRPC client
│   │   └── utils.ts            # Shared utilities (including log)
│   └── stores/                 # Zustand stores
├── prisma/
│   └── schema.prisma           # Prisma schema
├── public/                     # Static assets
└── package.json
```

## Development Commands

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to PostgreSQL
npm run db:push

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run typecheck
```

## Git Workflow

### Semantic Commit Conventions
Use [Conventional Commits](https://www.conventionalcommits.org/) format:

**Format:** `<type>(<scope>): <description>`

**Types:**
- `feat` - New features or enhancements
- `fix` - Bug fixes
- `refactor` - Code restructuring without behavior changes
- `test` - Adding or updating tests
- `docs` - Documentation changes
- `style` - Code formatting changes
- `build` - Build system or dependency changes

**Scopes (common for this project):**
- `game`, `map`, `dice` - Feature areas
- `ui`, `store`, `api` - Technical components
- `db`, `trpc` - Backend areas

**Examples:**
```
feat(game): add player turn rotation
fix(map): resolve grid selection on mobile
refactor(store): consolidate player state updates
```

### Git Operations - EXPLICIT PERMISSION REQUIRED
- **NEVER commit without explicit user request**
- **NEVER push without explicit user request**
- **NEVER combine commit and push** unless explicitly requested
- Writing/editing files is allowed without permission, but git operations require explicit approval

## Development Patterns

### State Management (Zustand)
```typescript
import { useGameStore } from "@/stores/game-store";

function MyComponent() {
  const { players, setPlayers } = useGameStore();

  const handleUpdate = () => {
    setPlayers(updatedPlayers);
  };
}
```

### tRPC Usage
```typescript
import { api } from "@/lib/trpc/client";

function MyComponent() {
  const { data, isLoading } = api.locations.all.useQuery();
  const createMutation = api.locations.create.useMutation();
}
```

### Logging
```typescript
import { log } from "@/lib/utils";

log.debug("Debug message", someData);
log.info("Info message");
log.warn("Warning message");
log.error("Error message", error);
```

## Map Integration

The app uses Leaflet with OS Maps API for British mapping:
- **Projection**: British National Grid (EPSG:27700)
- **Tiles**: OS Maps API (requires API key)
- **SSR**: Leaflet components use dynamic imports with `ssr: false`

## Summary for AI Assistants

When working on this project:

1. **Remember the commit message rule**: Never add AI attribution lines
2. **Follow existing patterns**: Use double quotes, no code comments, minimal changes
3. **Use the log utility**: Never use `console.log()` directly
4. **Embrace the T3 stack**: Use tRPC for APIs, Zustand for state, Drizzle for database
5. **Handle SSR carefully**: Leaflet components must use dynamic imports
6. **Keep it simple**: This is a game app - don't over-engineer solutions

The project has a clear architecture - work with it, not against it.
