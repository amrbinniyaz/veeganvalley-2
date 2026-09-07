#!/usr/bin/env python3
"""
Render the canvas frame sequences from the 3D bottle in tools/turntable.html.

    npm run turntable

Drives the render rig in headless Chrome and writes:

    public/img/seq/seq_0_*.webp   the scroll scrub  — spin + flavour change
    public/img/seq/seq_1_*.webp   the hero idle     — gentle sway
    public/img/bottles/*.webp     the finale stills — one per flavour

Prerequisites: `python3 scripts/extract_labels.py` (labels + juice colours) and
`npm i` (three, playwright). The Vite dev server is started and stopped here.

HOW THE FLAVOUR CHANGE HIDES
----------------------------
The label only exists on the front face, so it is invisible whenever the bottle
has its back to camera. Every swap is therefore timed to a half-turn: the bottle
spins, and at exactly the moment the back is facing us the texture changes. You
never see a flavour become another flavour — you see a bottle turn around and
come back as a different one.
"""
import io
import json
import math
import re
import subprocess
import sys
import time
from pathlib import Path

try:
    from PIL import Image
    from playwright.sync_api import sync_playwright
except ImportError as exc:
    sys.exit(f"missing dependency ({exc.name}): pip install Pillow playwright")

ROOT = Path(__file__).resolve().parent.parent
SEQ = ROOT / "public" / "img" / "seq"
BOTTLES = ROOT / "public" / "img" / "bottles"

FLAVOURS = [
    "classic-beet",
    "morning-sunshine",
    "golden-hour",
    "green-house",
    "hydrator",
    "charcoal",
]

RENDER_SIZE = 1440
SCROLL_COUNT = 240      # must match FRAME_COUNT in src/modules/sequence.js
HERO_COUNT = 23         # must match FRAME_COUNT in src/modules/loadStage.js

# Fraction of each segment the bottle faces front before it turns. The hold is
# what makes each label readable; without it the scrub is a permanent blur.
HOLD = 0.40
HERO_SWAY = 13.0        # degrees either side of front for the hero idle

# The bottle spins tipped rather than bolt upright — dead vertical reads as a
# technical turntable, the lean reads as a product being shown to you.
#
# The tip alternates per flavour section and swings across during the turn, so
# the bottle holds leaning left, spins, and arrives leaning right. That gives
# every section its own stance instead of one pose repeated six times, and the
# swing makes each turn feel thrown rather than motorised.
LEAN_Z = 9.0            # magnitude of the tip; direction flips each section
LEAN_X = -3.5           # constant slight tip towards camera, three-quarter feel
LEAN_WOBBLE = 1.2       # small drift on top, so a held pose is never frozen

CHROME_ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]


def smoothstep(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3.0 - 2.0 * t)


def lean_z_for(lo, t):
    """The tip for section `lo` at progress `t` through it.

    Even sections lean one way, odd sections the other, and the swing between
    them happens during the turn — never during a hold, so the bottle is always
    still while you are reading its label.
    """
    a = LEAN_Z * (-1 if lo % 2 == 0 else 1)   # this section's tip
    b = -a                                    # the next one's
    if t <= HOLD:
        return a
    return a + (b - a) * smoothstep((t - HOLD) / (1.0 - HOLD))


def scroll_plan():
    """(flavour, spin, leanZ, leanX) per frame: hold, then a turn that swaps at the back."""
    plan = []
    segments = len(FLAVOURS) - 1
    for i in range(SCROLL_COUNT):
        phase = i / (SCROLL_COUNT - 1)
        p = phase * segments
        lo = min(int(p), segments - 1)
        t = p - lo
        turns = lo * 360.0
        lz = lean_z_for(lo, t) + LEAN_WOBBLE * math.sin(2 * math.pi * 2.0 * phase)
        lx = LEAN_X

        if t <= HOLD:
            # A slow drift during the hold, so a held bottle is not a still.
            plan.append((FLAVOURS[lo], turns + 5.0 * smoothstep(t / HOLD), lz, lx))
        else:
            spun = 360.0 * smoothstep((t - HOLD) / (1.0 - HOLD))
            # Past the half-turn the back is to camera; that is where it changes.
            face = FLAVOURS[lo] if spun < 180.0 else FLAVOURS[lo + 1]
            plan.append((face, turns + 5.0 + spun, lz, lx))
    return plan


def hero_plan(flavour):
    # No lean baked in here: loadStage.js already tilts the hero canvas in CSS,
    # and baking a second tip on top of it would double the angle.
    return [
        (flavour, HERO_SWAY * math.sin(math.pi * i / (HERO_COUNT - 1)), 0.0, 0.0)
        for i in range(HERO_COUNT)
    ]


def start_vite():
    proc = subprocess.Popen(
        ["npm", "run", "dev"], cwd=ROOT,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
    )
    port = None
    deadline = time.time() + 60
    while time.time() < deadline:
        line = proc.stdout.readline()
        if not line:
            break
        m = re.search(r"localhost:(\d+)", line)
        if m:
            port = int(m.group(1))
            break
    if not port:
        proc.terminate()
        sys.exit("could not start the Vite dev server")
    return proc, port


def save(png_bytes, path, size=None):
    im = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    if size and im.size != size:
        im = im.resize(size, Image.LANCZOS)
    im.save(path, "WEBP", quality=88, method=4, exact=True)


def main():
    labels = ROOT / "art" / "labels" / "flavours.json"
    if not labels.exists():
        sys.exit("run  python3 scripts/extract_labels.py  first")

    SEQ.mkdir(parents=True, exist_ok=True)
    BOTTLES.mkdir(parents=True, exist_ok=True)
    for stale in list(SEQ.glob("seq_*.webp")) + list(BOTTLES.glob("*.webp")):
        stale.unlink()

    proc, port = start_vite()
    print(f"vite on :{port}")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(channel="chrome", args=CHROME_ARGS)
            page = browser.new_page(
                viewport={"width": RENDER_SIZE + 40, "height": RENDER_SIZE + 40}
            )
            page.goto(
                f"http://localhost:{port}/tools/turntable.html?size={RENDER_SIZE}",
                wait_until="load", timeout=90000,
            )
            page.wait_for_function("window.__ready === true", timeout=120000)
            canvas = page.locator("canvas")
            print("rig ready")

            def shoot(flavour, degrees, lean_z=0.0, lean_x=0.0):
                page.evaluate(
                    "([f, d, z, x]) => window.renderFrame(f, d, z, x)",
                    [flavour, degrees, lean_z, lean_x],
                )
                return canvas.screenshot(omit_background=True)

            plan = scroll_plan()
            for i, (flavour, deg, lz, lx) in enumerate(plan):
                save(shoot(flavour, deg, lz, lx), SEQ / f"seq_0_{i}.webp")
                if (i + 1) % 40 == 0:
                    print(f"  seq_0 {i + 1}/{len(plan)}")

            # One idle sequence per flavour, so the hero can pick a different
            # bottle on each visit. Only one set is ever fetched at runtime, so
            # this costs disk but not memory or bandwidth.
            for name in FLAVOURS:
                for i, (flavour, deg, lz, lx) in enumerate(hero_plan(name)):
                    save(
                        shoot(flavour, deg, lz, lx),
                        SEQ / f"seq_1_{name}_{i}.webp",
                        size=(1466, 1722),
                    )
                print(f"  seq_1 {name} {HERO_COUNT}/{HERO_COUNT}")

            # The page reads this to know what it may choose between, rather
            # than carrying a copy of FLAVOURS that can drift out of step.
            (SEQ / "hero.json").write_text(
                json.dumps({"flavours": FLAVOURS, "count": HERO_COUNT}, indent=2) + "\n"
            )

            # Finale stills, from the same model so the line-up and the scrub
            # bottle are unmistakably the same object. A few degrees off-axis
            # keeps them from reading as flat cut-outs next to it.
            for name in FLAVOURS:
                png = shoot(name, -14.0)
                im = Image.open(io.BytesIO(png)).convert("RGBA")
                im = im.crop(im.getchannel("A").getbbox())
                h = 700
                im.resize((round(h * im.width / im.height), h), Image.LANCZOS).save(
                    BOTTLES / f"{name}.webp", "WEBP", quality=86, method=4, exact=True
                )
            print(f"  bottles {len(FLAVOURS)}")

            browser.close()
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()

    total = sum(f.stat().st_size for f in SEQ.glob("*.webp"))
    total += sum(f.stat().st_size for f in BOTTLES.glob("*.webp"))
    print(f"\nseq_0: {SCROLL_COUNT}  seq_1: {HERO_COUNT}  bottles: {len(FLAVOURS)}")
    print(f"total: {total / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
