# Canvas frame sequences

Two canvas sequences live here. The animation code reads them purely by name — there is no
manifest — so replacing the art is a drop-in file swap.

**These files are generated. Do not edit them by hand.**

```
npm run frames        # labels, then turntable
```

which is these two steps:

| Step | Script | Reads | Writes |
|---|---|---|---|
| `npm run labels` | `scripts/extract_labels.py` | `art/bottles/*.png` | `art/labels/*.png`, `flavours.json` |
| `npm run turntable` | `scripts/render_turntable.py` | `tools/turntable.html` | `seq_0_*`, `seq_1_*`, `../bottles/*` |

## Contract

| Sequence | Files | Count | Used by |
|---|---|---|---|
| Scroll scrub | `seq_0_0.webp` … `seq_0_239.webp` | **240** | `src/modules/sequence.js` — the 720lvh sticky section |
| Hero idle | `seq_1_0.webp` … `seq_1_22.webp` | **23** | `src/modules/loadStage.js` — intro reveal + breathing loop |

Requirements, whether generated here or dropped in from a render:

- **Zero-indexed, contiguous.** A gap logs a warning and that frame renders as a hole.
- **Identical dimensions across a sequence.** Currently 1440×1440 (scroll) and 1466×1722
  (hero). The canvas fits by aspect ratio, so any consistent ratio works — but it must be
  consistent, or the product will jitter in scale as it scrubs.
- **Transparent background** (alpha WebP). The section background shows through.
- **The subject must not drift.** The canvas fits the frame box, so a subject that wanders
  within the frame will appear to swim.
- Counts are hardcoded in three places that must agree: `FRAME_COUNT` in each module, and
  `SCROLL_COUNT` / `HERO_COUNT` in `scripts/render_turntable.py`.

## Why the bottle is modelled and not photographed

The source photography is six flat front-on product shots, one per flavour. A turntable
cannot be recovered from that — there is no side or back of the bottle anywhere in the art,
and no amount of warping one photo invents them. Rotating a flat image reads as a card
flipping, not an object turning, because it has no thickness, no self-occlusion, and no
edge for light to catch.

So `tools/turntable.html` models the bottle instead: a rounded-square cross-section lofted
along a height profile, blending to a circular neck, with the real label artwork wrapped
around the front face by arc length. The juice colour and the cap colour are sampled from
the photographs, so what turns on screen is the actual product design even though the
geometry is synthetic.

The flavour changes are timed to half-turns. The label only exists on the front face, so it
is invisible when the bottle has its back to camera — every swap happens exactly then. You
never see one flavour dissolve into another; you see a bottle turn around and come back as
a different one.

## Replacing this with a real turntable shoot

Photography will always beat the model on juice, glass and light. If the bottles get shot
properly, this whole pipeline can be deleted:

- One bottle, one locked camera, one lighting setup, rotating through 360°.
- Any frame count works if `FRAME_COUNT` and `SCROLL_COUNT` are updated together —
  72 or 120 shot frames scrub perfectly well.
- Cut out to alpha, exported at a single consistent resolution, named `seq_0_<i>.webp`.
