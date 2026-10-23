# Kuro-uchi knife — image prompt

For ChatGPT or Gemini. Generate one **master still** of the knife, then crop it for
the page. Do not generate a separate image per screen; the knife must be the same
object everywhere.

The hero slot on the knife page is a wide band, roughly 4.2:1. Generate landscape,
16:9 if the tool allows it, otherwise 3:2, with the whole knife in frame and empty
space above and below so there is room to crop.

---

## Master prompt

```text
A photorealistic editorial product photograph of one Japanese chef's knife, a 210 mm gyuto, lying flat on a matte black slate surface, handle at the left, tip at the right. Overhead three-quarter view: the camera about 65 degrees above the surface, looking down at the full flat of the blade so the complete profile, the spine and the bevel are readable. The complete knife is in frame, centered, with generous empty space above and below it. Landscape orientation, 16:9 if possible, otherwise 3:2.

The knife is a dark-forged kurouchi gyuto. The blade is 210 mm long and 47 mm tall at the heel; the spine is 2.5 mm at the heel tapering to 1.5 mm at the tip. Straight spine, shallow belly, centered needle-sharp tip, one continuous edge, no serrations. The upper flat of the blade is matte black forge scale with a faint hammered texture. Below it is a soft grey kasumi bevel, and along the very edge a thin bright honed silver line, about 1 mm wide. No damascus pattern, no engraved logos, no kanji, no numbers, no text.

The handle is a slender Japanese wa handle about 130 mm long, roughly 60 percent of the blade length, and no taller than half the blade's height at the heel, about 22 mm at the ferrule tapering to 20 mm at the butt. Pale ho (magnolia) wood with a fine straight grain and a warm honey tone. A black buffalo-horn ferrule about 25 mm long, flush with the wood and no wider than it, with a small 2 mm machi gap where it meets the blade. Softly chamfered facets and a gently rounded butt. It must read as finely made and slim, never chunky or bulbous: no rivets, no metal collar, no wrapping, no pins, no swell.

Setting: a matte black slate surface filling the frame, seamless and nearly uniform #080B0C at the edges, with one soft grounded contact shadow directly beneath the knife. A narrow warm key light from the upper left rakes across the blade and handle; a cool silver rim light traces the spine and the top facet of the handle; the honed edge catches a single thin highlight. Restrained high-end catalogue lighting: deep blacks, no HDR glow, no visible softbox reflections.

Camera and finish: 100 mm macro lens, f/11, focus stacked, crisp micro-detail in the wood grain and the forge texture, natural color, photorealistic. Not an illustration, not a 3D render, no cartoon shading.

Only this one knife. No hands, no cutting board, no food, no props, no sheath, no stand, no second blade, no watermark, no border, no text anywhere.
```

## If the handle still reads chunky

Append this to the next attempt:

```text
Keep the same knife and lighting, but make the handle visibly slimmer. Its height at the ferrule must be less than half the blade's height at the heel, and its length about 60 percent of the blade. The ferrule is flush and exactly as thick as the wood. Do not shorten the handle or make it taller.
```

## Retry after the first Gemini still

The first still placed the knife well but missed the object: a short, fat handle
with a polished chrome ferrule, a santoku-like tip, a stepped notch at the heel,
and a CGI sheen. Append this:

```text
Keep the composition, framing and lighting, but correct the knife itself. The ferrule must be matte black buffalo horn, never polished chrome or silver metal, flush with the wood and no wider than it. The handle is slim and clearly tapered, longer than the ferrule, with flat octagonal facets and a rounded butt; it is not a fat cylinder. The blade is a gyuto: a straight spine, a gentle belly, a centered tip that curves gently to a point, and a clean heel where the edge runs into the handle with no notch, step or cutout. One bevel line only. The finish is photographic, with real surface imperfections and natural lens falloff, not a glossy 3D render.
```

## Optional: house-style illustration

If you would rather keep the etched, brass-and-ink look of the page instead of a
photo, this variant produces a flat still. I would use it as a reference to redraw
the SVG, not ship the raster, because the app's angle etch and specular sweep need
to stay live.

```text
A precise editorial illustration of the same 210 mm kurouchi gyuto, same proportions and same side-on composition, for a dark app interface. Flat screen-printed look with a limited palette: near-black, steel grey, bone white and one brass accent. Fine one-pixel-style contours, subtle engraving texture in the shadow, the forge finish as a deep charcoal field, the kasumi bevel in pale grey, the honed edge as one thin bright line. The handle is warm pale wood with a slim black horn ferrule, faceted and clearly tapered. Seamless #080B0C background. No text, no logos, no glow, no gradients that fight the interface. Landscape 16:9.
```

---

## What to check before keeping a result

- The handle is **no taller than half the blade** at the heel, and about 60% of the
  blade's length. This is the proportion that made the drawn handle look chunky.
- The ferrule is flush and not wider than the wood, with a small machi gap. It
  is black horn, not a chrome band.
- The spine is straight and the tip is a gentle curve centered on the spine, not a
  tall santoku tip; one clean bevel line, not two.
- The edge runs cleanly into the heel with no notch, step or cutout.
- The edge is a thin bright line, not a thick white stripe.
- The backdrop is flat and near-black all the way to the edges, with no props or
  hard shadow. That lets it sit on the page without a cutout.

Generate four, pick the one with the cleanest ferrule and spine. Fix the rest by
regenerating, not by editing the knife shape afterwards.

## Hand-off

- Download the full-size PNG from the app (not the compressed chat preview).
- Save it as `prototypes/overdrive/art/knife-hero.png`.
- Do **not** bake the angle into the image. The `21°` etch is live app data and is
  drawn over the top.
- Send it back and I will crop the band, match the page black, add a soft radial
  falloff so no cutout is needed, and keep the brass angle and gauge as UI.
