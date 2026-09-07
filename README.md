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

The `dist` directory contains the three pages: `/`, `/farm-to-bottle/`, and `/3d-journey/`.

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
