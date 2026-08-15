# Canvas frame sequences

Two canvas sequences live here. The animation code reads them purely by name — there is no
manifest — so replacing the art is a drop-in file swap.

**These files are generated. Do not edit them by hand.** The source art is `art/bottles/`
and the generator is `scripts/build_frames.py`:

```
npm run frames        # python3 scripts/build_frames.py
```

## Contract

| Sequence | Files | Count | Used by |
|---|---|---|---|
| Scroll scrub | `seq_0_0.webp` … `seq_0_199.webp` | **200** | `src/modules/sequence.js` — the 720lvh sticky section |
| Hero idle | `seq_1_0.webp` … `seq_1_22.webp` | **23** | `src/modules/loadStage.js` — intro reveal + breathing loop |

Requirements, whether generated or dropped in from a render:

- **Zero-indexed, contiguous.** A gap logs a warning and that frame renders as a hole.
- **Identical dimensions across a sequence.** Currently 1920×1920 (scroll) and 1466×1722
  (hero). The canvas fits by aspect ratio, so any consistent ratio works — but it must be
  consistent, or the product will jitter in scale as it scrubs.
- **Transparent background** (alpha WebP). The section background shows through.
- **The subject must not drift.** The canvas fits the frame box, so a subject that wanders
  within the frame will appear to swim.
- Counts are hardcoded (`FRAME_COUNT` in each module, mirrored by `SCROLL`/`HERO` in the
  generator). Changing a count means changing it in both places.

## What the current frames show

Not a rotating bottle. The reference build this motion system was studied from
(`morematcha.vercel.app`) scrubbed 200 renders of one bottle on a turntable. Our source is
six flat front-on product shots, one per flavour — there is no side or back of the bottle
in that art, so a rotation cannot be recovered from it.

Instead the scroll scrub morphs **through the product line**: the bottle holds its position
while the juice and label crossfade Classic Beet → Morning Sunshine → Golden Hour → Green
House → The Hydrator → Charcoal Lemonade. The six shots came off one locked camera (subject
bounding boxes agree within ~20px), so they register on top of each other and the crossfade
reads as one bottle changing flavour. A slow ±3° rock is baked in so a held flavour still
looks like a live object between transitions.

The hero sequence is a single flavour (Green House) with a ±2.5° sway, because it plays as a
timed idle loop rather than a scroll scrub — morphing there would read as a glitch.

## Replacing this with a real turntable

If the bottles are ever shot properly on a turntable, this becomes a straight file swap and
`scripts/build_frames.py` can be deleted:

- One bottle, one locked camera, one lighting setup, rotating through 360°.
- 200 frames is the current constant, but any count works if `FRAME_COUNT` is updated —
  72 or 120 shot frames scrub perfectly well.
- Cut out to alpha, exported at a single consistent square resolution.
