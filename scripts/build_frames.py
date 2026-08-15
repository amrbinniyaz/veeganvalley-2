#!/usr/bin/env python3
"""
Build the two canvas frame sequences from the product photography in art/bottles/.

    npm run frames          # python3 scripts/build_frames.py

Writes public/img/seq/seq_0_*.webp (200) and seq_1_*.webp (23). The naming and
counts are the contract the animation code reads — see public/img/seq/README.md.
Nothing in src/ needs to change when this is re-run.

WHAT THE SCROLL SEQUENCE DOES
-----------------------------
The reference build scrubbed 200 renders of one bottle on a turntable. Our source
is six flat front-on shots, one per flavour, so a real turntable is not
recoverable from it — there is no back of the bottle in that art.

What *is* recoverable is a turn between flavours. Each bottle is treated as a
flat plane and rotated about its vertical axis with a proper perspective divide.
The outgoing flavour turns away until it is edge-on, and the incoming one arrives
through the second half of the same 180° sweep. Only the front face is ever
facing camera, so nothing has to be invented, and because nothing is regenerated
the label stays pixel-exact — which is the whole reason this is done
geometrically rather than with generative video.
"""
import math
import sys
from pathlib import Path

try:
    import numpy as np
    from PIL import Image
except ImportError as exc:
    sys.exit(f"missing dependency ({exc.name}):  python3 -m pip install Pillow numpy")

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "art" / "bottles"
OUT = ROOT / "public" / "img" / "seq"
BOTTLES = ROOT / "public" / "img" / "bottles"

# Ordered as a colour journey rather than alphabetically: the scrub sweeps warm
# to cool to dark, so consecutive turns are short hops around the wheel and never
# a jarring jump (e.g. charcoal straight into morning sunshine).
FLAVOURS = [
    "classic-beet",
    "morning-sunshine",
    "golden-hour",
    "green-house",
    "hydrator",
    "charcoal",
]

# --- Output contract ------------------------------------------------------
# Canvas sizes match the placeholder sequences they replace, so the existing CSS
# and `fit` modes frame the product exactly as they were tuned to.
SCROLL = dict(count=200, size=(1920, 1920), fill_h=0.55)
HERO = dict(count=23, size=(1466, 1722), fill_h=0.95)

# The hero is a single flavour — the flagship — because it plays as a timed idle
# loop, not a scroll scrub. Turning through flavours there would read as a glitch.
HERO_FLAVOUR = "green-house"

# Distance from eye to the bottle's axis, in units of the bottle's own width.
# Lower is more dramatic. 3.2 gives a visible near/far difference without the
# caricatured wide-angle look.
FOCAL = 3.2

HOLD = 0.42        # fraction of each segment the flavour sits still, facing us
SIDE_DARK = 0.55   # how far the face darkens as it turns edge-on
ROCK_DEG = 1.5     # idle sway during the hold, so a held flavour is not frozen
HERO_ROCK_DEG = 4.0


def load_aligned():
    """Crop every flavour to one shared bounding box so they register exactly.

    Cropping each to its *own* subject box would silently rescale each bottle to
    a slightly different size, and the sequence would pulse as it turned.
    """
    images = {}
    for name in FLAVOURS:
        path = SRC / f"{name}.png"
        if not path.exists():
            sys.exit(f"missing source art: {path}")
        images[name] = Image.open(path).convert("RGBA")

    sizes = {im.size for im in images.values()}
    if len(sizes) != 1:
        sys.exit(f"source images must share one resolution, got {sizes}")

    boxes = [im.getchannel("A").getbbox() for im in images.values()]
    union = (
        min(b[0] for b in boxes),
        min(b[1] for b in boxes),
        max(b[2] for b in boxes),
        max(b[3] for b in boxes),
    )
    return {name: im.crop(union) for name, im in images.items()}, union


def scaled(images, spec):
    """Resize the aligned crops to their on-canvas size, once, up front."""
    cw, ch = spec["size"]
    sw, sh = next(iter(images.values())).size
    target_h = round(ch * spec["fill_h"])
    target_w = round(target_h * sw / sh)
    return {n: im.resize((target_w, target_h), Image.LANCZOS) for n, im in images.items()}


def homography(dst, src):
    """Coefficients for PIL's PERSPECTIVE transform, which samples output -> input."""
    rows, rhs = [], []
    for (dx, dy), (sx, sy) in zip(dst, src):
        rows.append([dx, dy, 1, 0, 0, 0, -sx * dx, -sx * dy])
        rhs.append(sx)
        rows.append([0, 0, 0, dx, dy, 1, -sy * dx, -sy * dy])
        rhs.append(sy)
    return np.linalg.solve(np.array(rows, dtype=float), np.array(rhs, dtype=float))


def project(image, theta):
    """Render the flat bottle as a plane rotated `theta` radians about its vertical axis.

    A plain horizontal squash would also collapse the bottle, but it would keep
    both vertical edges the same height and the turn would read as a folding
    sheet of paper. Dividing each edge by its own depth is what makes the near
    edge tall and the far edge short, which is what sells it as a solid object.
    """
    w, h = image.size
    half = w / 2.0
    f = FOCAL * w

    edges = []
    for sx in (-half, half):
        x = sx * math.cos(theta)
        z = sx * math.sin(theta)
        s = f / (f + z)                     # perspective divide for this edge
        edges.append((x * s, s))

    (lx, ls), (rx, rs) = edges
    width = abs(rx - lx)
    if width < 2:
        return None                          # dead edge-on: nothing to draw

    pad = 4
    minx = min(lx, rx) - pad
    box = (int(math.ceil(width)) + pad * 2, h + pad * 2)

    top = lambda s: (h / 2.0) * (1 - s) + pad
    bot = lambda s: (h / 2.0) * (1 + s) + pad
    dst = [
        (lx - minx, top(ls)), (rx - minx, top(rs)),
        (rx - minx, bot(rs)), (lx - minx, bot(ls)),
    ]
    src = [(0, 0), (w, 0), (w, h), (0, h)]

    warped = image.transform(box, Image.PERSPECTIVE, homography(dst, src), Image.BICUBIC)

    # Darken as the face turns away, so the turn is felt and not merely seen.
    shade = abs(math.cos(theta)) ** 0.45
    k = 1.0 - SIDE_DARK * (1.0 - shade)
    lut = [int(min(255, v * k)) for v in range(256)]
    r, g, b, a = warped.split()
    return Image.merge("RGBA", (r.point(lut), g.point(lut), b.point(lut), a))


def ease(t):
    return t * t * (3.0 - 2.0 * t)


def compose(subject, spec):
    cw, ch = spec["size"]
    canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    if subject is not None:
        canvas.alpha_composite(
            subject, ((cw - subject.width) // 2, (ch - subject.height) // 2)
        )
    return canvas


def write(canvas, path):
    # method=4 rather than 6: 6 costs ~20x the encode time across 223 frames and
    # buys about 5% in file size. exact=True keeps the RGB of fully transparent
    # pixels intact so the edge does not fringe when the canvas scales it.
    canvas.save(path, "WEBP", quality=88, method=4, exact=True)


def build_scroll(images):
    spec = SCROLL
    frames = scaled(images, spec)
    count = spec["count"]
    segments = len(FLAVOURS) - 1

    for i in range(count):
        p = (i / (count - 1)) * segments
        lo = min(int(p), segments - 1)
        t = p - lo

        if t <= HOLD:
            face = FLAVOURS[lo]
            # Sway tapers to zero by the end of the hold, so the turn starts from
            # dead-on rather than jumping off a residual angle.
            taper = 1.0 - (t / HOLD)
            theta = math.radians(ROCK_DEG) * taper * math.sin(2 * math.pi * 1.5 * t / HOLD)
        else:
            # One continuous 180° turn: the outgoing flavour covers the first 90,
            # the incoming one arrives through the second 90.
            angle = math.pi * ease((t - HOLD) / (1.0 - HOLD))
            if angle < math.pi / 2:
                face, theta = FLAVOURS[lo], angle
            else:
                face, theta = FLAVOURS[lo + 1], angle - math.pi

        write(compose(project(frames[face], theta), spec), OUT / f"seq_0_{i}.webp")

    return count


def build_hero(images):
    spec = HERO
    subject = scaled(images, spec)[HERO_FLAVOUR]
    count = spec["count"]

    for i in range(count):
        # The module yoyos 22 -> 0 -> 22, so a half sine here becomes a full sway
        # in playback and the loop closes without a seam.
        theta = math.radians(HERO_ROCK_DEG) * math.sin(math.pi * i / (count - 1))
        write(compose(project(subject, theta), spec), OUT / f"seq_1_{i}.webp")

    return count


def build_bottles(images):
    """Export each flavour as a standalone image for the finale.

    The finale is not a canvas scrub — the six bottles fly in as DOM elements, so
    they want their own tight crop rather than the shared alignment box the
    sequence needs. CSS sizes them; this only needs to be big enough for 2x.
    """
    BOTTLES.mkdir(parents=True, exist_ok=True)
    for stale in list(BOTTLES.glob("*.webp")):
        stale.unlink()

    for name, im in images.items():
        trimmed = im.crop(im.getchannel("A").getbbox())
        h = 700
        w = round(h * trimmed.width / trimmed.height)
        out = trimmed.resize((w, h), Image.LANCZOS)
        out.save(BOTTLES / f"{name}.webp", "WEBP", quality=86, method=4, exact=True)

    return len(images)


def main():
    OUT.mkdir(parents=True, exist_ok=True)

    # list() first — Path.glob is lazy, and unlinking while iterating it skips
    # entries, which silently leaves a mix of old and new frames on disk.
    for stale in list(OUT.glob("seq_*.webp")):
        stale.unlink()

    images, union = load_aligned()
    print(f"aligned {len(images)} flavours on shared box {union}")

    n0 = build_scroll(images)
    print(f"seq_0: {n0} frames  {SCROLL['size'][0]}x{SCROLL['size'][1]}  flavour spin")

    n1 = build_hero(images)
    print(f"seq_1: {n1} frames  {HERO['size'][0]}x{HERO['size'][1]}  {HERO_FLAVOUR} idle")

    nb = build_bottles(images)
    print(f"bottles: {nb} stills for the finale")

    total = sum(f.stat().st_size for f in OUT.glob("seq_*.webp"))
    total += sum(f.stat().st_size for f in BOTTLES.glob("*.webp"))
    print(f"total: {total / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
