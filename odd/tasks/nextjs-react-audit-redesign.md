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
| T1 | S5, S7 | Repo hygiene: tracked lockfile, untrack generated client, lint, test and type-check scripts | inline | pending | |
| T2 | S6, S7 | Update every package, replace next-pwa with a hand-written service worker, `bun audit` clean | inline | pending | |
| T3 | S5, S6 | Split the god router, add `adminProcedure`, fix authorization, data leaks, XSS, password handling, rate limits, headers | inline | pending | |
| T4 | S1 | Server Components and prefetch for public pages, per-request QueryClient, next/image, typed routes, metadata | pending route | pending | |
| T5 | S4 | Per-track BPM and key: schema, API, form, display, lookup with source | inline | pending | |
| T6 | S9 | DJ tools: tap tempo, microphone BPM, pitch calculator, mix finder, set flow, condition and storage | pending route | pending | |
| T7 | S3 | DESIGN.md, tokens and all screens | pending route | pending | |
| T8 | S8 | Suggestions and docs | inline | pending | |

## Log

- L1 (2026-11-07), user request verbatim: "Quiero que revises este codigo, que busques malas practicas de next.js y react y las arregles a todas, usa todas mis skills, quiero que mejores el diseno usa, mis skills de diseno y anti ai slop, quiero que pongas los bpm que tiene cada track del vinilo y quiero que mejores todo el codigo y lo dejes profesional y perfecto. Tambien haz auditorias de seguridad y actualiza todos los packages, y sugiereme cosas para agregarle y agrega cosas que le servirian a las personas que tocan y son dj con vinilos"
- L2: Baseline. `tsc` clean; `next build` fails without a database because `sitemap.ts` queries Prisma at prerender; `bun audit` reports 34 vulnerabilities (2 critical, 14 high, 15 moderate, 3 low).
- L3: BPM sources measured. Discogs tracklist has no BPM (`position`, `type_`, `title`, `duration`). Deezer matched 8 of 8 sample DJ tracks and returned a BPM for 4 of 8 (`0` otherwise), no API key needed. Spotify audio features were removed in 2024. Decision: three inputs, each stored with its source: lookup (approximate), tap tempo, microphone.
