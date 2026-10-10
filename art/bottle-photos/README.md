# Bottle photographs

Taken from `A5 DESIGN.pdf` (the Vegan Valley A5 product sheets, Canva export, April 2026).
Each PNG is the photograph embedded in the PDF with its soft mask applied as alpha, at the
full embedded resolution (538 × 717, or 423 × 917 for Green House and The Weekend). Nothing is
upscaled or retouched.

`public/img/bottle-photos/*.webp` are the same pixels cropped to the bottle and saved as
lossless WebP. They are used by the product cards and product dialog on `/` and `/home-2/`.

Ingredients, health benefits and nutrition figures for all ten drinks are transcribed from the
same PDF into `src/data/juices.json`. After editing that file, run
`python3 scripts/build_product_cards.py` to regenerate the cards on both homepages.
