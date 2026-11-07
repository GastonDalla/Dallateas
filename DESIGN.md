# DESIGN.md: Dallateas

Living design brief. Read order: tokens in code, then this file, then skill defaults.

## 1. Product truth

- **Users:** DJs who play vinyl. They use it on a phone in a record shop or next to the decks in a dim booth, and on a laptop when preparing a set at home.
- **Purpose:** know what every record holds and what mixes with what, on turntables, where there is no sync and no key lock.
- **Constraints:** Spanish (Argentina), voseo, correct accents and ñ. WCAG AA. Works on a phone with a thumb.
- **Success means:** landing: the visitor understands BPM per track and signs up. Collection: find a record in under 10 seconds. Set: see at a glance which change will hurt.
- **Real content available:** the user's own collection data, Discogs covers. Nothing invented: no fake users, counts or testimonials.

## 2. Design Read and surface types

Reading this as: a crate manager for vinyl DJs, a printed record-shop language of black vinyl, paper sleeves and fluo price stickers, on Next.js 16.

| Surface | Type | V | M | D |
| --- | --- | --- | --- | --- |
| Landing, tools | persuade | 8 | 6 | 4 |
| Public crates, DJ profile | showcase | 6 | 4 | 5 |
| Collection, sets, stats, admin | operate | 3 | 2 | 7 |
| Sign-in, settings | operate | 2 | 1 | 4 |

## 3. Visual direction and project bans

**Idea:** DJs write the BPM on the sleeve with a marker, or stick it on. Record shops price with fluo stickers. So the BPM sticker is the product's face: every cover in a crate wears one.

- The sticker means something: **filled** is a tempo measured on this record (tap, microphone, typed), **outlined with ≈** is a lookup, **no sticker** is unknown. Never decoration, and never a made-up number.
- Covers are the colour. Chrome stays neutral so the sleeves carry the screen.
- Square corners on everything that is paper: covers, sleeves, panels. A record sleeve has no radius.
- The pitch ruler (a fader scale from −8 to +8) is the one drawn element, used where a change has to be read: set flow and the pitch calculator.
- Condensed uppercase only for numbers and big statements. Sentence case everywhere else.

**Bans, on top of the skill catalogs:** cream grounds, rust or terracotta, Playfair, Inter, purple, gradients, glows, glass, icon-in-a-circle, three equal cards, eyebrows, uppercase tracked labels, emoji, pulsing elements, "Bienvenido".

## 4. Color tokens

```design-tokens
fonts: Barlow, Barlow Condensed, Doto
colors: #F4F4F2, #EBEBE8, #FFFFFF, #161615, #5E5E59, #FF5B14, #FFE8DC, #A83600, #2F7D54, #8A5A0B, #C4312B, #D9480F, #121211, #1A1A18, #232321, #F2F1ED, #A3A29B, #FF6A1F, #3A2013, #FFC5A8, #FF9463, #5CC48F, #E0A94A, #F0776F
radii: 0, 2px, 4px, 8px, 9999px
```

| Token | Light | Dark | Job |
| --- | --- | --- | --- |
| `--background` | #F4F4F2 sleeve paper | #121211 platter | page |
| `--card` | #FFFFFF | #1A1A18 | panels |
| `--foreground` | #161615 | #F2F1ED | text |
| `--muted-foreground` | #5E5E59 | #A3A29B | secondary text, AA on both grounds |
| `--primary` | #FF5B14 | #FF6A1F | the fluo: sticker, primary button, active mark. Small areas only |
| `--primary-foreground` | #161615 | #121211 | ink on the fluo |
| `--accent` | #FFE8DC | #3A2013 | pale tint for areas: active nav row, selected rows |
| `--accent-foreground` | #A83600 | #FFC5A8 | ink on the tint |
| `--link` | #A83600 | #FF9463 | the hue as text, AA on the ground |
| `--good`, `--warn`, `--clash` | #2F7D54, #8A5A0B, #C4312B | #5CC48F, #E0A94A, #F0776F | a transition that works, needs care, or will hurt. Meaning only |

The fluo is 2.8:1 on sleeve paper, fine as a fill under dark ink but too weak as a line, so charts use `--chart-1` (#D9480F on light).

## 5. Typography

- Display and figures: Barlow Condensed 600 and 700. Blunt like a ticket or a shop sticker.
- Text and interface: Barlow 400, 500, 600.
- Every number that lines up uses `tabular-nums`.
- Live readouts (a tempo being measured, the pitch, a beat time, a set ramp) use Doto with round dots, like a mixer or CDJ screen, through the `Readout` component at 28px or more. Its point is drawn as a cross, so `Readout` sets the point and the minus in Barlow. Never for prose, labels or stored data in lists.
- App scale: 13 / 14 / 16 / 20 / 28. Landing display runs up to about 6rem, at most 2 lines.

## 6. Spacing and layout

- 4px grid: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- App shell: labelled sidebar on the ground, one hairline, 240px. Phone: compact top bar and bottom nav.
- The document scrolls, never an inner panel, so the browser bar collapses and scroll position is restored.
- Sections on persuade surfaces differ from their neighbours and run 120 to 240px apart.

## 7. Components

- Radius by role: paper 0, sticker 2, controls 4, menus and dialogs 8, nothing else.
- Elevation: only menus, dialogs and toasts float. Panels separate by a tone step or one hairline.
- Buttons: primary is the fluo fill with dark ink, one per screen. Everything else is outline or text.
- Kit: base-ui primitives in `packages/ui`. Shared pieces live in `apps/web/src/components/dj`: `Cover`, `BpmSticker`, `KeyTag`, `PitchRuler`, and in `components/shell`.

## 8. Motion

- Color and opacity on hover, 120ms. Press scales to 0.98.
- One entrance per page, a short rise. Nothing loops except a real in-progress state.
- Easing `cubic-bezier(0.2, 0, 0, 1)`. Everything honours `prefers-reduced-motion`.

## 9. Imagery and content

- Imagery: real covers first. Without one, the plain sleeve with its die-cut hole, never a glowing disc.
- No stock or found photography. Where a picture is needed, draw the screen the product or the booth would show, computed from the numbers on the page: a waveform with its taps, the tempo curve the microphone finds, a lookup list, the Camelot wheel, a real QR.
- Voice: a DJ talking to a DJ. Short, specific, numbers over adjectives. "Mezcla", "pitch", "batea", "corte". No hype, no exclamation marks, no trailing periods on short strings.
- Never state a number nobody measured. "Sin BPM" is an honest answer.

## 10. Do / Don't

| Do | Don't |
| --- | --- |
| Show tempo and key on the cover | Hide them behind a click |
| Say where a tempo came from | Present a lookup as a measurement |
| Judge a mix on the key after pitching | Compare printed keys only |
| Keep a dash for missing data | Show 0 for unknown |

## 11. Decision log

- 2026-11-07: replaced the cream and brown palette with Playfair, which matched the slop catalog and said nothing about vinyl. The brand had no logo or documented palette to preserve.
- 2026-11-07: dealt direction `page-is-the-object`. Type redrawn from Young Serif and Source Serif to Barlow Condensed and Barlow, because the product is mostly numbers in dense tables. Palette kept the dealt proportions with the subject's colours: black vinyl and fluo sticker.
- 2026-11-07: the user asked for the found photographs (Openverse and Wikimedia, black and white) to go and for a more electronic feel. They became screens drawn in code from the page's own numbers, and Doto came in for live readouts.

## 12. References

Skills: `antiwebslop`, `unslop`, `design-taste-frontend` (app style: Accent ladder, Open plane shell).
