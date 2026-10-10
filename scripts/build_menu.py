"""Build the website menu from the dine-in menu PDF.

Reads "VV Dine-In Menu with Nutri Digital.pdf" and writes:
  src/data/menu.json         categories, dishes, prices, nutrition and add-ons
  public/img/menu/*.webp     dish photographs, cut out on transparent backgrounds

Dishes (pages 2-13) are read from the PDF's text and image positions. Drinks
(pages 14-15) use a different layout and are listed by hand below; juices come
from src/data/juices.json. Every extracted item was checked against the page.

Run: python3 scripts/build_menu.py
"""
import json
import math
import re
import unicodedata
from pathlib import Path

import fitz
import numpy as np
from PIL import Image
from scipy.optimize import linear_sum_assignment

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / 'VV Dine-In Menu with Nutri Digital.pdf'
IMAGES = ROOT / 'public/img/menu'
MAX_SIDE = 720

# Menu order. `group` drives the homepage tiles; `blurb` explains the section in plain words.
CATEGORIES = [
    dict(id='oat-meals', page=1, title='Oat Meals', group='breakfast', blurb='Creamy oats and chia puddings to start the day.',
         addOns=[('Plant protein', 99), ('Peanut butter', 40)]),
    dict(id='speciality-bowls', page=2, title='Speciality Bowls', group='breakfast', blurb='Thick smoothie bowls topped with granola and fresh fruit.',
         addOns=[('Strawberries', 45), ('Blueberries', 45), ('Mangoes', 40), ('Chia seeds', 20), ('Coconut flakes', 20), ('Granola', 30),
                 ('Peanut butter', 40), ('Choco chips', 40), ('Almonds', 45), ('Pistachios', 50), ('Walnuts', 50)]),
    dict(id='toasted-delights', page=3, title='Toasted Delights', group='breakfast', blurb='Loaded artisan toasts, sweet and savoury.'),
    dict(id='appetisers', page=4, title='Appetisers', group='snacks', blurb='Crispy bites for sharing, or not.'),
    dict(id='wraps-quesadillas', page=5, title='Wraps & Quesadillas', group='mains', blurb='Rolled, folded and packed with flavour.',
         options=['Gluten-free wrap'], note='Gluten-free option available.'),
    dict(id='ciabattas-sandwiches', page=6, title='Ciabattas & Sandwiches', group='mains', blurb='Warm ciabattas with tofu and tempeh.'),
    dict(id='burgers', page=7, title='Gourmet Plant Burgers', group='mains', blurb='Served with potato wedges on the side.',
         addOns=[('Sriracha mayo', 45), ('Garlic aioli', 45), ('Vegan cheese', 40)]),
    dict(id='pastas', page=8, title='Artisan Pastas', group='mains', blurb='Dairy-free sauces, made in house.'),
    dict(id='superfood-bowls', pages=[9, 10], title='Superfood Bowls', group='mains', blurb='Hearty rice and grain bowls: a full meal.'),
    dict(id='sushi', page=11, title='Clean Coast Sushi', group='mains', blurb='Plant-based rolls with wasabi and soya dip.'),
    dict(id='treats', page=12, title='Sweet Valley Treats', group='sweets', blurb='Cookies, brownies, tarts and pies.'),
    dict(id='juices', title='Cold-Pressed Juices', group='drinks', blurb='Bottled fresh, 375 ml. Keep cold, shake well.', source='juices'),
    dict(id='elixirs', page=14, title='Elixirs', group='drinks', blurb='Iced coolers with fresh citrus.'),
    dict(id='teas', page=14, title='Herbal Teas & Infusions', group='drinks', blurb='Whole-leaf teas, served hot.'),
]

# Drinks page: (category, name, price, description, image xref)
DRINKS = [
    ('elixirs', 'Ruby Hibiscus Chill', 169, 'A ruby-red cooler of tart hibiscus petals and bright, zesty citrus. Chilled and naturally sweetened.', 1717),
    ('elixirs', 'Crisp Lemon Chill', 129, 'Crisp iced tea with freshly squeezed lemon juice. Ice-cold, revitalising, with a touch of sweetness.', 1718),
    ('elixirs', 'Peach Nectar Chill', 149, 'Sun-ripened peach nectar with crisp iced tea, sipped over ice.', 1719),
    ('teas', 'Mint', 60, 'A fresh dash of peppermint with whole leaves to keep you refreshed.', 1723),
    ('teas', 'Rose', 60, 'A sweet, comforting blend of whole leaves and fragrant rose petals.', 1724),
    ('teas', 'Jasmine', 60, 'Earthy whole leaves with soothing jasmine flowers.', 1721),
    ('teas', 'Ginger & Tulsi', 60, 'Turmeric and tulsi with the warm aroma of ginger.', 1722),
    ('teas', 'Hibiscus Ritual', 60, 'A warm infusion of hibiscus flowers, naturally tangy and floral.', 1720),
]
SERVING_NOTES = {'Fruit Tart': 'Serving: 2 pieces'}
RENAME = {'Granola': 'Granola Bites'}  # date, peanut butter and oat balls; avoids confusion with granola toppings


def slug(text):
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', text.lower().replace('&', 'and')).strip('-')


def save_image(doc, xref, name):
    base = fitz.Pixmap(doc, xref)
    smask = doc.extract_image(xref).get('smask')
    if smask:
        base = fitz.Pixmap(base, fitz.Pixmap(doc, smask))
    if base.colorspace and base.colorspace.n != 3:
        base = fitz.Pixmap(fitz.csRGB, base)
    image = Image.frombytes('RGBA' if base.alpha else 'RGB', (base.width, base.height), base.samples).convert('RGBA')
    box = image.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    image = image.crop(box)
    image.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
    image.save(IMAGES / f'{name}.webp', 'WEBP', quality=84, method=6)
    return image.size


def extract_page(page):
    spans = []
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            for s in line['spans']:
                text = s['text'].strip()
                if text:
                    spans.append(dict(t=text, x=s['bbox'][0], y=s['bbox'][1], y1=s['bbox'][3], size=round(s['size'], 1), font=s['font']))
    names = []
    for s in sorted([s for s in spans if s['size'] == 18.0 and 'Glacial' in s['font']], key=lambda s: (round(s['x'] / 50), s['y'])):
        if names and abs(names[-1]['x'] - s['x']) < 15 and 0 < s['y'] - names[-1]['y1'] < 8:
            names[-1]['t'] += ' ' + s['t']
            names[-1]['y1'] = s['y1']
        else:
            names.append(dict(s))
    descriptions = [s for s in spans if s['size'] == 10.0 and 'Glacial' in s['font']]
    kcal = [s for s in spans if s['font'] == 'Garuda' and s['t'] == 'kcal']
    prices = [s for s in spans if 'Montserrat' in s['font'] and s['t'].startswith('₹')]
    images = [i for i in page.get_image_info(xrefs=True)
              if i['bbox'][0] > -100 and i['bbox'][2] - i['bbox'][0] > 100 and i['width'] != 475]
    items = []
    for name in names:
        lines = []
        for s in sorted((s for s in descriptions if abs(s['x'] - name['x']) < 20 and name['y1'] - 2 < s['y'] < name['y1'] + 120), key=lambda s: s['y']):
            if lines and s['y'] - lines[-1]['y'] > 20:
                break
            lines.append(s)
        bottom = lines[-1]['y1'] if lines else name['y1']
        k = min((s for s in kcal if s['y'] > bottom - 5 and abs(s['x'] - name['x']) < 40), key=lambda s: s['y'] - bottom, default=None)
        nutrition = None
        if k:
            row = sorted((s for s in spans if s['font'] == 'Garuda-Bold' and abs(s['y'] - k['y']) < 3 and k['x'] - 25 < s['x'] < k['x'] + 150), key=lambda s: s['x'])
            if len(row) == 5:
                nutrition = dict(zip(['calories', 'protein', 'carbs', 'fibre', 'fat'], (int(s['t']) for s in row)))
        description = re.sub(r'\s+', ' ', ' '.join(s['t'] for s in lines)).strip()
        description = re.sub(r'^Superfood Bowl — ', '', description)
        items.append(dict(name=re.sub(r'\s+', ' ', name['t']).strip(), description=description, nutrition=nutrition,
                          anchor=(name['x'], k['y'] if k else bottom)))

    def image_cost(item, image):
        x, y = item['anchor']
        x0, y0, x1, _ = image['bbox']
        dy = y0 - y
        return abs(dy) * (3 if dy < -60 else 1) + abs((x0 + x1) / 2 - (x + 120)) * 0.6

    rows, cols = linear_sum_assignment(np.array([[image_cost(i, m) for m in images] for i in items]))
    for r, c in zip(rows, cols):
        items[r]['image'] = images[c]

    def price_cost(item, price):
        x0, y0, x1, y1 = item['image']['bbox']
        return math.hypot(price['x'] - (x0 + x1) / 2, (price['y'] - (y0 + y1) / 2) * 1.5)

    rows, cols = linear_sum_assignment(np.array([[price_cost(i, p) for p in prices] for i in items]))
    for r, c in zip(rows, cols):
        items[r]['price'] = int(re.sub(r'\D', '', prices[c]['t']))
    return items


def main():
    doc = fitz.open(PDF)
    IMAGES.mkdir(parents=True, exist_ok=True)
    items = []
    for category in CATEGORIES:
        pages = category.get('pages') or ([category['page']] if 'page' in category and category['id'] not in ('elixirs', 'teas') else [])
        for page_number in pages:
            for item in extract_page(doc[page_number]):
                name = RENAME.get(item['name'], item['name'])
                item_id = slug(name)
                width, height = save_image(doc, item['image']['xref'], item_id)
                entry = dict(id=item_id, category=category['id'], name=name, price=item['price'], description=item['description'],
                             nutrition=item['nutrition'], image=f'/img/menu/{item_id}.webp', width=width, height=height)
                if name in SERVING_NOTES:
                    entry['serving'] = SERVING_NOTES[name]
                items.append(entry)
    for category_id, name, price, description, xref in DRINKS:
        item_id = slug(name)
        width, height = save_image(doc, xref, item_id)
        items.append(dict(id=item_id, category=category_id, name=name, price=price, description=description, nutrition=None,
                          image=f'/img/menu/{item_id}.webp', width=width, height=height))
    categories = []
    for category in CATEGORIES:
        entry = {k: category[k] for k in ('id', 'title', 'group', 'blurb') if k in category}
        if 'source' in category:
            entry['source'] = category['source']
        if category.get('addOns'):
            entry['addOns'] = [dict(name=n, price=p) for n, p in category['addOns']]
        if category.get('options'):
            entry['options'] = category['options']
        if category.get('note'):
            entry['note'] = category['note']
        categories.append(entry)
    order = [c['id'] for c in CATEGORIES]
    items.sort(key=lambda i: order.index(i['category']))
    (ROOT / 'src/data/menu.json').write_text(json.dumps(dict(categories=categories, items=items), indent=1, ensure_ascii=False) + '\n')
    print(f'{len(items)} items in {len(categories)} categories')


if __name__ == '__main__':
    main()
