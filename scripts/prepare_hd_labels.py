#!/usr/bin/env python3
"""Extract existing printed labels from the original site's larger photographs.

No generated lettering, sharpening, or upscaling: retain the source pixels.
Builds the HD runtime textures independently of the older turntable crops.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / 'art/bottle-labels/sources'
OUTPUT = ROOT / 'public/img/labels'

# Absolute source coordinates; these photographs have different framing.
CROPS = {
    'green-house': (1356, 2290, 2566, 5140),
    'golden-hour': (1167, 1301, 1817, 2845),
    'classic-beet': (1179, 1234, 1820, 2751),
}

# Trace the sticker edge, excluding the photographed juice around its corners.
# Four corners of each paper label, clockwise; the sides follow the source's
# slight perspective instead of including a dark rectangular bottle border.
EDGES = {
    'green-house': ((2, 0), (1208, 0), (1190, 2840), (8, 2840), 115),
    'golden-hour': ((0, 0), (631, 0), (606, 1507), (0, 1486), 72),
    'classic-beet': ((6, 0), (614, 5), (593, 1486), (0, 1470), 65),
}


def sticker_mask(size, outline):
    corners, radius = outline[:4], outline[4]
    points = []
    for index, corner in enumerate(corners):
        before, after = corners[index - 1], corners[(index + 1) % 4]
        def inset(neighbour):
            dx, dy = neighbour[0] - corner[0], neighbour[1] - corner[1]
            distance = (dx * dx + dy * dy) ** .5
            return corner[0] + dx * radius / distance, corner[1] + dy * radius / distance
        start, end = inset(before), inset(after)
        for step in range(33):
            t = step / 32
            points.append(tuple((1-t)**2 * start[i] + 2*(1-t)*t * corner[i] + t*t * end[i] for i in (0, 1)))
    mask = Image.new('L', size)
    ImageDraw.Draw(mask).polygon(points, fill=255)
    return mask

if __name__ == '__main__':
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for flavour, box in CROPS.items():
        with Image.open(SOURCES / f'{flavour}.png') as photo:
            label = photo.crop(box).convert('RGBA')
            label.putalpha(sticker_mask(label.size, EDGES[flavour]))
            label.save(OUTPUT / f'{flavour}-hd.webp', lossless=True, method=6)
            print(f'{flavour}: {label.width} × {label.height}')
