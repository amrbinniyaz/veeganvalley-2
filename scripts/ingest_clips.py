"""
Turn arbitrary source footage into the three insider clips.

    python3 scripts/ingest_clips.py            (or: npm run ingest)

Reads  art/footage/*.{mp4,mov,webm,m4v}   whatever you drop in, sorted by name
Writes public/video/insider-{1,2,3}.mp4   + .jpg posters

Only the first three files are used; name them so they sort the way you want
them to appear (01-…, 02-…, 03-…).

CHOOSING A SEGMENT
------------------
A 60-second reel is not a 4-second ambient loop, and the interesting part is
rarely at the front. Append `@start-end` (in seconds) to the filename to take
a slice instead of the opening:

    01-cold-press@14-26.mp4     seconds 14 to 26
    02-bottling@30.mp4          from 30s, up to the length cap

Everything before the `@` is yours; the marker is stripped when sorting.

WHAT THIS IS FOR
----------------
`render_clips.py` generates product turntables, which are ours and always
work. This script is the path for real footage — brand-owned or licensed —
once it exists. Both write to the same filenames, so the page does not change
either way: whichever ran last is what ships.

RIGHTS
------
This script does not download anything. It processes files already on disk,
because whether footage may be published is a question about permission, not
about tooling. Use it for footage you shot, or footage whose creator has given
you written permission to use commercially. Record that permission in
art/footage/RIGHTS.md next to the files.

WHAT IT DOES TO THE FOOTAGE
---------------------------
Source clips are rarely the right shape. Each one is centre-cropped to 9:16 and
scaled to 720x1280, which is what the slot renders at — shipping a 1080x1920
phone capture would be three times the bytes for pixels the layout never shows.
Audio is preserved: the sound toggle is only meaningful if there is something
to un-mute.
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "art" / "footage"
OUT = ROOT / "public" / "video"

W, H = 720, 1280
MAX_SECONDS = 12          # these are ambient loops, not features
EXTENSIONS = {".mp4", ".mov", ".webm", ".m4v", ".mkv"}


def has_audio(path: Path) -> bool:
    """Whether the encoded file actually carries an audio stream."""
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a",
         "-show_entries", "stream=codec_type", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    )
    return "audio" in out.stdout


def write_manifest(index: int, audio: bool) -> None:
    """
    Record which clips have sound.

    The page cannot work this out for itself: a muted <video> decodes no audio,
    so `webkitAudioDecodedByteCount` reads 0 for a silent clip and a sound-track
    clip alike, and there is no cross-browser way to ask before playback. Since
    the encoder knows for certain, it writes the answer down and the page reads
    it — that is the difference between the sound button hiding correctly and
    hiding at random.
    """
    manifest = OUT / "clips.json"
    data = {}
    if manifest.exists():
        try:
            data = json.loads(manifest.read_text())
        except json.JSONDecodeError:
            data = {}
    data[f"insider-{index}"] = {"audio": audio}
    manifest.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n")


def check_ffmpeg() -> None:
    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg not found — install it (brew install ffmpeg) and re-run")


def sources() -> list[Path]:
    if not SRC.exists():
        SRC.mkdir(parents=True, exist_ok=True)
        sys.exit(
            f"no footage found.\n"
            f"  drop up to three clips in {SRC.relative_to(ROOT)}/ and re-run.\n"
            f"  they are used in filename order, so name them 01-*, 02-*, 03-*.\n"
            f"  (until then `npm run clips` generates product turntables instead)"
        )

    found = sorted(
        (p for p in SRC.iterdir() if p.suffix.lower() in EXTENSIONS),
        key=lambda p: TRIM.sub("", p.stem),
    )
    if not found:
        sys.exit(f"no video files in {SRC.relative_to(ROOT)}/ — expected one of {sorted(EXTENSIONS)}")
    return found[:3]


TRIM = re.compile(r"@(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?$")


def trim_for(source: Path) -> tuple[float, float]:
    """(start, duration) from an optional `@start-end` marker on the filename."""
    match = TRIM.search(source.stem)
    if not match:
        return 0.0, MAX_SECONDS

    start = float(match.group(1))
    end = float(match.group(2)) if match.group(2) else None
    if end is None:
        return start, MAX_SECONDS
    if end <= start:
        sys.exit(f"{source.name}: end ({end}) must be after start ({start})")
    return start, min(end - start, MAX_SECONDS)


def build(source: Path, index: int) -> None:
    dest = OUT / f"insider-{index}.mp4"
    start, duration = trim_for(source)

    # Scale so the short edge covers the target, then crop the overflow from
    # the centre. `increase` before `crop` is what prevents letterboxing on
    # footage that is wider or squarer than 9:16.
    vf = f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps=30"

    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            # -ss before -i seeks by keyframe, which is fast and accurate
            # enough for picking a segment out of a phone recording.
            "-ss", str(start),
            "-i", str(source),
            "-t", str(duration),
            "-vf", vf,
            "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
            "-crf", "26", "-preset", "slow",
            "-c:a", "aac", "-b:a", "96k", "-ac", "2",
            "-movflags", "+faststart",
            str(dest),
        ],
        check=True,
    )

    # Poster a second in: frame zero of real footage is often a fade or a
    # motion-blurred first frame.
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-ss", "1", "-i", str(dest),
         "-frames:v", "1", "-q:v", "4", str(OUT / f"insider-{index}.jpg")],
        check=True,
    )

    write_manifest(index, has_audio(dest))

    size = dest.stat().st_size / 1024
    window = f"{start:g}-{start + duration:g}s" if start else f"first {duration:g}s"
    print(f"  insider-{index}.mp4  <-  {source.name[:44]}  [{window}]  {size:.0f} KB")


def main() -> None:
    check_ffmpeg()
    found = sources()
    OUT.mkdir(parents=True, exist_ok=True)

    print(f"ingesting {len(found)} clip(s) at {W}x{H}")
    for i, source in enumerate(found, start=1):
        build(source, i)

    if len(found) < 3:
        print(
            f"\nnote: only {len(found)} supplied — slots {len(found) + 1}-3 still show "
            f"whatever was there before (run `npm run clips` to reset them to turntables)"
        )
    print(f"\nwrote {OUT.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
