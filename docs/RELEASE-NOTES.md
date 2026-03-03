# Oscillation Development Summary

> **Period:** 31 January - 3 March 2026
> **Commits:** 80 (active development period)
> **Repository:** [github.com/nbarrett/oscillation](https://github.com/nbarrett/oscillation)
> **Live:** [oscillation.fly.dev](https://oscillation.fly.dev)

---

## Week of 3 March 2026

> **Commits:** 9

### Ben's Work

#### Bot Players & Session Recovery
> **Commits:** 2

- **Configurable Bot Count** - Players can set the number of bots when creating a game
- **Stale Session Recovery** - Rejoin games after disconnection without losing progress
- **Overpass Query Optimization** - Improved query performance for bot-heavy games

#### Movement & Card Fixes
> **Commits:** 2

- **A/B Road Movement Fix** - Corrected movement logic on A and B roads
- **Blocking Location Validation** - Removed unnecessary validation that was preventing valid moves

#### Build Fixes
> **Commits:** 2

- **Obstruction Icons** - Committed missing icon assets and fixed GameSync dice handling
- **Vitest Config** - Added vitest dependency and configuration for CI type-checking

#### Performance
> **Commits:** 1

- **Count-Only Overpass Query** - POI area validation now uses lightweight count queries instead of full data fetches

### James's Work

#### Bot Toggle UI
> **Commits:** 2

- **Game Creation UI** - Added bot toggle to the game creation form
- **Merge Cleanup** - Removed leftover botCount UI from a merge conflict

#### Build Fixes
> **Commits:** 2

- **Lockfile Sync** - Updated pnpm-lock.yaml to match package.json
- **Icon Exports** - Added missing obstruction icon exports and excluded tests from typecheck

---

## Week of 24 February 2026

> **Commits:** 13

### Ben's Work

#### Card System
> **Dates:** 24-26 Feb | **Commits:** 4

Full digitisation of the physical card decks:

- **Three Card Decks** - Chance, Motorway/Railway, and Edge cards with triggers and obstructions (ref: #9)
- **Mid-Movement Triggers** - Cards now trigger when crossing motorways, railways, or board edges during movement rather than at end of turn
- **Card Draw Rules** - Cards only drawn when landing on motorway, railway, or board edge
- **Movement Restriction** - Player movement restricted to A and B roads only

#### Map & Obstruction Icons
> **Commits:** 1

- **Obstruction Markers** - Wired obstruction icons to map markers with style selector for visual differentiation

#### Starting Location Validation
> **Commits:** 3

- **POI Coverage Filter** - Starting locations filtered by POI coverage validity
- **Non-Blocking UI** - Location list no longer blocked while validating POI coverage
- **Grid Snapping** - Starting position snaps to grid square center

#### Overpass API
> **Commits:** 2

- **Query Splitting** - Split Overpass queries with increased timeout to prevent aborts
- **Motorway Filtering** - Filter POIs from motorways, require railway/motorway in game area

### James's Work

#### Path & POI Enhancements
> **Commits:** 2

- **Endpoint Previews** - Preview path endpoints on the map before committing to a move
- **Find My Car** - Added "Find My Car" feature to POI picker for quick navigation
- **Road Connectivity** - Fixed road connectivity issues
- **Preview Paths Toggle** - New toggle to show/hide path highlights with improved visibility

#### Smart Bots
> **Commits:** 1

- **Bot AI** - Smart bots with objective-seeking behaviour
- **Objective Arrows** - Visual arrows showing bot targets on the map
- **B Road Support** - Bots can navigate B roads
- **Dev Server Fix** - Fixed dev server startup issues

---

## Week of 17 February 2026

> **Commits:** 15

### Nick's Work

#### Card Deck Documentation
> **Date:** 18 Feb | **Commits:** 2

- **Physical Card Images** - Added reference images of physical card decks for digitisation (ref: #9)
- **Chance/Obstructions** - Added chance and obstructions deck reference images

#### Claude-Swarm Integration
> **Dates:** 18-22 Feb | **Commits:** 8

- **Service Contract** - Added claude-swarm service manifest with start/stop/port/health configuration
- **Port-Scoped Kill** - Dev server kill script targets specific port to avoid killing other processes
- **Version Upgrades** - Iterated through claude-swarm versions 0.1.4 to 0.1.13
- **Pre-Push Hook** - Added timed pre-push hook for build validation

### Ben's Work

#### Game Phases & Win Condition
> **Date:** 17 Feb | **Commits:** 2

- **Game Phases** - Full phase system: Lobby → POI Picking → Playing (ref: #8)
- **POI Visits** - Track which POIs each player has visited
- **Cards & Win Condition** - Draw cards on triggers, first to complete all objectives wins
- **POI Picking Phase** - New intermediate phase for players to select their POI objectives

### James's Work

#### Movement & UI
> **Date:** 17 Feb | **Commits:** 3

- **Click-to-Build Path** - Players click grid squares to build their movement path
- **Grid-Aligned Boundary** - Game boundary aligns precisely to the grid
- **Grid Highlighting** - Fixed projection issues with grid highlighting and dice roll snap (ref: #8)
- **Code Cleanup** - Removed dead code, fixed memory leaks, and fixed React key bug

---

## Week of 10 February 2026

> **Commits:** 16

### James's Work

#### Movement System
> **Dates:** 12-15 Feb | **Commits:** 7

Major overhaul of the movement and game loop:

- **Reachable Squares** - Highlight all road squares within dice roll distance
- **Proj4 BNG Conversion** - Accurate British National Grid coordinate conversion using proj4
- **One Per Square** - Enforce one player per grid square (ref: #5)
- **Road Data Caching** - Cache road data in localStorage with retry logic (ref: #5)
- **End Turn Snap** - Move car to destination on end turn and snap to nearest road (ref: #5)
- **Core Game Loop** - Fixed 1km grid squares, free movement, turn protection, and position saving (ref: #7)
- **Auto-Path Selection** - Highlight reachable squares after dice roll with automatic path selection

### Ben's Work

#### POI System & Game Area
> **Dates:** 12-15 Feb | **Commits:** 6

- **POI System** - 5 POI types with detailed and simple icon modes, car photos, and road filtering
- **Pub Markers** - Pub markers on A/B roads with selectable icons
- **Trunk Road Exclusion** - Exclude trunk roads from POI filtering
- **Map Search Box** - Added search box for finding locations on the map
- **Bounded Game Area** - Configurable game area with size selector (ref: #8)
- **POI Validation** - Validate starting points have sufficient POI coverage (ref: #8)
- **Deterministic Split** - Fixed deterministic spire/tower split and road path routing (ref: #8)

### Nick's Work

#### Position & Build
> **Dates:** 14 Feb | **Commits:** 3

- **Position Persistence** - Persist player position to database on end turn (ref: #5)
- **Dev Scripts** - Added start/stop scripts for development
- **Next.js Pin** - Pinned Next.js to 14.2.35 and deduplicated lockfile

---

## Week of 3 February 2026

> **Commits:** 1

### Ben's Work

#### Grid Overlay
> **Date:** 3 Feb | **Commits:** 1

- **OS Grid Overlay** - Added Ordnance Survey grid overlay to the map with 6-digit grid references

---

## Week of 27 January 2026

> **Commits:** 26

### Nick's Work

#### T3 Stack Migration & Deployment
> **Dates:** 31 Jan | **Commits:** 13

Complete migration of the application to the T3 Stack and deployment to Fly.io:

- **T3 Stack** - Migrated to Next.js 14 (App Router) + tRPC + Prisma + PostgreSQL (ref: #2)
- **GitHub Actions** - CI/CD workflow for automated Fly.io deployment
- **pnpm** - Switched to pnpm package manager
- **ESLint** - Added Next.js ESLint configuration
- **Docker** - Extensive Docker configuration for Prisma/OpenSSL compatibility (6 iterations)
- **London Region** - Moved Fly.io deployment to London region
- **Port 3002** - Dev server port changed to avoid conflict with AnnixApp

#### Game UI & Features
> **Dates:** 31 Jan - 1 Feb | **Commits:** 5

- **Context Menu** - Right-click context menu and click marker for selecting starting points
- **Dice Animation** - Polished 3D dice animation with settings panel and map controls
- **Tooltips** - Added tooltips to header game controls
- **Dice Fix** - Removed invalid hook call inside dice callback

#### Multiplayer
> **Dates:** 1-2 Feb | **Commits:** 6

- **Real-Time Sessions** - Full multiplayer game session support with WebSocket sync
- **User Authentication** - Login required to play, with car movement fix
- **Player Notifications** - Join/leave notifications for all players (ref: #4)
- **Error Handling** - Global error handling, error snackbar, and migration fixes
- **Health Checks** - Deployment health check verification

#### Deployment Fixes
> **Dates:** 1 Feb | **Commits:** 2

- **Migration** - Added missing migration file and resolved failed migration with idempotent SQL
- **Prisma Runtime** - Fixed Prisma CLI installation and node_modules ownership in Docker

### James's Work

#### Grid Movement
> **Date:** 2 Feb | **Commits:** 1

- **Road Validation** - Grid-based movement with road network validation

---

## Earlier Development (2024-2025)

> **Period:** January 2024 - September 2025
> **Commits:** 27 | **Author:** Nick

The initial development of Oscillation as a prototype:

- **Initial App** - Frontend and backend with route calculation and plotting
- **Recoil State** - State management with Recoil atoms (later migrated to Zustand)
- **OS Maps** - Ordnance Survey Maps integration with multiple providers and layers
- **EPSG:27700** - British National Grid projection support
- **Mobile Layout** - Responsive UI with compressed car PNG assets
- **Dice Roller** - Initial dice rolling with player turn cycling
- **Grid Selection** - Click-to-select grid squares for movement
- **Dockerisation** - Initial Docker setup and deployment to Fly.io

---

## Contributors

| Contributor | Active Period | Commits |
|-------------|---------------|---------|
| **Nick** (nbarrett) | Jan 2024 - Feb 2026 | 65 (+59,536 / -40,541 lines) |
| **Ben** (BenmanB) | Feb - Mar 2026 | 24 (+9,727 / -1,773 lines) |
| **James** (James Barrett) | Feb - Mar 2026 | 18 (+2,275 / -1,298 lines) |

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **API Layer** | tRPC |
| **ORM** | Prisma |
| **Database** | PostgreSQL (Neon) |
| **State** | Zustand |
| **UI** | Material UI |
| **Maps** | Leaflet + OS Maps (EPSG:27700) |
| **Hosting** | Fly.io (London) |
| **CI/CD** | GitHub Actions |

---

*Document generated: 3 March 2026*
