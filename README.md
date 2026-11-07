# Dallateas

Vinyl record collection manager built for DJs. Organize your crates, build sets, share public collections, and create your DJ profile.

## Stack

| Layer | Tech |
|-------|------|
| Monorepo | Turborepo + Bun |
| Frontend | Next.js 16 (App Router, Turbopack, React Compiler), React 19, Tailwind CSS 4 |
| API | tRPC 11 + TanStack Query 5, prefetched from Server Components |
| Database | PostgreSQL via Prisma 7 |
| Auth | Better Auth (email and password, magic link, OTP, admin, HIBP) |
| Validation | Zod 4 |
| Deploy | Vercel, installable as a PWA |

The tempo, key and mixing logic lives in `packages/dj`, with no dependencies, so the API and the browser share it.
The design system is described in `DESIGN.md`.

## Features

**Per-track tempo and key**
- BPM, key, energy and cue notes on every cut of a record
- Three ways to get a tempo, each stored with its source: tap, microphone, or a lookup
- Lookups are marked approximate. Deezer is the free source without an API key, and it holds a tempo for about half of DJ tracks. Discogs has none
- Collection filters by BPM range and key, on a single cut

**Mixing on turntables**
- Mix finder: what can follow a track on your pitch fader, ranked by harmonic match
- A turntable has no key lock, so matches are judged on the key heard after pitching
- Set flow for SET folders: tempo curve, the pitch each change needs, changes out of reach, running time
- Choose which cut of each record plays in a set, and a packing list by storage location
- Public tools at `/herramientas`: tap tempo, microphone tempo, pitch calculator, speed conversion, Camelot wheel

**Collection**
- Discogs search, release details and bulk import, plus CSV import and export
- Barcode scanner and camera capture
- Condition grading (Goldmine), speed, storage location and play tracking
- Folders (genre, set, other) with drag and drop, tags, mix notes and price tracking

**Sharing**
- Public, account-only or private folders, with optional passwords
- Role-based collaboration
- DJ profile at `/p/[slug]`: bio, links, mixes, featured record, gigs, booking and JSON-LD

**Platform**
- Offline page and a hand-written service worker that never caches API responses
- Admin panel: user management, impersonation, ban, role change
- Nonce-based CSP, database-backed rate limits, masked internal errors

## Setup

```bash
bun install
cp apps/web/.env.example apps/web/.env  # fill in values
bun run db:push
bun run dev
```

Open [http://localhost:3001](http://localhost:3001)

## Environment Variables

Create `apps/web/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dallateas
BETTER_AUTH_SECRET=your-secret-min-32-chars
BETTER_AUTH_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3001

# Optional
DISCOGS_KEY=
DISCOGS_SECRET=
GMAIL_USER=
GMAIL_APP_PASSWORD=
```

## Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start all apps |
| `bun run dev:web` | Start web app only |
| `bun run build` | Production build |
| `bun run check-types` | Type check monorepo |
| `bun run lint` | Run ESLint |
| `bun run test` | Run all tests |
| `bun run db:push` | Apply schema to database |
| `bun run db:generate` | Regenerate Prisma client |
| `bun run db:studio` | Open Prisma Studio |

## Tests

Unit tests run anywhere. Integration tests need a Postgres database whose name contains `test`, and are skipped without one:

```bash
TEST_DATABASE_URL=postgresql://user@localhost:5432/dallateas_test bun run test
```

They wipe that database on every run, so never point them at one you care about. Apply the schema to it first with `DATABASE_URL=<same url> bun run db:push`.

## Architecture

```
apps/web/              # Next.js fullstack app
packages/api/          # tRPC routers by domain, access rules, rate limits
packages/auth/         # Better Auth config + email templates
packages/db/           # Prisma schema (multi-file) + client singleton
packages/dj/           # Tempo, key and mixing logic, no dependencies
packages/env/          # Type-safe environment variables
packages/ui/           # Shared components + design tokens
packages/config/       # Shared TypeScript config
```

## License

MIT
