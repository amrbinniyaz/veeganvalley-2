"""Cut printed labels out of the A5 product photographs for the 3D bottle.

The photographs in art/bottle-photos are the only source for the current
illustrated labels, and each label is small (about 130 x 380 px). The crop is
upscaled with Lanczos and lightly sharpened so it holds up on the hero bottle;
replace the source with the original label artwork when it is available.

    python3 scripts/prepare_photo_labels.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "art" / "bottle-photos"
OUTPUT = ROOT / "public" / "img" / "labels"

# Label rectangle in the source photograph (left, top, right, bottom) and the
# sticker's corner radius, both in source pixels.
LABELS = {
    "blue-magic": ((204, 235, 334, 613), 10),
    "green-house": ((151, 285, 283, 677), 10),
    "golden-hour": ((210, 274, 329, 615), 10),
    "classic-beet": ((209, 275, 330, 629), 10),
}
SCALE = 4


def prepare(name, box, radius):
    photo = Image.open(SOURCE / f"{name}.png").convert("RGBA")
    label = photo.crop(box)
    label = label.resize((label.width * SCALE, label.height * SCALE), Image.Resampling.LANCZOS)
    label = label.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
    mask = Image.new("L", label.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, label.width - 1, label.height - 1), radius * SCALE, fill=255)
    label.putalpha(mask)
    target = OUTPUT / f"{name}.webp"
    label.save(target, "WEBP", quality=90, method=6, alpha_quality=95)
    print(f"{target.relative_to(ROOT)}  {label.width} x {label.height}  {target.stat().st_size // 1024} KB")


if __name__ == "__main__":
    for name, (box, radius) in LABELS.items():
        prepare(name, box, radius)
