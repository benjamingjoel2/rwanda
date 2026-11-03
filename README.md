# Virunga Journeys

A lightweight, pre-rendered static travel site for Rwanda. English is at `/`; French, German and Spanish are at `/fr/`, `/de/` and `/es/`. Each locale has its own HTML pages and language metadata; no browser translation or automatic language redirect is used.

## Run locally

Requires Node.js 20 or newer. Run `npm run build`, then serve the generated `dist` directory with any static file server (for example `npx serve dist`). `npm run dev` starts the included local server at `http://localhost:4173`.

## Edit

- `config.mjs` contains the brand name, contact email, business address, URL and palette.
- `build.mjs` contains the translated content and prerendering logic. Add page slugs to `paths` and `slugs` together.
- `public/styles.css` contains the visual system.
- `FACTS-TO-VERIFY.md` records travel details requiring current confirmation.

The live URL is configured as `https://virungajourneys.tourground.com`. Images currently load from Unsplash URLs and should be replaced with optimized, geographically verified Rwanda imagery before launch. Do not add venue photos unless the image rights meet the project rules.

## Deploy

`vercel.json` runs `npm run build` and publishes `dist`. The current workspace did not include a Git checkout or configured remote when this was prepared; connect the project to `benjamingjoel2/rwanda` and the Vercel team before deployment.

