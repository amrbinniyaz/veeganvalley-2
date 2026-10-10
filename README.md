# Vegan Valley

A Vite website with a 3D bottle hero, illustrated farm-to-bottle story, and a separate interactive 3D journey.

## Local development

```sh
npm ci
npm run dev
```

The development server runs on port 3003 and is accessible on the local network.

## Production

```sh
npm run build
```

The `dist` directory contains six pages: `/`, `/menu/`, `/home-2/`, `/farm-to-bottle/`, `/3d-journey/`, and `/meal-plans/`.

`/home-2/` preserves the original homepage, including its loader, 3D bottle animation, product cards and remaining sections. It adds an expanding landscape arch immediately after the cold-pressed / all-plants ticker. The original homepage remains at `/`. Artwork provenance and the generation prompt are in `art/home-2/README.md`.

The Dockerfile builds the site and serves it with Nginx on port 80, including video range requests and a `/healthz` endpoint. No application environment variables or database are required.

## Dokploy

- Repository: `https://github.com/amrbinniyaz/veeganvalley-2`
- Branch: `main`
- Build type: Dockerfile
- Build context: `.` (repository root)
- Dockerfile path: `Dockerfile`
- Domain target port: `80`

Add a domain in Dokploy and deploy the application. TLS terminates at Dokploy's proxy.

Source artwork is in `art`; runtime images and videos are in `public`. Local social-video work and exports are excluded from Git and the production image.

Meal-plan content and nutrition figures are transcribed from the supplied Vegan Valley brochure in `public/downloads/vegan-valley-meal-plans.pdf`. The preference wizard suggests existing menu items and opens an editable WhatsApp enquiry; it does not place orders or calculate personalised nutrition targets.

## Menu and pickup orders

`/menu/` lists every dish and drink from `VV Dine-In Menu with Nutri Digital.pdf`, with prices, nutrition and add-ons. Customers add items to a basket (kept in their browser), review it, and send it as an editable WhatsApp message to +91 77360 05800 for pickup. Nothing is placed until they press send in WhatsApp. The basket and item sheets live in `src/modules/order.js` and work on every page that calls `initOrder()`.

- `python3 scripts/build_menu.py` rebuilds `src/data/menu.json` and `public/img/menu/` from the menu PDF.
- Juices come from `src/data/juices.json` (names, prices, ingredients and benefits from the dine-in menu; nutrition from `A5 DESIGN.pdf`). After editing it, run `python3 scripts/build_product_cards.py`.
