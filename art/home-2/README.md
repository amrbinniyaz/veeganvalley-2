# Homepage 2

Preview: `/home-2/`. The original homepage remains at `/`.

Design reference: https://www.era-residence.com/ — studied the live arch reveal, layered image movement, restrained typography and generous spacing. No reference-site assets or code were copied. The new composition, brand copy and implementation are original to this project.

## Landscape

Final website asset: `public/img/home-2/valley.webp` (1536 × 1024, approximately 404 KiB).

Generated using the built-in image generation tool. This is illustrative brand artwork, not a documentary photograph of a specific supplier or farm. The original PNG is preserved at `/Users/macbookpro/.codex/generated_images/01a07bf8-66c9-7d03-9f67-b801a9601115/exec-3f1bb0e5-ca8c-4dfa-abb2-e382cfe4c04d.png`. Converted to WebP for delivery. Existing Vegan Valley bottle, botanical and meal imagery is reused from the project.

### Generation prompt

Use case: photorealistic-natural. Asset type: immersive landscape photograph for Vegan Valley's new website arch scroll reveal. Create an original premium editorial photograph of a lush vegetable farm in a softly rolling green valley at early morning. Eye-level viewpoint looking down a narrow earthy path between leafy vegetable beds, a small orchard at the edges, mist-softened wooded hills in the distance. Natural imperfect leaves, rich soil, quiet real-world detail. Muted sage greens, forest greens, warm ivory morning light, restrained earthy colour, analog medium format photographic finish. Wide landscape composition, approximately 3:2, at least 2048px wide. The central third must also compose beautifully as a tall arched crop: path leads the eye to trees and hazy hills, sky takes only the upper quarter. No buildings, no people, no bottle, no logo, no text, no watermark, no artificial arch frame, no saturated neon greens. Atmospheric and serene, believable farming landscape, not a fantasy illustration.

## Implementation

Homepage 2 reuses the original homepage markup and `src/main.js`, preserving its logo loader, 3D bottle scene, flavour changes, rectangular product cards and all following content. Only the arch interlude is added, directly after the cold-pressed / all-plants ticker. The original `/` page is unchanged.

The added arch uses a native CSS sticky section and its own GSAP ScrollTrigger timeline. It shares the original homepage’s Lenis instance. All additional CSS is scoped to `valley-arch` classes. Reduced-motion users get a static arch. The original responsive and large-display limits continue to apply.
