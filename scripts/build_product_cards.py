"""Regenerate the product cards on both homepages from src/data/juices.json.

Run after editing the juice data: python3 scripts/build_product_cards.py
"""
import html
import json
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PAGES = [ROOT / 'index.html', ROOT / 'home-2' / 'index.html']
juices = json.loads((ROOT / 'src/data/juices.json').read_text())
e = html.escape


def card(index, juice):
    width, height = Image.open(ROOT / f"public/img/bottle-photos/{juice['image']}.webp").size
    return (
        f'<article class="product-card" data-category="{juice["category"]}" style="--card-bg:{juice["cardBg"]};--card-ink:{juice["cardInk"]}">'
        f'<button class="product-image-button" data-product="{juice["id"]}" aria-label="Discover {e(juice["name"])}">'
        f'<span class="card-category eyebrow">{juice.get("badge", juice["label"]).upper()}</span><span class="card-index">{index:02d}</span>'
        f'<span class="product-word" aria-hidden="true">{juice["word"]}</span>'
        f'<img src="/img/bottle-photos/{juice["image"]}.webp" alt="{e(juice["name"])} cold-pressed bottle" width="{width}" height="{height}" loading="lazy" />'
        f'<span class="product-discover">Discover <span>↗</span></span></button>'
        f'<div class="product-caption"><div><h3>{e(juice["name"])}</h3><p>{e(juice["tagline"])}</p></div>'
        f'<div class="product-buy"><span class="product-price">₹{juice["price"]}</span>'
        f'<button class="product-add" type="button" data-add="{juice["id"]}" aria-label="Add {e(juice["name"])} to order"><span aria-hidden="true">+</span> Add</button></div></div></article>'
    )


grid = '<div class="product-grid">\n' + '\n'.join(
    f'          {card(i, juice)}' for i, juice in enumerate(juices, 1)
) + '\n        </div>'
count = len(juices)
words = {9: 'NINE', 10: 'TEN', 11: 'ELEVEN', 12: 'TWELVE'}

for page in PAGES:
    source = page.read_text()
    source = re.sub(r'<div class="product-grid">.*?\n        </div>', lambda _: grid, source, count=1, flags=re.S)
    source = re.sub(r'<span class="eyebrow">[A-Z]+ FLAVOURS\. YOUR KIND OF GOOD\.</span>',
                    f'<span class="eyebrow">{words.get(count, count)} FLAVOURS. YOUR KIND OF GOOD.</span>', source)
    source = re.sub(r'All juices <sup>\d+</sup>', f'All drinks <sup>{count:02d}</sup>', source)
    source = re.sub(r'All drinks <sup>\d+</sup>', f'All drinks <sup>{count:02d}</sup>', source)
    source = re.sub(r'Showing all \d+ (juices|drinks)', f'Showing all {count} drinks', source)
    source = source.replace('<button data-filter="mylk" aria-pressed="false">Mylk</button>', '')
    page.write_text(source)
    print(f'{page.relative_to(ROOT)}: {count} cards')
