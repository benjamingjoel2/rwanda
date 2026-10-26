# Build prompt: Ridgeline (Rwanda)

Prompt v1, 2026-10-26. Repo: `benjamingjoel2/rwanda`. The brief is at `brand/BRIEF.md` in this repo. Read it first: it holds the research, the sources and every fact that still needs verifying.

**Name note:** the assigned name "Thousand Hills" was already in use by Rwandan operators, so this brand is **Ridgeline** until the owner confirms (see BRIEF section 1). Because the name may still change, it must live only in `site.config.json`.

---

## 1. What the brand is

You are building the website for **Ridgeline**, a tailor-made travel specialist for **Rwanda (RW)**. The business is enquiry-led: **no prices and no booking engine.** Every page leads to the trip planner, the enquiry form or WhatsApp.

**Positioning:** *For travellers who want more than one hour with the gorillas: Rwanda planned along its ridges, from the volcanoes to Nyungwe, Kivu and Akagera, at walking pace and with Kigali's context.*

**Brand story** (use it in full on About, and an excerpt on Home):

> Stand on the Congo-Nile Divide in Nyungwe after rain and you can watch the water choose. On one side it runs down to Lake Kivu and, in the end, the Congo. On the other it starts the long journey to the Nile. Rwanda is built on lines like that one: ridges with a church and a market on top, terraces of tea and beans cut down their sides, mist lying in the valleys until mid-morning.
>
> We named the company after the ridgeline because it is how Rwanda is lived and how we plan it. Most visitors fly in for one hour with the mountain gorillas and leave. We plan along the high ground instead: the bamboo slopes of the Virunga volcanoes, Nyungwe's canopy, the slow shore of Lake Kivu, and the lower plains of Akagera, where lions and rhino have returned.
>
> We start in Kigali, at the memorial, because the country asks you to. We book the trackers, the coffee washing station and the women painting imigongo in black, ochre and white. And we leave an afternoon on a ridge with nothing scheduled.

Put a `verify()` flag on the watershed claim, the lion and rhino reintroductions and the imigongo cooperative until a specialist signs them off.

**Voice:**
- **Respectful.** Rwanda's history is present; treat it with care and never as a hook.
- **Unhurried.** Give each place its nights and say why.
- **Precise.** Altitude, hours, fitness and rules the traveller can plan with.
- **Banned words:** Land of a Thousand Hills (as a tagline), Switzerland of Africa, Africa's success story, dark tourism, gorillas-in-the-mist puns, selfie, hidden gem, breathtaking, unforgettable, bucket list, once in a lifetime, untouched, tribe.

Sample headlines:
- "One hour with the gorillas. Ten days with the country."
- "The rain decides on the ridge: Congo or Nile."
- "Kigali first, and slowly."

**Currencies:** USD is primary (park and permit fees are set in USD). GBP and EUR are display options, used only in the planner's budget-band step. No trip or stay prices anywhere. Permit fees appear only in the FAQ, quoted from `FACTS-TO-VERIFY.md` with the date checked.

## 2. Stack

Follow the pattern of `/home/user/greece` and `/home/user/sri-lanka` (read both READMEs). Do **not** use Next.js.

### Build
- A dependency-free Node (18.17+) static site generator.
- `build.mjs` renders `src/pages/*.mjs` with the data into plain HTML/CSS in `dist/`.
- Dev dependencies are allowed only for the checks (Playwright, axe-core).
- Scripts: `npm run build`, `npm run dev`, `npm run serve`, `npm run check:fast`, `npm run check`.

### `site.config.json`, the only place for:
- `brand`: name, shortName, tagline, positioning, nameStory, copyright year.
  - **The brand name lives only here.** The build fails if "Ridgeline" (or the old "Thousand Hills") appears hard-coded anywhere in `src/`.
- `contact`: email, phone, WhatsApp, address, hours, and a licence line. **All are `[PLACEHOLDER]`.**
- `enquiry.endpoint`
- `analytics`: `{ "provider": "" | "plausible" | "ga4" | "vercel", "id": "" }`
- `site.url`, `site.basePath`
- `palette`, `contrastPairs`, `fonts`, `currencies`

### `src/data/*.json`, all content
No copy is hard-coded in templates, so a later TravelPorts migration is a data move.

| File | Holds |
|---|---|
| `destinations.json` | The 9 destinations: intro, best for, season by month, altitude, how long, getting there, linked experiences and routes, photo keys, `advisory` note |
| `experiences.json` | The 10 experiences, with fitness, minimum age and rules |
| `routes.json` | The 4 trip-planner routes |
| `ridge.json` | The Ridge: pre-sampled elevation profiles (west–east and north), stop coordinates and altitudes, packing and air notes, source and date |
| `calendar.json` | Rules for Umuganda, Kwibuka, public holidays, Kwita Izina and the rains, each with a source URL and `verify` flag |
| `stays.json` | Stays. Every entry is `placeholder: true` |
| `faq.json`, `journal.json` | FAQ and journal content |

### `photos.json`, an Unsplash registry until real photos exist
- Hotlink `images.unsplash.com` with a responsive `srcset`.
- Accept a photo only if the photographer's own Unsplash **location tag** names the place, and store that tag verbatim.
- Free Unsplash License only, never Unsplash+.
- Every photo has a visible credit, and `/credits/` lists them all.
- If a place has no verified photo, show an imigongo-geometry panel labelled "Illustration". Never show somewhere else (Ugandan or Congolese gorillas are not Rwandan ones).
- Photo direction: mist on terraces, bamboo, forest light, Kivu at dusk, Akagera's lakes, Kigali streets and studios. No gorilla close-up "selfies", no images from inside memorials, no posed "village" shots.

### `FACTS-TO-VERIFY.md`
- Start from BRIEF section 8: visas and the EATV, gorilla permit price and rules, Ebola screening, FCDO Rusizi advice, Umuganda, Kwibuka, Kwita Izina, plastic bag ban, Akagera reintroductions, Nyungwe, the watershed, seasons, yellow fever, the imigongo cooperative.
- Record where each fact is used, its official source link, and the date it was checked.
- Pages show inline `verify()` flags until each fact is signed off.

### Check scripts
- WCAG AA contrast for every `contrastPairs` entry. The check fails below 4.5:1.
- An internal link check over `dist/`.
- An axe-core audit of every page at 375px and 1280px.
- A brand-name lint.
- A font-size lint: Libre Caslon Display is never used below 32px.

## 3. Design

### Palette
Emit the palette as CSS custom properties `--c-<token>`. Never hard-code hex values in CSS or templates.

| Token | Hex | Role |
|---|---|---|
| `cream` | `#F4ECDD` | Page ground |
| `imigongo` | `#1B1715` | Text, header, dark bands, footer, geometric fills |
| `ochre` | `#9E3B26` | Lead accent: buttons, links, focus ring on light, geometric bands |
| `clay` | `#DDA47C` | Accent **on `imigongo` only**: geometric lines, markers, display words, focus ring on dark |
| `kaolin` | `#E6D9C3` | Alternate section ground, cards |
| `smoke` | `#5E554D` | Secondary text, hairlines |

`contrastPairs` (text/ground):
- imigongo/cream 15.16
- imigongo/kaolin 12.78
- ochre/cream 5.76
- ochre/kaolin 4.85
- smoke/cream 6.21
- smoke/kaolin 5.23
- cream/imigongo 15.16
- cream/ochre 5.76
- clay/imigongo 8.20
- kaolin/imigongo 12.78

Forbidden pairs: clay on cream or kaolin; ochre or smoke on imigongo; clay on ochre. Text over photos sits on an imigongo scrim of at least 65%, tested against pure white.

### Fonts (assigned)
- **Libre Caslon Display** for display: 400 only, 32px and above, sentence case, tight leading. The wordmark is Libre Caslon Display caps with wide tracking.
- **Nunito Sans** for text and UI: 400, 600 and 700. Labels and tags are Nunito Sans 700 caps with +0.08em tracking.
- Load from Google Fonts with `display=swap` and preconnect, and preload Libre Caslon Display. **No third font.**

### Design references (primary first)
Use the design patterns only. **Never copy text, photos, logos, icons or code.**
- **Primary: wildernessdestinations.com.** Full-bleed cinematic hero with one large statement and a short subline, a clean sticky header with a mega menu (Destinations, Experiences, Journeys, About) and a strong "Enquire" button, long editorial scrolls alternating full-width images with short text blocks, destination tiles with overlaid titles, an interactive map section, and a deep multi-column footer.
- **Secondary: andbeyond.com.** Trip-idea cards with nights, places and a highlight line; destination cards in a scrolling row; a prominent "Plan your trip" path; the request-a-call-back pattern (here, WhatsApp).
- Wilderness's impact and statistics bands must be replaced with verified facts from `FACTS-TO-VERIFY.md` or left out: never invent numbers.

### House rules
- Full-width bands; text blocks left-aligned with a max line length of 68ch.
- No invented credibility: no testimonials, awards, press logos, review scores or "years of experience".

### Don't reuse sibling signature moves
- No north-to-south scroll map (Malawi), no walking-morning scroll (Zambia), no Bwindi sector chooser or bird list (Uganda sibling).
- No giant word along the bottom of the hero, no `(01)` mono labels, no fixed side tab, no expanding image panels.

### Motif
- Imigongo-inspired geometry (zigzags, lozenges, stepped spirals) as thin SVG bands and dividers, in ochre on cream or clay on imigongo. Credit the cooperative in the footer and on `/credits/` once licensed; until then label it `[PLACEHOLDER: motif licence]`.
- **No** gorilla cartoons, borrowed "tribal" patterns, or genocide imagery.

### Two signature features (unique to this brand)

**The Ridge (`/the-ridge/`)**
- An SVG elevation profile drawn from `ridge.json`: west to east from Lake Kivu (Karongi) over the Congo-Nile Divide and Nyungwe to Huye, Kigali and Akagera, plus a second profile north to the Virunga volcanoes.
- The profile data is pre-sampled once by `scripts/sample-ridge.mjs` from public-domain SRTM tiles (or entered from verified spot heights) and committed; the build reads only the JSON.
- Each stop shows altitude, a one-line "what the air feels like", what to pack, and the effort of the main walk or trek.
- At the divide, a droplet splits: one path to "Congo", one to "Nile" (`verify` the watershed text). Reduced motion shows both arrows static.
- Without JS it renders as the static profile plus a table of stops. "Plan along the ridge" pre-fills route 1.

**The Rwandan Calendar (`/calendar/`)**
- An 18-month calendar computed at build time from `calendar.json` rules: Umuganda (last Saturday of each month, morning), Kwibuka (from 7 April), public holidays, Kwita Izina (date set yearly; shown as "to be announced" until verified), and the long and short rains.
- Each marker has a text label and a short note on what changes for visitors. Nothing is shown by colour alone.
- The planner reads the same rules: if an arrival day or long transfer falls on an Umuganda morning, it shows a gentle notice and suggests an alternative.
- Without JS it is a month-by-month list.

## 4. Pages and content

- **Home:**
  - full-bleed hero (terraced ridges in mist, or bamboo at Volcanoes)
  - the positioning line
  - the brand story excerpt
  - destinations tiles and a map of Rwanda with the ridge line drawn across it
  - signature experiences
  - the four routes
  - teasers for The Ridge and the Rwandan Calendar
  - "how we plan" in 4 steps, with no stats
  - a closing call to action
- **Destinations:** an index and 9 pages:
  - Kigali
  - Bugesera
  - Volcanoes National Park & Musanze
  - The twin lakes, Burera & Ruhondo
  - Gishwati-Mukura
  - Lake Kivu, Rubavu to Karongi
  - Nyungwe
  - Huye & Nyanza
  - Akagera

  Each page has: intro, best for, the season strip, altitude, how long, getting there (no timetables; Nyungwe by road, never via Kamembe), experiences, routes, placeholder stays, verified photos, an advisory note where relevant, and a call to action.
- **Experiences:** an index and 10 pages:
  - Mountain gorilla trek
  - Golden monkey trek
  - Dian Fossey's grave and Karisoke
  - Mount Bisoke's crater lake
  - Nyungwe's canopy walkway and chimpanzees
  - Akagera by boat and game drive
  - The Congo Nile Trail
  - The Kigali Genocide Memorial
  - An imigongo workshop
  - A coffee washing station on Lake Kivu
- **Routes:** an index and 4 pages. Each pre-fills the planner.
  1. The ridgeline, west to east (11–13 nights)
  2. Gorillas and the lakes (6–7)
  3. Primates and plains (9–10)
  4. Slow Rwanda (12–14)
- **Trip planner (`/plan/`):** a multi-step enquiry:
  1. destinations or a route
  2. month and dates (with Calendar notices)
  3. nights
  4. party (adults, children and ages; flags the gorilla minimum age)
  5. pace and fitness
  6. interests (primates, walking, wildlife, culture, coffee, birds)
  7. an optional budget band per person (USD, switchable to GBP/EUR)
  8. contact details

  It validates each step, saves progress in `localStorage`, and posts to `enquiry.endpoint`.
- `/the-ridge/` and `/calendar/`
- **Journal:** an index and 3 posts:
  - "Why two nights at Volcanoes, not one"
  - "Visiting the memorials: what to expect"
  - "Nyungwe or Akagera? Doing both"
- **About:** the full story and the name story. No invented team bios.
- FAQ, built from the topics in BRIEF section 7. Answers only restate facts listed in `FACTS-TO-VERIFY.md`.
- Contact / enquire
- Privacy, terms, cookies, credits, 404

## 5. From day one (phase 1, not phase 5)

1. **The enquiry form posts to `enquiry.endpoint`.**
   - It uses `fetch`, with an ordinary POST as the no-JS fallback.
   - It has inline validation, an error summary, a live-region status and a honeypot.
   - **If the endpoint is empty:**
     - the build prints a loud warning: `WARNING: enquiry.endpoint is empty. Enquiries open the visitor's email app and are NOT delivered.`
     - the form falls back to `mailto:` to `contact.email`, and the page says so
     - the README and config carry a `TODO`
   - The planner, the routes, The Ridge and the Calendar all feed this same form.
2. **Analytics slot.** Inject the snippet only when `analytics.id` is set, and only after consent when the provider sets cookies (GA4). Plausible and Vercel Analytics need no banner. Every brand gets its own ID.
3. **Legal pages** `/privacy/`, `/terms/` and `/cookies/`, linked in the footer.
   - Draft them for UK GDPR / PECR and EU GDPR, with a clause on Rwanda's Law No. 058/2021 on the protection of personal data and privacy (`verify`) for data shared with Rwandan suppliers.
   - Every company detail (legal name, company number, address, the ground operator's RDB licence, ATOL / insolvency protection) is `[PLACEHOLDER]` and marked "Draft: needs legal review".

## 6. Build phases: stop for review after each

1. **Layout, header, footer and design tokens.**
   - `site.config.json` with the palette, fonts, contrast pairs, endpoint and analytics.
   - The sticky header with mega menu and "Enquire" button, the full-screen mobile menu, and the footer (with legal links).
   - The imigongo geometry bands, and the photo frame and credit component.
   - The check scripts and `vercel.json`.

   **Stop for review.**
2. **Homepage**, every section listed in part 4. **Stop for review.**
3. **Trip planner.**
   - The multi-step planner, tested end to end: an enquiry actually arrives, or report a blocker.
   - Route and Ridge pre-fill; Calendar notices.

   **Stop for review.**
4. **Detail pages and journal.**
   - Destinations, experiences, routes, The Ridge, the Calendar, journal, FAQ, About, legal, credits.
   - `FACTS-TO-VERIFY.md` complete.

   **Stop for review.**
5. **Polish, accessibility, SEO and Lighthouse.**
   - Metadata, canonical URLs, sitemap, robots.
   - JSON-LD `TravelAgency`, leaving out placeholder fields rather than inventing them.
   - An OG image.
   - A clean axe audit and **mobile Lighthouse 90+**.
   - `prefers-reduced-motion` respected, and the site works without JS.
   - A README "Before launch" list of every placeholder.

   **Stop for review.**

Accessibility from phase 1:
- a skip link and visible focus (ochre on light, clay on dark, 2px plus offset)
- 44px touch targets
- landmarks, labelled controls and live regions; the mega menu is keyboard operable
- no information carried by colour alone
- lazy-loaded images with width and height, except the hero
- no horizontal scroll at 360px

## 7. Final step: host on Vercel

1. Make sure `npm run build` succeeds and writes `dist/`.
2. Add `vercel.json`:
   - `"buildCommand": "npm run build"`, `"outputDirectory": "dist"`, `"cleanUrls": true`, trailing slashes
   - long caching for the hashed assets
   - basic security headers
3. Push to the GitHub repo **`benjamingjoel2/rwanda`** on `main`.
4. In Vercel (team **"Benjamin - Sevo"**), import the repo with framework preset **Other**, and deploy.
5. On the live `*.vercel.app` URL, check every page, check for broken links, and submit the enquiry form.
6. Put the URL in `site.config.json` (`site.url`) and the README, then push again to redeploy.

## Design fidelity: match the primary reference closely (overrides any looser wording above)
The first design reference listed above is the **primary reference**. The site must read as the same design as that site when compared side by side: header and nav, hero composition, section order and rhythm, grid and containers, type scale (mapped onto this brand's fonts), cards, buttons, footer and motion. Before building, open the primary reference with Playwright, screenshot it at 1440 and 390 wide, and measure its type sizes, spacing and container widths. If the primary reference will not load, use the second reference as primary and say so. Then compare your own screenshots against it after every phase and fix the differences. Keep this brand's own name, palette, fonts, copy and photos. Never copy the reference's text, photos, logos, icons or source code: rebuild the design yourself. Full rules are in brands-pipeline/REF-MATCH.md in benjamingjoel2/jarvis.

Every page in the list above must be built completely with real content: no empty sections, no lorem ipsum. Before you finish, open every page with Playwright at both widths and confirm there are no console errors, no broken images or links, and no horizontal scroll on mobile.
