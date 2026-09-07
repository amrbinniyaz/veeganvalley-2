# Vegan Valley botanical notebook artwork

Created with the built-in ImageGen tool, with one generation per asset. These
are original illustrations and paper texture; no artwork was copied from the
St Olave's reference website. Its pencil margins and layered paper informed the
design direction: https://www.stolaves.org.uk/

## Final website assets

- `public/img/botanical/cucumber-botanical.webp` — forest-green pencil study of
  cucumber vines and lemon, used behind the Green House bottle.
- `public/img/botanical/roots-botanical.webp` — beetroot and carrot pencil study,
  used for the Golden Hour and Classic Beet feature and beside Our Roots.
- `public/img/botanical/torn-paper-mask.webp` — photographed fibrous paper edge,
  used as an alpha mask coloured with the existing brand palette.

The WebP files are lossless encodings of the generated PNGs. Dimensions, RGBA
pixels and transparency were verified unchanged. The paper's partial interior
alpha is supplemented by a CSS gradient mask so section interiors remain solid.

## Exact generation prompts

The full prompt set and original generated PNG paths are saved in
[`prompts.json`](./prompts.json). The built-in tool was used, not the CLI fallback.

## Integration

`src/styles/botanical.css` contains the decorative layer. It adds faint paper
grain, notebook-style ingredient details, handwritten notes, a paper mount for
the existing process film, and three torn section boundaries. The existing
palette and headline layout are retained. Illustrations are decorative and
hidden from assistive technology. Flavour changes update the hero illustration;
motion is disabled when the visitor requests reduced motion.
