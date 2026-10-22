# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Capacitor 8 Android wrapper over a vanilla HTML/CSS/JS surface: no UI framework, no
build step for the interface, packaged by the repository's Gradle project and built
by GitHub Actions. Already fixed by the existing repository toolchain.

## Users

One owner: someone who sharpens their own knives and keeps a library of roughly
5–20. They open the app standing at the sharpener, phone in one hand and the knife
or sharpener in the other, often in dim or mixed light, after weeks away from the
app. Personal tool: no sharing, no second user, no account.

## Product Purpose

Remember the angle each knife was last sharpened at, with a photo and notes, so the
next sharpening can be set up identically instead of guessed. Success: a knife's
last angle is found in seconds, and logging a repeat sharpening takes one tap.

## Positioning

Built around recall at the bench rather than a diary or a collection. The last angle
is the primary object on every surface, and a repeat sharpening is logged from the
previous entry. A notes app can store the same numbers, but it cannot put the angle
one tap from the sharpener while the knife is in your hand.

## Operating Context

- Standing at the sharpener, one free hand; the phone is held, not propped.
- Dim or mixed light, where glare hurts.
- Occasional use: sessions can be weeks apart.
- Angles are quoted per side; the included angle (×2) is shown alongside because
  sharpeners label both ways.
- Everything lives on the phone; the safety net is a manual JSON backup shared
  through Android's share sheet.
- Sideloaded app; updates arrive as a new APK installed over the old build.

## Capabilities and Constraints

- Knife library: name required, optional photo and notes; search by name; recency
  ordering; 15–20 knives expected.
- One sharpening record: date, angle per side (1–45°), optional edge rating,
  optional burr-raised and stropped flags, optional notes.
- Every sharpening kept and editable, newest first; a sharpening deletes with Undo,
  a knife delete confirms with a count of what goes.
- One-tap repeat sharpening, pre-filled at the previous angle and dated today, still
  editable.
- Manual backup including photos; merge-based, idempotent restore; no cloud, no
  account, no analytics.
- One network call only: checking GitHub releases for a newer build.
- Android sideload only, package `com.joshrpr.edgenotes`; no Play Store, no iOS, no
  hosted web app.
- Delivered inside an Android WebView (Capacitor), so the design language is web,
  while Android behaviour still binds: system Back, edge-to-edge window insets, 48 dp
  touch targets, the share sheet and the system font scale.
- v1 out of scope: angle chart, categories or types, per-session photos, grit or
  method tracking, multi-user, cloud sync, CSV export, reminders.
- No product-specific accessibility requirement was established; platform defaults
  apply.

## Brand Commitments

- Name: **Edge Notes**; launcher label the same.
- Voice: plain and direct. Terse, factual labels ("Sharpened 17.5° · 3 weeks ago",
  "Angle saved"), no exclamation marks, no cheerleading.
- Pinned material: dark charcoal surfaces, brass accent reserved for angle values
  and the primary action, knife-glyph launcher icon on charcoal.
- No gamification, badges, streaks or mascots.

## Evidence on Hand

- `docs/requirements.md` holds the confirmed requirements, the decision log and the
  design craft items.
- No real knife photographs, usage data, testimonials or benchmarks exist yet. None
  may be invented; concept imagery uses synthetic sample knives labelled as such.

## Product Principles

1. Recall over analysis: the last angle is the hero number on every surface.
2. One hand, one thumb: reachable controls, no precision gestures.
3. Forgiving: everything editable, destructive actions guarded.
4. Private by default: no account, no analytics, data stays on the phone.
5. Plain speech: say the thing in the fewest words.
