# Virunga Journeys

Static travel website for **Virunga Journeys**: private journeys across Rwanda (gorillas and golden monkeys in the Virungas, chimpanzees in Nyungwe, Akagera's savannah, Lake Kivu), in **English, French, German and Spanish**.

- Live site: https://rwanda-three.vercel.app
- Planned production domain: https://virungajourneys.tourground.com (set in `site.config.js` as `siteUrl`; canonicals, hreflang, sitemap and JSON-LD use it)
- Hosting: Vercel, team "Benjamin - Sevo", project `rwanda`; every push to `main` deploys.

## Run it

Requires Node 18 or newer. The build itself has **no dependencies**.

```bash
npm run build      # writes ./dist (88 pages + thank-you and 404 pages)
npm run serve      # serves ./dist at http://localhost:4321 (clean URLs, trailing slashes)
npm run dev        # build + serve
```

Vercel uses `vercel.json`: build command `node src/build.js`, output folder `dist`, clean URLs, trailing slashes, one-year immutable cache headers on `/assets/*` (all asset file names carry a content hash, except the two font files).

## Where things live

| What | File |
|---|---|
| Brand name, email, address, site URLs, palette, fonts, languages | `site.config.js` (the only place to change to swap the brand) |
| All copy, per language (same shape in every file) | `src/content/en.js`, `fr.js`, `de.js`, `es.js` |
| Image alt text in all four languages | `src/content/alt.json` |
| Page templates and the generator | `src/build.js` |
| Styles (inlined into each page at build) | `src/assets/css/site.css` |
| Small progressive-enhancement script (deferred) | `src/assets/js/site.js` |
| Fonts (self-hosted woff2: Libre Caslon Display 400, Nunito Sans 400–700) | `src/assets/fonts/` |
| Optimised images (AVIF + WebP, 480–2400 px) and their metadata | `src/assets/img/`, `src/data/images.json` |
| Photo sources and licences | `src/img-src/manifest.json` |

### Editing copy

Edit `src/content/en.js`, then make the same change in `fr.js`, `de.js` and `es.js`. Keys, slugs, ids and image keys must stay identical across languages; `{{brand}}`, `{{email}}`, `{{emailLink}}` and `{{address}}` are filled from `site.config.js` at build time. Check a language file with:

```bash
node scripts/check-shape.js fr
```

The build refuses to run if any language is missing a key or an image is missing alt text.

### Adding or replacing a photo

1. Put the original JPEG in `src/img-src/` (originals are not committed; keep them elsewhere) and add an entry to `src/img-src/manifest.json` (file, source URL, author, licence, licence URL, location, focal point).
2. `npm install` (installs `sharp`, used only by this step), then `npm run images`. This regenerates `src/assets/img/` and `src/data/images.json` **from the whole manifest**, so all originals must be present.
3. Add alt text for the new key in all four languages in `src/content/alt.json`.
4. Use the key in the content files (`img`, `card`, `gallery`, …) and rebuild.

Creative Commons photos are credited automatically on `/credits/`. Rules for photos of named venues are in `IMAGES-NEEDED.md`.

### Enquiry form

The form posts to [FormSubmit](https://formsubmit.co) (`form.action` / `form.ajax` in `site.config.js`), which emails each enquiry to `virungajourneys@tourground.com`. **The first submission triggers a one-time activation email to that address; click the link in it once** and enquiries arrive from then on. To use another relay, change the two URLs in `site.config.js`.

## Languages

English is at `/`, French at `/fr/`, German at `/de/`, Spanish at `/es/`. Every page exists in every language with translated nav, forms, legal pages, meta and alt text; `<html lang>`, canonical and `hreflang` (with `x-default` → English) are set on every page, and the sitemap lists all alternates. The EN · FR · DE · ES selector links to the same page in each language. There is no automatic redirect by browser language and no translation code in the browser.

## Before launch

- Check every item in `FACTS-TO-VERIFY.md` (permit prices, park fees, seasons, holidays, travel advice).
- Replace placeholder lodge names on `/stays/` once partners are confirmed; see `IMAGES-NEEDED.md` for venue photos.
- Commission or license imigongo patterns from a cooperative and credit it by name (the current zigzags are original drawings).
- Point `virungajourneys.tourground.com` at the Vercel project and activate the FormSubmit address.
