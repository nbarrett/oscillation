# AI Assistant Guide

This document provides guidance for AI code assistants working in this repository.

## CRITICAL RULES - READ FIRST

These rules MUST be followed in EVERY session without exception:

### 1. NO CODE COMMENTS
- **NEVER add comments to code** - use self-documenting method names instead
- This includes `//`, `/* */`, and any explanatory text in code
- Remove any comments you see during refactoring

### 2. NO AI ATTRIBUTION IN COMMITS
- **NEVER add AI attribution to commit messages**
- This means NO:
  - `Generated with [Claude Code]`
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

### 8. NEVER BUILD OR START DEV SERVERS
- **A Claude Swarm orchestrator manages all builds and dev servers** — agents must NEVER run build or dev commands
- **NEVER run**: `pnpm run build`, `next build`, `pnpm run dev`, `pnpm dev`, `npm run build`, `npm run dev`, or equivalent
- **NEVER run**: `./run-dev.sh`, `./kill-dev.sh`, or any swarm lifecycle scripts
- Running `next build` while the dev server is active **corrupts the `.next` cache** and breaks the app
- The swarm automatically rebuilds on file changes — just edit files and check the logs
- **To verify your changes compiled**: read the swarm logs at `logs/dev.log` or `logs/oscillation.log`
- **To check swarm status**: read `.claude-swarm/registry.json`
- **Type checking only** (`npx tsc --noEmit`) is safe — it doesn't write to `.next`

### 9. ERROR HANDLING
- **No empty catches**: Never add `catch {}` or `catch (e) {}` blocks without at least one of:
  - Logging a meaningful message through the log utility, or
  - Returning/falling back to a safe default value
- Prefer small, targeted try/catch blocks close to the failing operation

## Project Overview

Oscillation is a multiplayer board game played on real OS Maps of Britain. Players roll dice, move cars along A/B roads on a 1km grid, visit POIs (pubs, churches, phone boxes, schools), and draw cards.

- **Repository**: https://github.com/nbarrett/oscillation
- **Hosting**: Fly.io (https://oscillation.fly.dev)
- **Dev port**: 3002

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **API Layer** | tRPC (via `@trpc/server` + `@trpc/react-query`) |
| **ORM** | Prisma |
| **Database** | PostgreSQL (Neon) |
| **Auth** | NextAuth.js (credentials provider, optional) |
| **State Management** | Zustand (with `persist` middleware using sessionStorage) |
| **UI** | Tailwind CSS + shadcn/ui components |
| **Maps** | Leaflet with OS Maps API tiles |
| **Package Manager** | pnpm |

## Project Structure

```
/oscillation
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Main game page
│   │   ├── providers.tsx       # tRPC + React Query providers
│   │   └── api/trpc/[trpc]/route.ts  # tRPC API handler
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui primitives (button, input, etc.)
│   │   ├── DiceRoller.tsx      # Dice rolling + turn management
│   │   ├── SelectGridSquares.tsx # Map click handling + path preview
│   │   ├── GameSync.tsx        # Server polling + state sync
│   │   ├── JoinGame.tsx        # Game creation/joining stepper
│   │   ├── GameLobby.tsx       # Pre-game lobby
│   │   └── PoiPicker.tsx       # POI selection during picking phase
│   ├── server/
│   │   ├── db/
│   │   │   └── index.ts        # Prisma client
│   │   ├── api/
│   │   │   ├── routers/        # tRPC routers (game.ts, locations.ts, auth.ts)
│   │   │   ├── root.ts         # Root router
│   │   │   └── trpc.ts         # tRPC setup
│   │   └── overpass.ts         # Overpass API for POI data
│   ├── lib/
│   │   ├── trpc/client.ts      # tRPC client setup
│   │   ├── road-data.ts        # Road grid BFS, pathfinding, grid utilities
│   │   ├── poi-categories.ts   # POI type definitions + validation
│   │   ├── card-decks.ts       # Chance/Edge/Motorway card definitions
│   │   ├── area-size.ts        # Game area bounds calculation
│   │   ├── cn.ts               # Tailwind class merging utility
│   │   └── utils.ts            # Shared utilities (log, formatting)
│   └── stores/                 # Zustand stores
│       ├── game-store.ts       # Main game state (players, turns, movement)
│       ├── deck-store.ts       # Card deck state
│       ├── car-store.ts        # Car icon styles
│       ├── pub-store.ts        # Pub POI data
│       ├── church-store.ts     # Church spire/tower POI data
│       ├── phone-store.ts      # Phone box POI data
│       ├── school-store.ts     # School POI data
│       ├── error-store.ts      # Error notification state
│       └── notification-store.ts # Toast notifications
├── prisma/
│   └── schema.prisma           # Prisma schema (GameSession, GamePlayer, etc.)
├── public/                     # Static assets (car images, icons)
└── package.json
```

## Key Architecture Patterns

### State Management (Zustand)
- Game state persists to **sessionStorage** (per-tab isolation for multiplayer testing)
- Access store outside React: `useGameStore.getState()`
- Subscribe to changes: `useGameStore.subscribe(callback)`

```typescript
import { useGameStore } from "@/stores/game-store";

function MyComponent() {
  const players = useGameStore((s) => s.players);
  const setPlayers = useGameStore((s) => s.setPlayers);
}
```

### tRPC Usage
```typescript
import { trpc } from "@/lib/trpc/client";

function MyComponent() {
  const { data } = trpc.game.state.useQuery({ sessionId });
  const mutation = trpc.game.rollDice.useMutation();
}
```

### Map / Grid System
- **Projection**: British National Grid (EPSG:27700) via proj4
- **Grid resolution**: 1km squares (keys like `"549000-217000"`)
- **Road data**: A/B roads loaded via tRPC, stored in `roadDataCache`
- **Pathfinding**: BFS through road-connected grid adjacency
- **Movement**: Player clicks grid → `shortestPath()` → `movementPath` in store
- **Leaflet SSR**: Components use `dynamic(() => import(...), { ssr: false })`

### Game Flow
1. **JoinGame** (4-step stepper): Player → Location → Settings → Review
2. **GameLobby**: Wait for players, start game
3. **PoiPicker**: Each player picks POIs to visit
4. **Playing**: Roll dice → preview paths → click to move → end turn
5. **Cards**: Chance (doubles), Edge/Motorway (triggered mid-movement)

### Turn State Machine
```
ROLL_DICE → DICE_ROLLED → (player moves on map) → END_TURN → ROLL_DICE
```
Managed by `GameTurnState` enum in `game-store.ts`.

### Logging
```typescript
import { log } from "@/lib/utils";

log.debug("Debug message", someData);
log.info("Info message");
log.warn("Warning message");
log.error("Error message", error);
```

## Git Workflow

### Semantic Commit Conventions
Use [Conventional Commits](https://www.conventionalcommits.org/) format:

**Format:** `<type>(<scope>): <description> (ref: #<issue>)`

**Types:**
- `feat` - New features or enhancements
- `fix` - Bug fixes
- `refactor` - Code restructuring without behavior changes
- `test` - Adding or updating tests
- `docs` - Documentation changes
- `style` - Code formatting changes
- `build` - Build system or dependency changes

**Scopes:**
- `game`, `map`, `dice`, `movement` - Feature areas
- `ui`, `store`, `api` - Technical components
- `db`, `trpc` - Backend areas

**Issue Reference:**
- Always include the issue reference at the end of the first line: `(ref: #4)`

**Examples:**
```
feat(game): add player turn rotation (ref: #12)
fix(map): resolve grid selection on mobile (ref: #8)
refactor(store): consolidate player state updates (ref: #15)
```

### Git Operations - EXPLICIT PERMISSION REQUIRED
- **NEVER commit without explicit user request**
- **NEVER push without explicit user request**
- **NEVER combine commit and push** unless explicitly requested
- **NEVER force push to main** - this is not allowed under any circumstances
- Writing/editing files is allowed without permission, but git operations require explicit approval

## Summary for AI Assistants

When working on this project:

1. **No comments, no AI attribution** in code or commits
2. **Double quotes, no `get` prefixes, `null` not `undefined`**
3. **Use `log` utility** from `@/lib/utils` — never `console.log()`
4. **Never build or run dev** — the swarm handles it, use `npx tsc --noEmit` for type checks
5. **Embrace the stack**: tRPC for APIs, Zustand for state, Prisma for database, shadcn for UI
6. **SSR safety**: Leaflet components must use `dynamic(() => import(...), { ssr: false })`
7. **Search before creating** — reuse existing components, hooks, and utilities
