# Farm-to-bottle journey

The separate `/farm-to-bottle/` page is a four-chapter horizontal story. The home
page remains independent. Both routes ship in the Vite production build.

## Current artwork

The quieter September revision uses three original transparent assets:

- `public/img/journey/farm-layers-atlas.webp` — 1536 × 1024, separate distant
  hillside and apple tree sprites.
- `public/img/journey/harvest-clean.webp` — 1254 × 1254, a small produce crate.
- `public/img/journey/press-clean.webp` — 1208 × 1302, an isolated conceptual
  juice press and pitcher.

These are lossless WebP encodings of built-in ImageGen PNGs. Decoded RGBA pixels
were compared and verified unchanged. Exact generation prompts are recorded in
[`clean/prompts.json`](./clean/prompts.json). No CLI fallback or generation retries
were used. The resulting art was more saturated than the brief, so the page
presentation uses low saturation and reduced opacity to keep the colour soft.

The atlas does not follow its requested crop coordinates exactly. CSS windows
use `(0, 120, 1536, 220)` for the hills and `(470, 390, 600, 600)` for the tree,
retaining the full canopy. Hills, foreground art, and the single handwritten
annotation each move independently. No baked full-scene background is used.

The existing botanical torn-paper alpha mask forms the vertical paper edge on
desktop and the lower paper edge on mobile. Heavy page grain, ingredient stamps,
decorative tickets, and large overlapping plant arrangements were removed.

These are illustrative scenes, not documentary images of a specific supplier
or facility. Earlier artwork and its prompts remain available in this directory
and `public/img/journey/`, but are no longer used on the page.

## Navigation and motion

`farm-to-bottle/index.html` supplies the four chapters and native anchor links.
`src/styles/farm-to-bottle.css` creates the horizontal overflow surface, paper
panels, separate sprite windows, and responsive layouts. Small screens retain
horizontal navigation; a chapter can scroll vertically if text needs more space.

`src/farm-to-bottle.js` uses the installed Lenis horizontal wrapper. Both wheel
axes move horizontally, and touch swiping remains native. Previous/next arrows,
chapter links, ArrowLeft/ArrowRight, Home/End, deep links, and replay navigate to
whole chapters. Resize preserves the current destination. The active chapter
and arrow states update while scrolling in either direction.

`src/lib/journeyTiming.js` contains viewport-based chapter positions and bounded
parallax offsets. Reduced motion disables parallax and animated scrolling while
retaining all navigation. The shared 3D bottle loads near the finale; its product
photograph remains available if WebGL fails or reduced motion is preferred.

The vegan and no-added-sugar messages follow the brand brief. The page also
states that juices contain naturally occurring sugars.
