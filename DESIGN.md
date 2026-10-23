# Edge Notes — Design System

**Honyaki.** A hand-forged blade at night: brushed sumi steel, a hamon temper line,
brass for the measurement, one vermilion chop for a record. Built from the shipped
interface on 2026-10-22. The reasoning and the surface brief live in
`docs/design-brief.md`; this file is the implementation reference.

## Material

- **Ground:** near-black steel `#090D10` with a low workshop-lamp falloff from the
  top. Never a flat black.
- **Plates:** a brushed-steel surface drawn once by `brushSteel()` in `web/js/app.js`
  (irregular 1 px hairlines, one shared data URL on `--brushed`), over a cool linear
  gradient. No repeating-gradient stripes.
- **Hairlines:** `#243138` on ground, `#35464E` when a line must carry weight.
- **Radii:** 2 px on plates and fields, 1 px on the chop and thumbnails. Pills only
  for the small burr/stropped chips.
- **Elevation:** a plate declares either a hairline border or a soft shadow, never a
  wide shadow under a 1 px border.

## Colour roles

| Token | Value | Use |
|---|---|---|
| `--ground` | `#090D10` | page |
| `--surface` | `#121A1F` | steel plate |
| `--surface-hi` | `#182227` | hover/raised |
| `--sunken` | `#0B1114` | inputs, search |
| `--line` | `#243138` | dividers |
| `--line-hi` | `#35464E` | strong borders |
| `--text` | `#E9EFF2` | primary |
| `--muted` | `#9BA9B0` | meta, body secondary |
| `--quiet` | `#7E8D94` | labels, counts |
| `--brass` | `#D8A34A` | every angle, the one primary action |
| `--brass-hi` | `#F2C776` | pressed primary |
| `--steel` | `#C9D5DB` | hamon, wedge arms |
| `--seal` | `#B23A2E` | a recorded sharpening only |
| `--error` | `#F07B62` | errors, destructive action |

Brass is a role, not an accent: if an element is not an angle or the primary action,
it is not brass. Vermilion is a record: the bench seal, the knife-band seal and the
chop pressed into a saved history row. It never marks a control.

## Type

- **Display:** Shippori Mincho, weights 500/600, Latin subset bundled in
  `web/fonts/` (OFL, `web/fonts/OFL.txt`). Used for knife names, screen titles and
  every angle. It supplies the blade's voice: sharp serifs, high contrast, a little
  formality.
- **UI:** Roboto / system sans for all copy that must be scanned at the bench:
  meta, labels, body, fields, buttons, ratings.
- **Numeric display:** the angle is the only number allowed to be this large. It
  does not count up; it is a reading, not a score.
- **Labels:** 10.5 px, 600, tracked .16 em, uppercase, `--quiet`.
- **Measure:** notes and dialog copy stay under ~48 characters on phone.

## The true-angle wedge

`wedgeSvg(perSide, opts)` draws a blade cross-section from the angle itself.

- The apex sits at x = 9; the bevels run 88 units to the right and open ±θ, so the
  included angle is exactly 2θ.
- The viewBox height is computed from θ (`2 × 88 tan θ + padding`), and the rendered
  box is fixed at 92 × 78 (94 × 82 on the knife page). Small angles render long and
  shallow; 45° renders tall and narrow. The shape is never faked.
- Arms are 1.2 px steel; the lower arm is brass, the cutting edge; a 1 px brass arc
  and a dashed centreline complete the instrument; a brass point marks the edge.
- The fill is a single steel gradient (`#steel-fill` in `web/index.html`), shared by
  the knife glyph.
- Pass `{ gauge: 'read' | 'first' | 'travel' }` to withhold the drawing until the
  blade pass lands; `afterArrival` adds `is-drawn`. Pass `{ live: true }` in the log
  sheet; the SVG is replaced as the value changes, with the included angle beside it.
- The aria-label always carries both "per side" and "included".

## Components

- **Masthead:** sticky steel band, 58 px + safe inset, EN mark in a brass ring,
  title in Mincho 23, and the hamon SVG at the bottom edge. The hamon draws once on
  arrival and is 15 px tall; the search sticks below it at 73 px + inset.
- **Search:** 48 px inset well, 1 px strong border, magnifier at 18 px, placeholder
  `--quiet`-adjacent, one 2 px brass focus ring on the field's own edge.
- **Bench plate:** the most recent knife, 1 px steel border and a top highlight. Label
  "Last on the bench", 20 px vermilion seal top-right, name in Mincho 25, 54 px angle
  and the live wedge. A diagonal glint runs on press; it is the only hover/press
  treatment on the plate.
- **Library row:** 54 px thumbnail in a steel frame, Mincho 17 name, 12.5 meta,
  29 px brass angle and 11 px recency. A translucent top-light appears on press.
- **Last-sharpened certificate:** full-bleed steel band on the knife page. 66 px
  angle with a 38 px degree and a 10 px "per side" label; wedge at 94 × 82; a single
  1 px brass rule at the bottom. The glint crosses it once after the cut.
- **History row:** 62 px, sans date, 25 px Mincho angle. On a save, a 21 px vermilion
  chop presses in before the angle and a brass rule draws under the row, then settles
  to the hairline.
- **Measure well:** the log sheet's angle field (116 px, sunken) plus the live wedge
  and the included caption; the only place where the instrument is edited.
- **Buttons:** steel plate default; brass primary with a dark ink label and a top
  highlight; danger as an outline in `--error`. Minimum 52 px; focus ring 2 px brass.
- **Dialog / toast:** steel plate or raised bar, Mincho title, 1 px brass left rule on
  the snackbar (never thicker), one action at most.

## Motion

- Route pass: 400 ms blade clip + a 2 px steel rim; the outgoing page never moves.
- Hamon: 950 ms stroke-draw from the left.
- Wedge: arms, arc and fill draw in over ~560 ms after the pass, from the edge out.
- Specular pass: one 900 ms diagonal light over the certificate on arrival.
- Chop: 260 ms press (scale 1.5 → 1, opacity 0 → 1) at 120 ms, with a 1.2 s warm wash
  and a 320 ms brass rule; the rule settles over 720 ms.
- Press: 120 ms scale/glint; no ambient looping animation.
- Reduced motion: all of the above collapse to the final state; the blade pass is
  skipped by `supportsPass()` and the CSS.

## Copy

Plain, terse, factual. "Last on the bench", "Last sharpened", "Sharpened 3 times",
"35° included", "No angle yet", "Find a knife". No exclamation marks, no praise, no
joke copy. Errors name the problem and the next step.

## Guardrails

- No kanji used as decoration; the Japanese reference is metallurgy, Mincho and the
  chop.
- No faux wood, bamboo, blossoms, rising sun or lantern emoji.
- No dial, slider or chart for the angle; the wedge is a static-to-live readout and
  the input stays a keyboard field.
- Photos are framed in steel; never invent knife photography.
- The system serves one owner, one hand, one dim bench. If a flourish costs the angle
  a second of legibility, it goes.
