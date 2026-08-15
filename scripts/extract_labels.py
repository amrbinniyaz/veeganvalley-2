#!/usr/bin/env python3
"""
Pull the flat label artwork and the juice colour out of each product photo.

    python3 scripts/extract_labels.py

Writes art/labels/<flavour>.png (the label, rectified) and art/labels/flavours.json
(juice tint plus cap colour). Those feed tools/turntable.html, which wraps the
label around a modelled bottle and renders the real 360° turntable.

The photos are shot dead-on, so the front face is already square to camera and
the label needs no perspective correction — a straight crop is the rectified
texture. The crop box is expressed as fractions of the bottle's alpha bounding
box, which is why it holds for all six despite tiny framing differences.
"""
import json
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required:  python3 -m pip install Pillow")

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "art" / "bottles"
OUT = ROOT / "art" / "labels"

FLAVOURS = [
    "classic-beet",
    "morning-sunshine",
    "golden-hour",
    "green-house",
    "hydrator",
    "charcoal",
]

# Label box as a fraction of the bottle's bounding box.
LABEL = dict(u0=0.175, u1=0.805, v0=0.385, v1=0.925)

# Clean juice, sampled from the body above the label and below the shoulder.
JUICE = dict(u0=0.30, u1=0.70, v0=0.12, v1=0.32)

# The cap, near the top of every bottle.
CAP = dict(u0=0.35, u1=0.65, v0=0.015, v1=0.05)


def region(im, bbox, spec):
    x0, y0, x1, y1 = bbox
    w, h = x1 - x0, y1 - y0
    return (
        x0 + int(w * spec["u0"]), y0 + int(h * spec["v0"]),
        x0 + int(w * spec["u1"]), y0 + int(h * spec["v1"]),
    )


def average(im, box):
    px = [p for p in im.crop(box).getdata() if p[3] > 200]
    if not px:
        return "#888888"
    n = len(px)
    return "#%02x%02x%02x" % (
        sum(p[0] for p in px) // n,
        sum(p[1] for p in px) // n,
        sum(p[2] for p in px) // n,
    )


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {}

    for name in FLAVOURS:
        path = SRC / f"{name}.png"
        if not path.exists():
            sys.exit(f"missing source art: {path}")
        im = Image.open(path).convert("RGBA")
        bbox = im.getchannel("A").getbbox()

        label = im.crop(region(im, bbox, LABEL))
        # Flatten onto its own opaque copy: the label is a sticker, and any
        # alpha carried over from the bottle edge would punch holes in the wrap.
        flat = Image.new("RGB", label.size, (255, 255, 255))
        flat.paste(label, mask=label.getchannel("A"))
        flat.save(OUT / f"{name}.png")

        meta[name] = {
            "juice": average(im, region(im, bbox, JUICE)),
            "cap": average(im, region(im, bbox, CAP)),
            "label": f"/art/labels/{name}.png",
            "labelAspect": round(label.width / label.height, 4),
        }
        print(f"{name:18} juice={meta[name]['juice']}  cap={meta[name]['cap']}  label={label.size}")

    (OUT / "flavours.json").write_text(json.dumps(meta, indent=2) + "\n")
    print(f"\nwrote {len(meta)} labels + flavours.json to {OUT}")


if __name__ == "__main__":
    main()
