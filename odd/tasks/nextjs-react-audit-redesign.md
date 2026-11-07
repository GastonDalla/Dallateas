# Next.js/React audit, redesign and vinyl DJ features

Objective: audit and fix the app, redesign it, add per-track BPM and vinyl DJ tools, update every package.
Branch: `GastonDalla/nextjs-react-audit-redesign`. Delivery: `single-pr` with reviewable work-unit commits; push and PR stay the user's decision.
Test runner: `bun test`, integration tests against a scratch Postgres. Engram mirror: pending (tools unavailable this session).

## Specs

- S1: "revises este codigo, que busques malas practicas de next.js y react y las arregles a todas"
- S2: "usa todas mis skills" (assumption: the skills that apply to this work; Ableton and offensive-security skills do not)
- S3: "quiero que mejores el diseno usa, mis skills de diseno y anti ai slop"
- S4: "quiero que pongas los bpm que tiene cada track del vinilo"
- S5: "quiero que mejores todo el codigo y lo dejes profesional y perfecto"
- S6: "Tambien haz auditorias de seguridad"
- S7: "actualiza todos los packages"
- S8: "sugiereme cosas para agregarle"
- S9: "agrega cosas que le servirian a las personas que tocan y son dj con vinilos"

## Tasks

| ID | Specs | Task | Route | Status | Commit |
| --- | --- | --- | --- | --- | --- |
| T1 | S5, S7 | Repo hygiene: tracked lockfile, untrack generated client, lint, test and type-check scripts | inline | done | 7d617a6 |
| T2 | S6, S7 | Update every package, replace next-pwa with a hand-written service worker, `bun audit` clean | inline | done | 7a55029 |
| T3 | S5, S6 | Split the god router, add `adminProcedure`, fix authorization, data leaks, XSS, password handling, rate limits, headers | inline | done | 2c3b8b2..f9a855b, f0606c1 |
| T4 | S1 | Server Components and prefetch for public pages, per-request QueryClient, next/image, typed routes, metadata | delegated, 4 parallel screen units (reason: independent units with disjoint surfaces) | in progress | 9afa4ed foundation |
| T5 | S4 | Per-track BPM and key: schema, API, form, display, lookup with source | inline API, delegated UI | API done | e0112eb, 27a3899, dd77e0f |
| T6 | S9 | DJ tools: tap tempo, microphone BPM, pitch calculator, mix finder, set flow, condition and storage | inline API, delegated UI | API done | 27a3899 |
| T7 | S3 | DESIGN.md, tokens and all screens | delegated with T4 | in progress | 9afa4ed foundation |
| T8 | S8 | Suggestions and docs | inline | pending | |

## Log

- L1 (2026-11-07), user request verbatim: "Quiero que revises este codigo, que busques malas practicas de next.js y react y las arregles a todas, usa todas mis skills, quiero que mejores el diseno usa, mis skills de diseno y anti ai slop, quiero que pongas los bpm que tiene cada track del vinilo y quiero que mejores todo el codigo y lo dejes profesional y perfecto. Tambien haz auditorias de seguridad y actualiza todos los packages, y sugiereme cosas para agregarle y agrega cosas que le servirian a las personas que tocan y son dj con vinilos"
- L2: Baseline. `tsc` clean; `next build` fails without a database because `sitemap.ts` queries Prisma at prerender; `bun audit` reports 34 vulnerabilities (2 critical, 14 high, 15 moderate, 3 low).
- L3: BPM sources measured. Discogs tracklist has no BPM (`position`, `type_`, `title`, `duration`). Deezer matched 8 of 8 sample DJ tracks and returned a BPM for 4 of 8 (`0` otherwise), no API key needed. Spotify audio features were removed in 2024. Decision: three inputs, each stored with its source: lookup (approximate), tap tempo, microphone.
- L4: T1/T2 verified: tsc clean in 6 packages, `next build` passes with Turbopack and no database, `bun audit` reports none. TypeScript held at 6.0.3 because typescript-eslint requires <6.1.0 (TS 7 crashes it). Native review of 7a55029 approved; the mechanical 7d617a6 (lockfile and generated removal) exceeds the review context budget by itself and was not reviewed.
- L5: T3 RED 28 of 32 tests failing against the old router, GREEN 32 of 32. `notes` stays public on public folders because the public page shows it deliberately; `mixNotes`, `pricePaid`, `barcode` and `userId` do not.
- L6: Native review of 2c3b8b2, 0ef0a9d, 5edda44, 9392b64 and f9a855b approved. 88a0098 exceeded the review context budget (3989 lines), so it was split into those five commits, each with passing types and tests. 7d617a6 (lockfile and generated removal) was confirmed to exceed the budget on its own and cannot usefully be split.
- L7: Independent audit recheck: 15 fixed, 6 partly fixed, none open, and it found a regression in my sign-up replacement hook. Replaced with a signed browser proof checked at email verification (f0606c1), tested through the real HTTP handler and OTP.
- L8: BPM detection measured on 42 real loops with known tempo from the user's sample packs: 38 correct, 2 refused, 2 wrong. Scoring subdivisions was tried and rejected: 38 correct, 3 refused, 1 wrong, but it broke 174 BPM.
- L9: Delivery note: three new schema changes (RateLimit table, track and vinyl columns, enums, FolderVinyl.trackId) need `bun run db:push` before deploying. Not run on any real database.
