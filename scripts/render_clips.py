"""
Render the three vertical clips for the insider section.

    python3 scripts/render_clips.py      (or: npm run clips)

Reads  public/img/seq/seq_0_*.webp   the turntable frames
Writes public/video/insider-{1,2,3}.mp4
       public/video/insider-{1,2,3}.jpg   poster frames

WHY THESE ARE GENERATED AND NOT SHOT
------------------------------------
The reference site fills these three slots with influencer reels — real people
holding the product. We have no such footage, and no faces to use. What we do
have is a turntable, so these clips are the product itself: one flavour, lit on
a flat brand ground, turning away from camera and back.

HOW EACH CLIP LOOPS SEAMLESSLY
------------------------------
`scroll_plan()` swaps flavour at the half-turn, when the bottle's back is to
camera. So each flavour occupies one contiguous run of roughly 180 degrees —
front, round to back. Playing that run forward and then in reverse returns the
bottle to exactly the frame it started on, which makes the loop join invisible.
The two endpoints are dropped from the reversed half so neither the turn nor
the return holds for a double frame at the extremes.

A slow zoom runs across the whole loop and is mirrored the same way, so it
breathes in and out rather than snapping back at the wrap.
"""
import json
import math
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SEQ = ROOT / "public" / "img" / "seq"
OUT = ROOT / "public" / "video"
TMP = ROOT / ".clip-frames"

W, H = 720, 1280          # 9:16, the format these slots are shaped for
FPS = 24
ZOOM = 0.06               # extra scale at the midpoint of the loop
BOTTLE_HEIGHT = 0.78      # fraction of frame height at rest

# (name, first frame, last frame, background)
# Runs come from scroll_plan(); each is one flavour's ~180 degrees. Backgrounds
# are the section's own palette so the clips sit in the page rather than on it.
CLIPS = [
    ("insider-1", 34, 81, (185, 207, 159)),   # morning-sunshine, --bg-light
    ("insider-2", 82, 129, (141, 187, 99)),   # golden-hour,      --light-green
    ("insider-3", 177, 224, (168, 196, 140)), # hydrator,         between the two
]


def smoothstep(t: float) -> float:
    return t * t * (3.0 - 2.0 * t)


def compose(frame_path: Path, background, zoom: float) -> Image.Image:
    """One turntable frame, scaled and centred on a flat ground."""
    bottle = Image.open(frame_path).convert("RGBA")

    target_h = int(H * BOTTLE_HEIGHT * (1.0 + zoom))
    scale = target_h / bottle.height
    bottle = bottle.resize(
        (max(1, int(bottle.width * scale)), max(1, target_h)), Image.LANCZOS
    )

    canvas = Image.new("RGBA", (W, H), background + (255,))
    # Sits slightly below centre: the turntable frames carry headroom above the
    # cap, and optically centring the bottle means ignoring that empty band.
    canvas.alpha_composite(
        bottle,
        ((W - bottle.width) // 2, int((H - bottle.height) / 2 + H * 0.03)),
    )
    return canvas.convert("RGB")


def build(name: str, first: int, last: int, background) -> None:
    frames = [SEQ / f"seq_0_{i}.webp" for i in range(first, last + 1)]
    missing = [f.name for f in frames if not f.exists()]
    if missing:
        sys.exit(f"missing frames for {name}: {', '.join(missing[:5])} — run `npm run frames` first")

    # Forward, then back without repeating either endpoint.
    order = list(range(len(frames)))
    order += list(reversed(order[1:-1]))
    total = len(order)

    work = TMP / name
    if work.exists():
        shutil.rmtree(work)
    work.mkdir(parents=True)

    for n, idx in enumerate(order):
        # Mirrored across the loop, so the zoom is continuous at the wrap.
        phase = n / total
        zoom = ZOOM * smoothstep(1.0 - abs(2.0 * phase - 1.0))
        compose(frames[idx], background, zoom).save(work / f"{n:04d}.png")

    OUT.mkdir(parents=True, exist_ok=True)
    mp4 = OUT / f"{name}.mp4"

    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-framerate", str(FPS),
            "-i", str(work / "%04d.png"),
            "-c:v", "libx264",
            "-profile:v", "high", "-pix_fmt", "yuv420p",
            "-crf", "26",
            # Every frame a keyframe candidate is wasteful; a short GOP is
            # enough for a clip that loops in place.
            "-g", str(FPS * 2),
            "-movflags", "+faststart",
            "-an",
            str(mp4),
        ],
        check=True,
    )

    # Poster: mid-way through the outward turn, which is where the label faces
    # camera. Each run starts with the bottle's back to us — a poster of frame
    # zero would be an unbranded silhouette.
    poster_src = work / f"{(len(frames) - 1) // 2:04d}.png"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(poster_src),
         "-q:v", "4", str(OUT / f"{name}.jpg")],
        check=True,
    )

    shutil.rmtree(work)

    # Turntables are rendered from stills, so they never have a sound track.
    # Recorded rather than inferred — see write_manifest in ingest_clips.py.
    manifest = OUT / "clips.json"
    data = {}
    if manifest.exists():
        try:
            data = json.loads(manifest.read_text())
        except json.JSONDecodeError:
            data = {}
    data[name] = {"audio": False}
    manifest.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n")

    size = mp4.stat().st_size / 1024
    print(f"  {name}.mp4  {total} frames  {total / FPS:.1f}s  {size:.0f} KB")


def main() -> None:
    print(f"rendering {len(CLIPS)} clips at {W}x{H} {FPS}fps")
    for spec in CLIPS:
        build(*spec)
    if TMP.exists():
        shutil.rmtree(TMP, ignore_errors=True)
    print(f"\nwrote {OUT.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
