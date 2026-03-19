# Dallateas

Vinyl record collection manager built for DJs. Organize your crates, build sets, share public collections, and create your DJ profile.

## Stack

| Layer | Tech |
|-------|------|
| Monorepo | Turborepo + Bun 1.2 |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui |
| API | tRPC 11 + TanStack React Query 5 |
| Database | SQLite (Turso/libsql) or PostgreSQL via Prisma 7 |
| Auth | Better-Auth 1.5 (email/password, magic link, OTP, admin, HIBP) |
| Validation | Zod 4 |
| Deploy | Vercel (PWA ready) |

## Features

**Collection**
- Vinyl CRUD with Discogs integration (search, release details, tracklist)
- Barcode scanner and camera capture
- Folders (Genre/Set/Other) with drag-and-drop reordering
- Track listings (Side A/B) with YouTube video previews
- Tags, mix notes, price tracking
- CSV and Discogs bulk import with pagination
- Multi-select filters (genre, style, tags)
- Duplicate detection

**Sharing**
- Public/private/account-only visibility per folder
- Password-protected bateas
- Role-based collaboration (Viewer, Contributor, Editor, Admin)
- Public tracklist view for SET folders

**DJ Profile** (`/p/[slug]`)
- Custom slug URL
- Bio, location, genres, social links (Instagram, SoundCloud, Spotify, custom)
- Featured mix (YouTube/SoundCloud/Mixcloud embed)
- Sets & Mixes section with slider/card layout
- Featured vinyl from collection
- Upcoming gigs with ticket links
- Booking contact + press kit link
- View counter
- JSON-LD structured data

**Platform**
- PWA with offline support + service worker caching
- Admin panel (user management, impersonation, ban, role change)
- Haptic feedback (web-haptics)
- Vercel Analytics + Speed Insights
- OWASP security (rate limiting, CSRF, scrypt passwords, no raw SQL)

## Setup

```bash
bun install
cp apps/web/.env.example apps/web/.env  # fill in values
bun run db:push
bun run db:generate
bun run dev
```

Open [http://localhost:3001](http://localhost:3001)

## Environment Variables

Create `apps/web/.env`:

```env
DATABASE_URL=file:../../local.db
DB_PROVIDER=sqlite
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
| `bun run db:push` | Apply schema to database |
| `bun run db:generate` | Regenerate Prisma client |
| `bun run db:studio` | Open Prisma Studio |

## Architecture

```
apps/web/              # Next.js fullstack app
packages/api/          # tRPC router (all business logic in single file)
packages/auth/         # Better-Auth config + email templates
packages/db/           # Prisma schema (multi-file) + client singleton
packages/env/          # Type-safe environment variables
packages/ui/           # Shared shadcn/ui components + design tokens
packages/config/       # Shared TypeScript config
```

## License

MIT
