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

The `dist` directory contains five pages: `/`, `/home-2/`, `/farm-to-bottle/`, `/3d-journey/`, and `/meal-plans/`.

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
