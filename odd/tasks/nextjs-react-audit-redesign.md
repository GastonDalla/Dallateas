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
| T4 | S1 | Server Components and prefetch for public pages, per-request QueryClient, next/image, typed routes, metadata | delegated, 4 parallel screen units | done | 9afa4ed, 066aea1, then the 23 UI commits ending ca734b8 |
| T5 | S4 | Per-track BPM and key: schema, API, form, display, lookup with source | inline API, delegated UI | done | e0112eb, 27a3899, ad88b32, 00f90a1, 088708a, 87f4c3c, UI commits |
| T6 | S9 | DJ tools: tap tempo, microphone BPM, pitch calculator, mix finder, set flow, condition and storage | inline API, delegated UI | done | 27a3899, dd77e0f, cadf0da, UI commits |
| T7 | S3 | DESIGN.md, tokens and all screens | delegated with T4 | done | 9afa4ed, UI commits |
| T8 | S8 | Suggestions and docs | inline | done | e6da437, final report |

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
- L10: Four screen writers ran in parallel with disjoint surfaces. The collection writer hung on the shared Chrome DevTools browser after 05:25 and was stopped at 06:38; its code was complete and was verified directly. The disk was nearly full (117 MiB free) because of data outside this work; writer scratch was removed, 3.9 GiB free afterwards.
- L11: Found in the browser and fixed: hydration errors on every prefetched screen, because pending queries were dehydrated while components read them with useQuery. Prefetch is now awaited. Root `loading.tsx` made missing pages answer 200; removing it restored real 404s.
- L12: End-to-end flows checked in a real browser against a seeded database: password sign-in, editing a record (track BPM, source, key, energy and cue notes survive), manual BPM with key "Am" stored as 8A and MANUAL, DJ profile save, choosing a cut in a set, a real Deezer lookup that honestly reports nothing found. No console errors other than Vercel Analytics, which only exists on Vercel.
- L13: Totals at the end: 358 tests pass, ESLint 0 problems (166 at the start), `tsc` clean in every package, `bun audit` none (34 at the start). UI work landed as 23 commits sized for review, each type-checked on its own tree.
- L14: Two native reviews ended `corrupted_or_unverifiable_authority` (e3 and u5). Both had two lenses captured concurrently, with the first lens closing the transaction as correction_required before the second was admitted. The findings were read from the transaction state and handled: e3's in 088708a and 87f4c3c, u5's scanner finding in e1c1a97 (false positive in context, hardened anyway).
- L15: Packages: everything is on its latest stable version except three, by evidence. TypeScript stays on 6.0.3 because typescript-eslint requires <6.1 and crashes on 7. Prisma stays on 7.10.1 because 8 exists only as release candidates. @types/node stays on 24 to match the runtime: Vercel documents Node 24 as its default and does not list 26. ESLint moved to 10 (b321b2c, reviewed).
- L16: Microphone and scanner verified end to end in a browser. Headless Chrome on this Mac cannot capture audio or video even with fake devices and granted permissions, so getUserMedia was replaced in the page by a Web Audio kick at 125 BPM and by a canvas showing an EAN-13. The record dialog detected 125, asked for confirmation and stored 125 as MIC. The scanner read 7791234567898, closed itself and applied the barcode filter once.
- L17: Reviews: every commit is approved except 7d617a6. Its bun.lock alone (1,650 lines) exceeds the reviewer's context budget, measured in an isolated commit, and a lockfile cannot be split. It was verified instead by a clean clone: `bun install --frozen-lockfile` succeeds, the postinstall regenerates the Prisma client, and `bun run check-types` passes. The record form commit was approved on a fresh review (review-934463fad08f9788) after the first one stopped on a finding the reviewer could not see the context for.
