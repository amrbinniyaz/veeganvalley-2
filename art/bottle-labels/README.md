# Higher-resolution bottle labels

Source photographs supplied through the user's original website, retrieved on
8 September 2026. These are existing brand photographs, not generated artwork.

| Flavour | Original asset | Source size | Label size |
| --- | --- | --- | --- |
| Green House | http://www.veganvalley.in/assets/images/green%20house%20png.png | 4000 × 6000 | 1210 × 2850 |
| Golden Hour | http://www.veganvalley.in/assets/images/Group%20215.png | 2560 × 3411 | 650 × 1544 |
| Classic Beet | http://www.veganvalley.in/assets/images/Group%20210.png | 2545 × 3372 | 641 × 1517 |

Run `python3 scripts/prepare_hd_labels.py` to extract the printed labels into
`public/img/labels/*-hd.webp`. Crops retain their original pixels and use lossless
WebP compression. An alpha mask follows the sticker edge to remove the surrounding
photographed bottle. Typography, ingredients, colours and printed claims are taken
directly from the original labels; nothing is redrawn or upscaled.

The shared bottle renderer uses these textures on both homepages and the
illustrated journey. The 3D farm world also uses the new Green House texture.
The lower-resolution PNGs are retained for older rendering/export tools.
