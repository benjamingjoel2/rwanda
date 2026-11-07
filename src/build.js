#!/usr/bin/env node
/* Virunga Journeys — static site generator. No dependencies: `node src/build.js` writes ./dist.
   Content lives in src/content/<lang>.js (same shape in every language), brand in site.config.js,
   image metadata in src/data/images.json (made by scripts/images.js). */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cfg = require('../site.config.js');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const IMAGES = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/images.json'), 'utf8'));
const LANGS = cfg.locales.map(l => l.code);
const C = {};
for (const l of LANGS) C[l] = require(`./content/${l}.js`);
// alt text for every photo, per language: { key: { en, fr, de, es } }
const ALT = JSON.parse(fs.readFileSync(path.join(__dirname, 'content/alt.json'), 'utf8'));
for (const l of LANGS) C[l].alt = Object.fromEntries(Object.entries(ALT).map(([k, v]) => [k, v[l]]));

/* ---------------- helpers ---------------- */
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = esc;
const strip = s => String(s ?? '').replace(/<[^>]+>/g, '');
const hash = buf => crypto.createHash('sha1').update(buf).digest('hex').slice(0, 10);
const loc = code => cfg.locales.find(l => l.code === code);
const href = (lang, p) => (loc(lang).prefix + p) || '/';
const abs = (lang, p) => cfg.siteUrl + href(lang, p);
const fmtDate = (lang, d, o) => d.toLocaleDateString(lang === 'en' ? 'en-GB' : lang, Object.assign({ timeZone: 'Africa/Kigali' }, o));
const cls = (...a) => a.filter(Boolean).join(' ');
// Tarn-style headline: first sentence upright, the rest in italics
const emTail = s => { if (/<em>/.test(s)) return s; const i = s.search(/[.!?]\s/); return i < 0 ? s : `${s.slice(0, i + 1)} <em>${s.slice(i + 2)}</em>`; };

const ICON = {
  ne: '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 11L11 3M5 3h6v6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  right: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h9M6.5 2.5L10 6l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
  down: '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
};
const logoMark = `<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" fill="var(--ochre)"/><path d="M0 22 L8 10 L16 22 L24 10 L32 22 V32 H0Z" fill="var(--imigongo)"/><path d="M0 27 L8 15 L16 27 L24 15 L32 27" fill="none" stroke="var(--cream)" stroke-width="1.6"/></svg>`;

function btn(text, link, variant = '', extra = '') {
  return `<a class="btn ${variant}" href="${attr(link)}"${extra}><span>${text}</span></a>`;
}
const tlink = (text, link) => `<a class="tlink" href="${attr(link)}">${text}${ICON.right}</a>`;

/* imigongo zigzag band (section edge) */
let zid = 0;
function zz(variant = '', flip = false) {
  zid++;
  const id = 'zz' + zid;
  return `<svg class="zz ${variant}" viewBox="0 0 240 18" preserveAspectRatio="none" aria-hidden="true" focusable="false"${flip ? ' style="transform:scaleY(-1)"' : ''}><defs><pattern id="${id}" width="24" height="18" patternUnits="userSpaceOnUse"><path d="M0 18L12 4 24 18Z" fill="currentColor"/><path d="M5 18L12 10 19 18" fill="none" stroke="var(--ochre)" stroke-width="2"/></pattern></defs><rect width="240" height="18" fill="url(#${id})"/></svg>`;
}

/* smooth ridge path (deterministic) */
function ridgePath(seed, base, amp, w = 1600, h = 600, n = 9) {
  let s = seed;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push([(w / n) * i, base - amp * (0.35 + 0.65 * rnd())]);
  let d = `M0 ${h} L0 ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], mx = (x0 + x1) / 2;
    d += ` C${mx.toFixed(1)} ${y0.toFixed(1)} ${mx.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return d + ` L${w} ${h} Z`;
}
function zigPath(w, h, step, pad = 2) {
  let d = `M0 ${h - pad}`; let up = true;
  for (let x = step / 2; x <= w + step; x += step / 2) { d += ` L${x} ${up ? pad : h - pad}`; up = !up; }
  const len = Math.round((w / (step / 2)) * Math.hypot(step / 2, h - 2 * pad)) + 40;
  return { d, len };
}

/* responsive picture */
function pic(lang, key, o = {}) {
  const im = IMAGES[key];
  if (!im) throw new Error(`Missing image "${key}" (lang ${lang})`);
  const alt = o.decorative ? '' : (C[lang].alt[key] ?? C.en.alt[key]);
  if (alt === undefined) throw new Error(`Missing alt text for "${key}" in ${lang}`);
  const sizes = o.sizes || '100vw';
  const set = f => im.files[f].map(([w, u]) => `${u} ${w}w`).join(', ');
  const fallback = im.files.webp.find(([w]) => w >= 800) || im.files.webp[im.files.webp.length - 1];
  const eager = !!o.eager;
  return `<picture><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}"><img src="${fallback[1]}" srcset="${set('webp')}" sizes="${sizes}" width="${im.w}" height="${im.h}" alt="${attr(alt)}" ${eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"'}${im.focal ? ` style="object-position:${im.focal}"` : ''}></picture>`;
}
function ph(lang, key, o = {}) {
  return `<div class="${cls('ph', o.cls, o.zoom !== false && 'zoom', o.reveal && 'rv-img')}">${pic(lang, key, o)}</div>`;
}
function preloadFor(key, sizes = '100vw') {
  const im = IMAGES[key];
  return `<link rel="preload" as="image" type="image/avif" imagesrcset="${im.files.avif.map(([w, u]) => `${u} ${w}w`).join(', ')}" imagesizes="${sizes}" fetchpriority="high">`;
}

/* ---------------- shared chrome ---------------- */
const PLACES = ['kigali', 'volcanoes', 'nyungwe', 'akagera', 'lake-kivu', 'gishwati-mukura'];
const place = (lang, slug) => C[lang].places.find(p => p.slug === slug);

function langSwitch(lang, p) {
  return `<nav class="langs" aria-label="${attr(C[lang].ui.language)}">${cfg.locales.map((l, i) =>
    `${i ? '<span aria-hidden="true">·</span>' : ''}<a href="${href(l.code, p)}" hreflang="${l.hreflang}" lang="${l.hreflang}"${l.code === lang ? ' aria-current="true"' : ''}><abbr title="${attr(l.name)}" style="text-decoration:none">${l.label}</abbr></a>`).join('')}</nav>`;
}

function header(lang, p) {
  const u = C[lang].ui, n = u.nav;
  const cur = x => (p === x ? ' aria-current="page"' : '');
  const mega = PLACES.map(s => { const pl = place(lang, s); return `<li><a href="${href(lang, `/${s}/`)}">${ph(lang, pl.card, { cls: 'r45', sizes: '16vw', zoom: true })}<strong>${pl.name}</strong><small>${pl.region}</small></a></li>`; }).join('');
  return `<header class="hdr"><div class="hdr__in">
<a class="logo" href="${href(lang, '/')}" aria-label="${attr(cfg.brand.name)} — ${attr(n.home)}"><span>${cfg.brand.name}</span></a>
<nav class="nav" aria-label="${attr(u.mainNav)}"><ul>
<li class="has-mega"><button type="button" aria-expanded="false" aria-controls="mega">${n.destinations}</button><ul class="mega" id="mega">${mega}</ul></li>
<li><a href="${href(lang, '/gorilla-trekking/')}"${cur('/gorilla-trekking/')}>${n.gorilla}</a></li>
<li><a href="${href(lang, '/journeys/')}"${cur('/journeys/')}>${n.journeys}</a></li>
<li><a href="${href(lang, '/calendar/')}"${cur('/calendar/')}>${n.calendar}</a></li>
<li><a href="${href(lang, '/history/')}"${cur('/history/')}>${n.history}</a></li>
</ul></nav>
<div class="hdr__side">
${langSwitch(lang, p)}
${btn(n.enquire, href(lang, '/enquire/'), 'btn--line enq')}
<button class="burger" type="button" aria-expanded="false" aria-controls="mnav"><span class="sr">${u.menu}</span><i></i></button>
</div></div></header>
<div class="mnav" id="mnav" inert>
<ul>${[['/gorilla-trekking/', n.gorilla], ['/journeys/', n.journeys], ['/stays/', n.stays], ['/calendar/', n.calendar], ['/history/', n.history], ['/journal/', n.journal], ['/about/', n.about], ['/enquire/', n.enquire]].map(([h, t]) => `<li><a href="${href(lang, h)}">${t}</a></li>`).join('')}</ul>
<div><p class="label" style="margin-bottom:.5rem">${n.destinations}</p><ul class="sub">${PLACES.map(s => `<li><a href="${href(lang, `/${s}/`)}">${place(lang, s).name}</a></li>`).join('')}</ul></div>
${langSwitch(lang, p)}
</div>`;
}

function footer(lang, p) {
  const u = C[lang].ui, n = u.nav, f = u.footer, a = cfg.address;
  const [w1, ...wr] = cfg.brand.name.split(' ');
  return `<footer class="ftr">
${zz('zz--ochre')}
<p class="ftr__word" aria-hidden="true">${w1}${wr.length ? ` <em>${wr.join(' ')}</em>` : ''}</p>
<div class="ftr__grid">
<div class="ftr__col"><h2>${f.write}</h2><p><a href="mailto:${cfg.brand.email}">${cfg.brand.email}</a></p><address>${a.venue}<br>${a.street}<br>${a.locality}, ${u.countryName}</address></div>
<div class="ftr__col"><h2>${f.plan}</h2><ul>${[['/gorilla-trekking/', n.gorilla], ['/journeys/', n.journeys], ['/stays/', n.stays], ['/calendar/', n.calendar], ['/history/', n.history], ['/journal/', n.journal], ['/about/', n.about], ['/enquire/', n.enquire]].map(([h, t]) => `<li><a href="${href(lang, h)}">${t}</a></li>`).join('')}</ul></div>
<div class="ftr__col"><h2>${n.destinations}</h2><ul>${PLACES.map(s => `<li><a href="${href(lang, `/${s}/`)}">${place(lang, s).name}</a></li>`).join('')}</ul></div>
<div class="ftr__col"><h2>${f.small}</h2><p>© ${new Date().getFullYear()} ${cfg.brand.legalName}</p><ul>${[['/privacy/', f.privacy], ['/booking-terms/', f.terms], ['/cookies/', f.cookies], ['/credits/', f.credits]].map(([h, t]) => `<li><a href="${href(lang, h)}">${t}</a></li>`).join('')}</ul><div style="margin-top:1rem">${langSwitch(lang, p)}</div></div>
</div>
<p class="ftr__credit">${f.imigongo}</p>
</footer>`;
}

function orgLd(lang) {
  const a = cfg.address;
  return {
    '@type': 'TravelAgency', '@id': cfg.siteUrl + '/#org', name: cfg.brand.name, url: cfg.siteUrl + '/', email: cfg.brand.email,
    description: strip(C[lang].home.metaDescription),
    address: { '@type': 'PostalAddress', name: a.venue, streetAddress: a.street, addressLocality: a.locality, addressRegion: a.region, addressCountry: a.countryCode },
    geo: { '@type': 'GeoCoordinates', latitude: a.geo.lat, longitude: a.geo.lng },
    areaServed: { '@type': 'Country', name: 'Rwanda' }, knowsLanguage: LANGS,
  };
}

let CSS = '', JS_URL = '';
function layout(lang, p, o) {
  const l = loc(lang), u = C[lang].ui;
  const title = o.title === cfg.brand.name ? o.title : `${strip(o.title)} · ${cfg.brand.name}`;
  const crumbs = o.crumbs || [];
  const ld = { '@context': 'https://schema.org', '@graph': [orgLd(lang), { '@type': 'WebPage', '@id': abs(lang, p), url: abs(lang, p), name: strip(o.title), description: strip(o.description), inLanguage: l.hreflang, isPartOf: { '@type': 'WebSite', name: cfg.brand.name, url: cfg.siteUrl + '/' }, publisher: { '@id': cfg.siteUrl + '/#org' } }] };
  if (crumbs.length) ld['@graph'].push({ '@type': 'BreadcrumbList', itemListElement: [[u.nav.home, '/'], ...crumbs].map(([n, h], i) => ({ '@type': 'ListItem', position: i + 1, name: strip(n), item: abs(lang, h) })) });
  if (o.ld) ld['@graph'].push(...o.ld);
  const ogImg = o.ogImage && IMAGES[o.ogImage] ? cfg.siteUrl + (IMAGES[o.ogImage].files.webp.find(([w]) => w >= 1200) || IMAGES[o.ogImage].files.webp.slice(-1)[0])[1] : '';
  const alts = o.noAlternates ? '' : cfg.locales.map(x => `<link rel="alternate" hreflang="${x.hreflang}" href="${abs(x.code, p)}">`).join('') + `<link rel="alternate" hreflang="x-default" href="${abs('en', p)}">`;
  return `<!doctype html>
<html lang="${l.hreflang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${attr(strip(o.description))}">
${o.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${abs(lang, p)}">`}
${alts}
<meta property="og:type" content="website"><meta property="og:site_name" content="${attr(cfg.brand.name)}"><meta property="og:title" content="${attr(strip(o.title))}"><meta property="og:description" content="${attr(strip(o.description))}"><meta property="og:url" content="${abs(lang, p)}"><meta property="og:locale" content="${l.ogLocale}">${cfg.locales.filter(x => x.code !== lang).map(x => `<meta property="og:locale:alternate" content="${x.ogLocale}">`).join('')}${ogImg ? `<meta property="og:image" content="${ogImg}">` : ''}<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${cfg.palette.imigongo}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
${o.preload || ''}
<link rel="preload" href="/assets/fonts/spectral-200.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/spectral-400.woff2" as="font" type="font/woff2" crossorigin>
<style>${CSS}</style>
<script src="${JS_URL}" defer></script>
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
</head>
<body class="${(o.solid ?? !o.body.includes('class="hero ')) ? 'is-solid' : ''}">
<a class="skip" href="#main">${u.skip}</a>
${header(lang, p)}
<main id="main">
${o.body}
</main>
${footer(lang, p)}
</body>
</html>`;
}

/* ---------------- components ---------------- */
function crumbsHtml(lang, list) {
  const u = C[lang].ui;
  return `<nav class="crumbs" aria-label="${attr(u.breadcrumb)}"><a href="${href(lang, '/')}">${u.nav.home}</a>${list.map(([n, h], i) => `<span aria-hidden="true">/</span>${i === list.length - 1 ? `<span aria-current="page">${n}</span>` : `<a href="${href(lang, h)}">${n}</a>`}`).join('')}</nav>`;
}
function pageHero(lang, o) {
  return `<section class="ihero">
<div class="ihero__top">${crumbsHtml(lang, o.crumbs)}${o.chips ? `<p class="meta">${o.chips.join(', ')}</p>` : ''}
<div class="ihero__row"><h1>${emTail(o.title)}</h1><div class="ihero__side">${o.intro ? `<p>${o.intro}</p>` : ''}${o.ctas ? `<div class="hero__ctas">${o.ctas}</div>` : ''}</div></div></div>
${ph(lang, o.img, { eager: true, zoom: false, cls: 'ihero__img', sizes: 'calc(100vw - 48px)' })}
${o.facts ? `<dl class="kvbar" style="--n:${o.facts.length}">${o.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>` : ''}
</section>`;
}
function plainTop(lang, o) {
  return `<section class="ptop">${crumbsHtml(lang, o.crumbs)}<h1>${o.title}</h1>${o.intro ? `<p class="lead lead--muted" style="font-size:clamp(1.2rem,2vw,1.6rem)">${o.intro}</p>` : ''}</section>`;
}
function secHead(o) {
  return `<div class="sec-head rv"><div>${o.label ? `<span class="label ${o.muted === false ? '' : 'label--muted'}">${o.label}</span>` : ''}<h2${o.id ? ` id="${o.id}"` : ''}>${o.title}</h2>${o.text ? `<p class="muted" style="margin-top:1rem;max-width:36rem">${o.text}</p>` : ''}</div>${o.link || ''}</div>`;
}
function faqHtml(lang, f, dark) {
  return `<section class="section wrap ${dark ? 'dark' : 'kaolin'}" aria-labelledby="faq-h"><div class="faq">
<div class="rv"><span class="label label--muted">${f.label}</span><h2 id="faq-h" style="margin-top:1rem">${f.title}</h2>${f.text ? `<p class="muted" style="margin-top:1rem;max-width:22rem">${f.text}</p>` : ''}${f.link ? `<p style="margin-top:1.5rem">${f.link}</p>` : ''}</div>
<div>${f.items.map(([q, a], i) => `<details><summary><small>${String(i + 1).padStart(2, '0')}</small><span>${q}</span></summary><div class="ans">${[].concat(a).map(x => `<p>${x}</p>`).join('')}</div></details>`).join('')}</div>
</div></section>`;
}
function ctaBanner(lang, o) {
  const u = C[lang].ui;
  return `<section class="section wrap teaser"><div class="teaser__in"><div><p class="label">${u.nav.enquire}</p><h2 class="rv">${emTail(o.title)}</h2></div><div class="rv"><p>${C[lang].enquire.intro}</p><p style="margin-top:1.5rem">${btn(o.button, href(lang, '/enquire/'))}</p></div></div></section>`;
}
function placeCards(lang, slugs, variant = 'hscroll') {
  const u = C[lang].ui;
  return `<div class="${variant}" data-carousel>${slugs.map(s => { const p = place(lang, s); return `<a class="tcard rv" href="${href(lang, `/${s}/`)}"><div class="tcard__media">${ph(lang, p.card, { cls: 'r45', sizes: '(min-width:1100px) 25vw, (min-width:700px) 42vw, 78vw' })}<div class="tcard__cap"><h3>${p.name}</h3><i>${p.region}</i></div></div><div class="tcard__foot"><i>${p.strapline}</i><span>${u.explore} →</span></div></a>`; }).join('')}</div>`;
}
function carouselNav(lang) {
  const u = C[lang].ui;
  return `<div class="cnav"><button type="button" class="cbtn" data-dir="-1" aria-label="${attr(u.prev)}">←</button><button type="button" class="cbtn" data-dir="1" aria-label="${attr(u.next)}">→</button></div>`;
}
function journeyCard(lang, j) {
  const u = C[lang].ui;
  return `<a class="tcard rv" href="${href(lang, `/journeys/#${j.id}`)}"><div class="tcard__media">${ph(lang, j.img, { cls: 'r43', sizes: '(min-width:900px) 50vw, 100vw' })}<div class="tcard__cap"><h3>${j.title}</h3><i>${j.route}</i></div></div><div class="tcard__foot"><i>${j.nights} ${u.nights} · ${j.months}</i><span>${u.viewJourney} →</span></div></a>`;
}
function journalCards(lang, posts) {
  return `<div class="cols" style="--n:3">${posts.map(p => `<article class="post rv"><a href="${href(lang, `/journal/${p.slug}/`)}" style="text-decoration:none;display:block">${ph(lang, p.img, { cls: 'r43', sizes: '(min-width:900px) 33vw, 100vw' })}<div class="post-meta"><span>${p.kicker}</span><span>${p.read}</span></div><h3>${p.title}</h3></a></article>`).join('')}</div>`;
}
function rowsHtml(lang, items) {
  return `<div class="rows">${items.map(x => `<article class="row rv"><div>${x.label ? `<span class="label">${x.label}</span>` : ''}<h3>${x.title}</h3></div>${x.img ? ph(lang, x.img, { sizes: '(min-width:900px) 300px, 80vw' }) : '<div></div>'}<div><p>${x.text}</p>${x.link ? `<p style="margin-top:1rem">${tlink(x.link[0], href(lang, x.link[1]))}</p>` : ''}</div></article>`).join('')}</div>`;
}
function dayHtml(lang, g, compact) {
  const steps = compact ? g.day.steps.filter((_, i) => [1, 2, 4, 6, 7, 8].includes(i)) : g.day.steps;
  return `<section class="section wrap" aria-labelledby="day-h">
${secHead({ label: g.day.label, title: g.day.title, id: 'day-h', text: g.day.text, link: compact ? tlink(C[lang].ui.readExplainer, href(lang, '/gorilla-trekking/')) : '' })}
<div class="day">
<div class="day__side"><div class="day__photo">${ph(lang, compact ? 'gorilla-2' : 'golden-monkey', { zoom: false, sizes: '(min-width:1000px) 42vw, 100vw' })}<p class="day__clock num" aria-hidden="true">${steps[0].time}</p><p class="day__now" aria-hidden="true">${steps[0].title}</p></div></div>
<ol class="day__list" style="list-style:none;padding:0">${steps.map(s => `<li class="step"><time>${s.time}</time><div><h3>${s.title}</h3><p>${s.text}</p></div></li>`).join('')}</ol>
</div></section>`;
}

/* calendar data (not language-specific) */
const SEASON = ['short', 'short', 'wet', 'wet', 'wet', 'dry', 'dry', 'dry', 'dry', 'wet2', 'wet2', 'short'];
const RAIN_MM = [77, 91, 114, 154, 88, 19, 11, 31, 67, 99, 113, 77]; // Kigali approx. monthly rainfall — verify (FACTS-TO-VERIFY.md)
function lastSaturday(y, m) { const d = new Date(Date.UTC(y, m + 1, 0, 8)); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 1) % 7)); return d; }
const BUILD = new Date();
function umugandaDates(n = 12) {
  const out = []; let y = BUILD.getUTCFullYear(), m = BUILD.getUTCMonth();
  for (let i = 0; out.length < n; i++) { const d = lastSaturday(y, m + i); if (d >= new Date(Date.UTC(BUILD.getUTCFullYear(), BUILD.getUTCMonth(), BUILD.getUTCDate()))) out.push(d); }
  return out;
}
function nextUmugandaText(lang) { return fmtDate(lang, umugandaDates(1)[0], { weekday: 'short', day: 'numeric', month: 'short' }); }
function seasonBadge(lang, s) { const u = C[lang].calendar.seasons; return { dry: ['s-dry', u.dry], wet: ['s-wet', u.longRains], wet2: ['s-wet2', u.shortRains], short: ['s-short', u.shortDry] }[s]; }
function yearBar(lang) {
  const ms = C[lang].ui.monthsShort;
  return `<div class="yearbar" role="img" aria-label="${attr(C[lang].calendar.yearbarLabel)}">${SEASON.map((s, i) => { const [c] = seasonBadge(lang, s); return `<div class="${c}" style="height:${40 + RAIN_MM[i] / 2}px">${ms[i]}</div>`; }).join('')}</div>
<div class="legend" style="margin-top:1rem">${['dry', 'short', 'wet'].map(s => { const [c, t] = seasonBadge(lang, s); return `<span><i class="${c}"></i>${t}</span>`; }).join('')}<span><i class="s-wet2"></i>${C[lang].calendar.seasons.shortRains}</span></div>`;
}

/* ---------------- pages ---------------- */
function pHome(lang) {
  const h = C[lang].home, u = C[lang].ui, g = C[lang].gorilla, S = C[lang].stays;
  const body = `
<section class="hero on-image">${ph(lang, h.hero.img, { eager: true, zoom: false })}
<div class="hero__in">
<div class="hero__meta"><p>${h.hero.place}</p><p>${h.idea.facts.time} <span data-kigali-time class="num">--:--</span>, ${h.idea.facts.altitude[1]}</p></div>
<div class="hero__row"><h1>${emTail(h.hero.title)}</h1><div class="hero__side"><p class="meta">${h.hero.tags.join(' · ')}</p><p>${h.hero.text}</p><div class="hero__ctas">${btn(h.hero.cta, href(lang, '/journeys/'), 'btn--light')}</div></div></div>
</div>
</section>

<section class="clear" aria-labelledby="clear-h"><div class="clear__stick">
<div class="clear__img">${ph(lang, 'volcanoes', { zoom: false, sizes: '100vw' })}</div>
<div class="clear__fog" aria-hidden="true"></div>
<p class="clear__hint" aria-hidden="true"><span></span>${h.clear.hint}</p>
<div class="clear__cap"><p class="meta">${h.clear.meta}</p><h2 id="clear-h">${emTail(h.clear.title)}</h2></div>
</div></section>

<section class="lift wrap" aria-labelledby="idea-h">
<h2 id="idea-h" class="sr">${h.idea.srTitle}</h2>
<div class="lift__grid">
<div class="lift__meta rv"><p>${h.idea.label}</p><p>${h.idea.facts.country[1]}, ${h.idea.facts.altitude[1]}</p><p>${u.tickerLabel}: <span data-next-umuganda>${nextUmugandaText(lang)}</span></p></div>
<div><p class="lift__lead rv">${emTail(h.idea.lead)}</p></div>
</div>
<dl class="stats">${h.stats.map(([n, l]) => `<div class="rv"><dt>${n}</dt><dd>${l}</dd></div>`).join('')}</dl>
</section>

<section class="section wrap where" aria-labelledby="where-h">
<div class="sec-head rv"><div><h2 id="where-h">${h.where.title}</h2><p class="muted" style="margin-top:1rem;max-width:32rem">${h.idea.text}</p></div>${carouselNav(lang)}</div>
${placeCards(lang, PLACES)}
</section>

${dayHtml(lang, g, true)}

<section class="section wrap" aria-labelledby="st-h">
<div class="sec-head rv"><div><p class="label">${u.nav.stays}</p><h2 id="st-h">${emTail(S.listTitle)}</h2></div>${tlink(u.seeStays, href(lang, '/stays/'))}</div>
<div class="pair">${[S.list[1], S.list[4]].map((s, k) => `<figure class="pair__${k} rv">${ph(lang, s.img, { sizes: '(min-width:900px) 50vw, 100vw' })}<figcaption>${s.text}</figcaption></figure>`).join('')}</div>
</section>

<section class="section wrap" aria-labelledby="jr-h">
${secHead({ label: h.journeys.label, title: h.journeys.title, id: 'jr-h', text: h.journeys.text, link: tlink(h.journeys.link, href(lang, '/journeys/')) })}
<div class="tgrid">${C[lang].journeys.list.slice(0, 2).map(j => journeyCard(lang, j)).join('')}</div>
</section>

<section class="section wrap kaolin" aria-labelledby="cal-h">
<div class="split split--wide"><div>${secHead({ label: h.calendar.label, title: h.calendar.title, id: 'cal-h' })}${yearBar(lang)}</div>
<div class="txt rv"><p>${h.calendar.text}</p><p>${tlink(h.calendar.link, href(lang, '/calendar/'))}</p></div></div>
</section>

<section class="section wrap dark" aria-labelledby="hist-h">
<div class="split"><div><p class="label">${h.history.label}</p><h2 id="hist-h" style="margin-top:1rem;max-width:14ch">${emTail(h.history.title)}</h2></div>
<div class="txt"><p class="rv" style="font-size:1.25rem;line-height:1.5">${h.history.text}</p><p>${tlink(h.history.link, href(lang, '/history/'))}</p></div></div>
</section>

${faqHtml(lang, { ...h.faq, link: tlink(u.nav.enquire, href(lang, '/enquire/')) })}

<section class="section wrap" aria-labelledby="jn-h">
${secHead({ label: h.journal.label, title: h.journal.title, id: 'jn-h', link: tlink(h.journal.link, href(lang, '/journal/')) })}
${journalCards(lang, C[lang].journal.posts)}
</section>

${reserveHtml(lang)}`;
  return layout(lang, '/', { title: cfg.brand.name, description: h.metaDescription, body, preload: preloadFor(h.hero.img), ogImage: h.hero.img });
}

function pPlace(lang, slug) {
  const p = place(lang, slug), u = C[lang].ui;
  const i = PLACES.indexOf(slug), next = place(lang, PLACES[(i + 1) % PLACES.length]);
  const gal = p.gallery;
  const body = `
${pageHero(lang, { img: p.img, crumbs: [[u.nav.destinations, `/${slug}/`], [p.name, `/${slug}/`]].slice(1), chips: p.chips, title: p.title || p.name, intro: p.intro, facts: p.facts })}
<section class="section wrap" aria-labelledby="pl-h"><div class="place-intro">
<div class="rv"><span class="label label--muted">${u.thePlace}</span><dl class="kv" style="margin-top:1.25rem">${p.kv.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl></div>
<div><h2 id="pl-h" class="sr">${p.name}</h2><p class="lead rv">${p.lead}</p><div class="prose rv" style="margin-top:1.5rem">${p.body.map(x => `<p>${x}</p>`).join('')}</div></div>
</div></section>
${gal && gal.length ? `<section class="wrap" aria-label="${attr(u.gallery)}"><div class="mosaic ${gal.length === 3 ? 'mosaic--3' : ''}">${gal.map((k, j) => ph(lang, k, { reveal: true, sizes: j === 0 ? '(min-width:900px) 50vw, 100vw' : '(min-width:900px) 25vw, 50vw' })).join('')}</div></section>` : ''}
<section class="section wrap" aria-labelledby="do-h">
${secHead({ label: u.whatWeDo, title: p.doTitle, id: 'do-h' })}
${rowsHtml(lang, p.experiences)}
</section>
${p.stay ? `<section class="section wrap kaolin" aria-labelledby="st-h"><div class="split"><div><span class="label label--muted">${u.nav.stays}</span><h2 id="st-h" style="margin-top:1rem">${p.stay.title}</h2></div><div class="txt"><p>${p.stay.text}</p><p>${tlink(u.seeStays, href(lang, '/stays/'))}</p></div></div></section>` : ''}
${faqHtml(lang, { label: u.questions, title: p.faqTitle, items: p.faq, link: tlink(u.nav.enquire, href(lang, '/enquire/')) }, true)}
<section class="section wrap" aria-labelledby="nx-h">
<div class="sec-head rv"><h2 id="nx-h">${u.otherPlaces}</h2>${tlink(u.nav.journeys, href(lang, '/journeys/'))}</div>
${placeCards(lang, [1, 2, 3].map(k => PLACES[(i + k) % PLACES.length]), 'tgrid tgrid--3')}
</section>
${ctaBanner(lang, { img: p.ctaImg || p.img, title: p.cta, button: u.nav.enquire })}`;
  return layout(lang, `/${slug}/`, { title: p.metaTitle, description: p.metaDescription, body, preload: preloadFor(p.img), ogImage: p.img, crumbs: [[p.name, `/${slug}/`]], ld: [{ '@type': 'TouristDestination', name: p.name, description: strip(p.metaDescription), url: abs(lang, `/${slug}/`), containedInPlace: { '@type': 'Country', name: 'Rwanda' } }] });
}

function pGorilla(lang) {
  const g = C[lang].gorilla, u = C[lang].ui, p = '/gorilla-trekking/';
  const body = `
${pageHero(lang, { img: g.img, crumbs: [[u.nav.gorilla, p]], chips: g.chips, title: g.title, intro: g.intro, facts: g.facts, ctas: btn(u.nav.enquire, href(lang, '/enquire/'), 'btn--light') })}
<section class="section wrap" aria-labelledby="permit-h"><div class="split split--wide">
<div>${secHead({ label: g.permit.label, title: g.permit.title, id: 'permit-h' })}<div class="prose rv">${g.permit.body.map(x => `<p>${x}</p>`).join('')}</div></div>
<div class="txt rv">${ph(lang, g.permit.img, { cls: 'r45', sizes: '(min-width:900px) 40vw, 100vw' })}</div></div>
<div class="prices rv" style="margin-top:clamp(2.5rem,5vw,4rem)">${g.permit.prices.map(([k, v, n]) => `<div class="price"><small>${k}</small><strong>${v}</strong><span class="small muted">${n}</span></div>`).join('')}</div>
<p class="small muted" style="margin-top:1rem">${g.permit.note}</p>
</section>
${dayHtml(lang, g, false)}
<section class="section wrap" aria-labelledby="fit-h">
${secHead({ label: g.fitness.label, title: g.fitness.title, id: 'fit-h', text: g.fitness.text })}
<div class="levels">${g.fitness.levels.map((l, i) => `<div class="rv"><b>${l[0]}</b><div class="meter" aria-hidden="true">${[0, 1, 2].map(k => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</div><p class="label label--muted" style="margin-bottom:.75rem">${l[1]}</p><p>${l[2]}</p></div>`).join('')}</div>
<div class="notes rv" style="margin-top:2.5rem;max-width:46rem">${g.fitness.notes.map(n => `<p>${n}</p>`).join('')}</div>
</section>
<section class="section wrap kaolin" aria-labelledby="pack-h"><div class="split split--wide" style="align-items:start">
<div>${secHead({ label: g.pack.label, title: g.pack.title, id: 'pack-h' })}<ul class="pack rv">${g.pack.items.map(i => `<li>${i}</li>`).join('')}</ul></div>
<div class="txt rv">${ph(lang, g.pack.img, { cls: 'r45', sizes: '(min-width:900px) 40vw, 100vw' })}</div></div></section>
<section class="section wrap" aria-labelledby="rules-h">
${secHead({ label: g.rules.label, title: g.rules.title, id: 'rules-h' })}
<ol class="care rv">${g.rules.items.map(r => `<li>${r}</li>`).join('')}</ol>
</section>
${faqHtml(lang, { label: u.questions, title: g.faqTitle, items: g.faq, link: tlink(u.nav.enquire, href(lang, '/enquire/')) }, true)}
${ctaBanner(lang, { img: g.ctaImg, title: g.cta, button: u.nav.enquire })}`;
  return layout(lang, p, { title: g.metaTitle, description: g.metaDescription, body, preload: preloadFor(g.img), ogImage: g.img, crumbs: [[u.nav.gorilla, p]] });
}

function pHistory(lang) {
  const h = C[lang].history, u = C[lang].ui, p = '/history/';
  const body = `
<section class="ptop dark" style="border:0">${crumbsHtml(lang, [[u.nav.history, p]])}<h1>${h.title}</h1><p class="lead lead--muted" style="font-size:clamp(1.2rem,2vw,1.6rem);max-width:40rem">${h.intro}</p></section>
<div class="dark">${zz('zz--ochre')}</div>
<section class="section wrap" aria-labelledby="h1-h"><div class="split" style="align-items:start">
<div><span class="label label--muted">${h.what.label}</span><h2 id="h1-h" style="margin-top:1rem">${h.what.title}</h2></div>
<div class="quiet">${h.what.body.map(x => `<p>${x}</p>`).join('')}</div></div></section>
<section class="section wrap kaolin" aria-labelledby="kw-h"><div class="split" style="align-items:start">
<div><span class="label label--muted">${h.kwibuka.label}</span><h2 id="kw-h" style="margin-top:1rem">${h.kwibuka.title}</h2></div>
<div class="quiet">${h.kwibuka.body.map(x => `<p>${x}</p>`).join('')}</div></div></section>
<section class="section wrap dark" aria-labelledby="mem-h">
${secHead({ label: h.memorials.label, title: h.memorials.title, id: 'mem-h', text: h.memorials.text })}
${ph(lang, h.memorials.img, { cls: 'r21', reveal: true, zoom: false, sizes: '100vw' })}
<ul class="memorials" style="list-style:none;padding:0;margin-top:2rem">${h.memorials.items.map(m => `<li><h3>${m[0]}</h3><div><p class="label label--muted" style="margin-bottom:.5rem">${m[1]}</p><p>${m[2]}</p></div></li>`).join('')}</ul>
</section>
<section class="section wrap" aria-labelledby="care-h">
${secHead({ label: h.care.label, title: h.care.title, id: 'care-h', text: h.care.text })}
<ol class="care">${h.care.items.map(c => `<li><strong>${c[0]}</strong> ${c[1]}</li>`).join('')}</ol>
</section>
<section class="section wrap kaolin" aria-labelledby="plan-h"><div class="split" style="align-items:start">
<div><span class="label label--muted">${h.plan.label}</span><h2 id="plan-h" style="margin-top:1rem">${h.plan.title}</h2></div>
<div class="quiet">${h.plan.body.map(x => `<p>${x}</p>`).join('')}<p style="margin-top:2rem">${btn(u.nav.enquire, href(lang, '/enquire/'))}</p></div></div></section>
<section class="section wrap" aria-labelledby="read-h">
${secHead({ label: h.reading.label, title: h.reading.title, id: 'read-h' })}
<ul class="credits" style="list-style:none;padding:0">${h.reading.items.map(r => `<li><strong>${r[0]}</strong><span>${r[1]}</span><span class="muted">${r[2]}</span></li>`).join('')}</ul>
</section>`;
  return layout(lang, p, { title: h.metaTitle, description: h.metaDescription, body, solid: false, crumbs: [[u.nav.history, p]], ogImage: h.memorials.img });
}

function pCalendar(lang) {
  const c = C[lang].calendar, u = C[lang].ui, p = '/calendar/';
  const um = umugandaDates(12);
  const body = `
${pageHero(lang, { img: c.img, crumbs: [[u.nav.calendar, p]], title: c.title, intro: c.intro, facts: c.facts })}
<section class="section wrap" aria-labelledby="yr-h">
${secHead({ label: c.year.label, title: c.year.title, id: 'yr-h', text: c.year.text })}
<div class="legend">${['dry', 'short', 'wet', 'wet2'].map(s => { const [k, t] = seasonBadge(lang, s); return `<span><i class="${k}"></i>${t}</span>`; }).join('')}<span><i style="background:var(--ochre);transform:rotate(45deg) scale(.7)"></i>${c.legendKwita}</span><span><i style="background:var(--ridge);transform:rotate(45deg) scale(.7)"></i>${c.legendUmuganda}</span></div>
<div class="months">${u.months.map((m, i) => { const [k, t] = seasonBadge(lang, SEASON[i]); const um1 = um.find(d => d.getUTCMonth() === i); return `<article class="month rv"><h3>${m}</h3><span class="season ${k}">${t}</span><p class="small">${c.months[i].note}</p><ul>${um1 ? `<li class="ev-umuganda">${c.umugandaShort} · ${fmtDate(lang, um1, { day: 'numeric', month: 'short', year: 'numeric' })}</li>` : ''}${c.months[i].events.map(e => `<li class="${e[0] === 'kwita' ? 'ev-kwita' : ''}">${e[1]}</li>`).join('')}</ul><div class="rain" title="${RAIN_MM[i]} mm"><i style="width:${Math.round(RAIN_MM[i] / 160 * 100)}%"></i></div></article>`; }).join('')}</div>
<p class="small muted" style="margin-top:1rem">${c.rainNote}</p>
</section>
<section class="section wrap kaolin" aria-labelledby="kw-h"><div class="split split--wide" style="align-items:start">
<div>${secHead({ label: c.kwita.label, title: c.kwita.title, id: 'kw-h' })}<div class="prose rv">${c.kwita.body.map(x => `<p>${x}</p>`).join('')}</div></div>
<div class="txt rv">${ph(lang, c.kwita.img, { cls: 'r45', sizes: '(min-width:900px) 40vw, 100vw' })}</div></div></section>
<section class="section wrap dark" aria-labelledby="um-h">
${secHead({ label: c.umuganda.label, title: c.umuganda.title, id: 'um-h', text: c.umuganda.text })}
<div class="split" style="align-items:start"><div class="prose">${c.umuganda.body.map(x => `<p>${x}</p>`).join('')}</div>
<div><p class="label label--muted" style="margin-bottom:1rem">${c.umuganda.next}</p><ul class="umu" style="list-style:none;padding:0;border-color:rgba(244,236,221,.2)">${um.map(d => `<li style="border-color:rgba(244,236,221,.2)">${fmtDate(lang, d, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</li>`).join('')}</ul><p class="small muted" style="margin-top:1rem">${c.umuganda.note}</p></div></div>
</section>
<section class="section wrap" aria-labelledby="hol-h">
${secHead({ label: c.holidays.label, title: c.holidays.title, id: 'hol-h', text: c.holidays.text })}
<ul class="credits" style="list-style:none;padding:0">${c.holidays.items.map(h => `<li><strong>${h[0]}</strong><span>${h[1]}</span><span class="muted">${h[2] || ''}</span></li>`).join('')}</ul>
</section>
${faqHtml(lang, { label: u.questions, title: c.faqTitle, items: c.faq, link: tlink(u.nav.enquire, href(lang, '/enquire/')) })}
${ctaBanner(lang, { img: c.ctaImg, title: c.cta, button: u.nav.enquire })}`;
  return layout(lang, p, { title: c.metaTitle, description: c.metaDescription, body, preload: preloadFor(c.img), ogImage: c.img, crumbs: [[u.nav.calendar, p]] });
}

function pJourneys(lang) {
  const J = C[lang].journeys, u = C[lang].ui, p = '/journeys/';
  const body = `
${pageHero(lang, { img: J.img, crumbs: [[u.nav.journeys, p]], title: J.title, intro: J.intro })}
<section class="section wrap" aria-labelledby="jl-h">
${secHead({ label: J.label, title: J.listTitle, id: 'jl-h', text: J.listText })}
<div class="jcards">${J.list.map(j => journeyCard(lang, j)).join('')}</div>
${J.list.map(j => `<article class="itin" id="${j.id}" aria-labelledby="${j.id}-h"><div class="itin__head"><div><p class="label label--muted">${j.nights} ${u.nights} · ${j.months}</p><h2 id="${j.id}-h" style="margin-top:1rem">${j.title}</h2></div><p class="muted">${j.why}</p></div>
<ol class="days" style="list-style:none;padding:0">${j.days.map(d => `<li><b>${d[0]}</b><div><strong>${d[1]}</strong><span>${d[2]}</span></div></li>`).join('')}</ol>
<p style="margin-top:1.5rem">${btn(u.planThis, href(lang, '/enquire/') + `?journey=${j.id}`)}</p></article>`).join('')}
<p class="small muted" style="margin-top:3rem;max-width:46rem">${J.note}</p>
</section>
${ctaBanner(lang, { img: J.ctaImg, title: J.cta, button: u.nav.enquire })}`;
  return layout(lang, p, { title: J.metaTitle, description: J.metaDescription, body, preload: preloadFor(J.img), ogImage: J.img, crumbs: [[u.nav.journeys, p]] });
}

function pStays(lang) {
  const S = C[lang].stays, u = C[lang].ui, p = '/stays/';
  const body = `
${pageHero(lang, { img: S.img, crumbs: [[u.nav.stays, p]], title: S.title, intro: S.intro })}
<section class="section wrap" aria-labelledby="sl-h">
${secHead({ label: S.label, title: S.listTitle, id: 'sl-h', text: S.listText })}
<div>${S.list.map(s => `<article class="stay rv">${ph(lang, s.img, { sizes: '(min-width:900px) 50vw, 100vw' })}<div><span class="badge">${S.placeholder}</span><p class="label label--muted">${s.where}</p><h3 style="margin:.5rem 0 1rem">${s.name}</h3><p>${s.text}</p><dl class="kv" style="margin-top:1.5rem">${s.kv.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl></div></article>`).join('')}</div>
<p class="small muted" style="margin-top:2rem;max-width:46rem">${S.note}</p>
</section>
${ctaBanner(lang, { img: S.ctaImg, title: S.cta, button: u.nav.enquire })}`;
  return layout(lang, p, { title: S.metaTitle, description: S.metaDescription, body, preload: preloadFor(S.img), ogImage: S.img, crumbs: [[u.nav.stays, p]] });
}

function pAbout(lang) {
  const A = C[lang].about, u = C[lang].ui, h = C[lang].home, p = '/about/';
  const body = `
${pageHero(lang, { img: A.img, crumbs: [[u.nav.about, p]], title: A.title, intro: A.intro })}
<section class="section wrap" aria-labelledby="st-h">
<span class="label label--muted">${A.story.label}</span><h2 id="st-h" class="sr">${A.story.label}</h2>
<p class="lead rv-words" style="margin-top:1.25rem;max-width:34ch">${A.story.lead}</p>
<div class="split" style="margin-top:clamp(2.5rem,6vw,5rem);align-items:start">${ph(lang, A.story.img, { cls: 'r45', reveal: true, sizes: '(min-width:900px) 50vw, 100vw' })}<div class="txt prose">${A.story.body.map(x => `<p>${x}</p>`).join('')}</div></div>
</section>
<section class="section wrap dark" aria-labelledby="pr-h">
${secHead({ label: A.principles.label, title: A.principles.title, id: 'pr-h' })}
<div class="cols" style="--n:3">${A.principles.items.map((x, i) => `<div class="rv"><div class="cols__top"><b>${x[0]}</b><span class="small" style="color:var(--clay)">/ 0${i + 1}</span></div><p style="color:var(--kaolin)">${x[1]}</p></div>`).join('')}</div>
</section>
<section class="steps on-image" aria-labelledby="how-h">${ph(lang, h.how.img, { zoom: false })}
<div class="steps__top"><span class="label">${h.how.label}</span><h2 id="how-h" style="margin-top:1rem;max-width:16ch">${h.how.title}</h2></div>
<div class="steps__in"><div><p>${h.how.text}</p></div>${h.how.steps.map((s, i) => `<div><b>0${i + 1}</b><small>${u.step}</small><h3>${s[0]}</h3><p>${s[1]}</p></div>`).join('')}</div>
</section>
<section class="section wrap" aria-labelledby="im-h"><div class="split" style="align-items:start">
<div><span class="label label--muted">${A.imigongo.label}</span><h2 id="im-h" style="margin-top:1rem">${A.imigongo.title}</h2><div class="lozenges" style="margin-top:2rem;max-width:20rem" aria-hidden="true"></div></div>
<div class="txt"><div class="prose">${A.imigongo.body.map(x => `<p>${x}</p>`).join('')}</div>${A.imigongo.img ? `<div class="frame" style="margin-top:2rem">${ph(lang, A.imigongo.img, { cls: 'r43', zoom: false, sizes: '(min-width:900px) 45vw, 100vw' })}</div>` : ''}</div></div></section>
<section class="section wrap kaolin" aria-labelledby="ct-h"><div class="split" style="align-items:start">
<div><span class="label label--muted">${A.contact.label}</span><h2 id="ct-h" style="margin-top:1rem">${A.contact.title}</h2></div>
<div class="txt"><p>${A.contact.text}</p>${contactList(lang)}<p>${btn(u.nav.enquire, href(lang, '/enquire/'))}</p></div></div></section>`;
  return layout(lang, p, { title: A.metaTitle, description: A.metaDescription, body, preload: preloadFor(A.img), ogImage: A.img, crumbs: [[u.nav.about, p]] });
}
function contactList(lang) {
  const u = C[lang].ui, a = cfg.address;
  return `<dl class="contact-list"><div><dt>${u.email}</dt><dd><a class="link" href="mailto:${cfg.brand.email}">${cfg.brand.email}</a></dd></div><div><dt>${u.addressLabel}</dt><dd><address style="font-style:normal">${cfg.brand.name}<br>${a.venue}<br>${a.street}<br>${a.locality}, ${u.countryName}</address></dd></div><div><dt>${u.hoursLabel}</dt><dd>${u.hours}</dd></div></dl>`;
}

function pJournal(lang) {
  const J = C[lang].journal, u = C[lang].ui, p = '/journal/';
  const body = `${plainTop(lang, { crumbs: [[u.nav.journal, p]], title: J.title, intro: J.intro })}
<section class="section wrap">${journalCards(lang, J.posts)}</section>
${ctaBanner(lang, { img: J.ctaImg, title: J.cta, button: u.nav.enquire })}`;
  return layout(lang, p, { title: J.metaTitle, description: J.metaDescription, body, solid: true, crumbs: [[u.nav.journal, p]] });
}
function pPost(lang, post) {
  const J = C[lang].journal, u = C[lang].ui, p = `/journal/${post.slug}/`;
  const others = J.posts.filter(x => x.slug !== post.slug);
  const body = `
${pageHero(lang, { img: post.img, crumbs: [[u.nav.journal, '/journal/'], [post.kicker, p]], chips: [post.kicker, post.read], title: post.title, intro: post.dek })}
<article class="article wrap"><div class="article__grid"><aside><p class="label label--muted">${post.kicker}</p><p class="small muted" style="margin-top:.5rem">${post.read}</p></aside>
<div class="prose">${post.body.map(b => b.startsWith('## ') ? `<h2>${b.slice(3)}</h2>` : `<p>${b}</p>`).join('')}</div></div></article>
<section class="section wrap kaolin" aria-labelledby="more-h">${secHead({ label: u.nav.journal, title: J.more, id: 'more-h', link: tlink(J.all, href(lang, '/journal/')) })}${journalCards(lang, others)}</section>`;
  return layout(lang, p, { title: post.title, description: post.dek, body, preload: preloadFor(post.img), ogImage: post.img, crumbs: [[u.nav.journal, '/journal/'], [post.title, p]], ld: [{ '@type': 'Article', headline: strip(post.title), description: strip(post.dek), inLanguage: lang, url: abs(lang, p), publisher: { '@id': cfg.siteUrl + '/#org' }, author: { '@id': cfg.siteUrl + '/#org' } }] });
}

function formHtml(lang, full) {
  const E = C[lang].enquire, f = E.form, x = full ? 'f' : 'h';
  const field = (name, label, type = 'text', o = {}) => `<div class="field"><label for="${x}-${name}">${label}${o.req ? ' <span aria-hidden="true">*</span>' : ''}</label>${type === 'textarea' ? `<textarea id="${x}-${name}" name="${name}"${o.req ? ' required' : ''}${o.ph ? ` placeholder="${attr(o.ph)}"` : ''}></textarea>` : type === 'select' ? `<select id="${x}-${name}" name="${name}"${o.req ? ' required' : ''}>${o.options.map(v => `<option value="${attr(v[0])}">${v[1]}</option>`).join('')}</select>` : `<input id="${x}-${name}" name="${name}" type="${type}"${o.req ? ' required' : ''}${o.auto ? ` autocomplete="${o.auto}"` : ''}>`}${o.hint ? `<p class="hint">${o.hint}</p>` : ''}</div>`;
  const journeyOpts = [['', f.journeyNone], ...C[lang].journeys.list.map(j => [j.id, j.title])];
  return `<form class="form" method="POST" action="${cfg.form.action}" data-ajax="${cfg.form.ajax}" data-sending="${attr(f.sending)}" data-error="${attr(f.error)}" data-mailto="${attr(f.mailto)}" data-email="${cfg.brand.email}" accept-charset="UTF-8">
<input type="hidden" name="_subject" value="${attr(`${cfg.brand.name} — ${f.subject}`)}">
<input type="hidden" name="_template" value="table">
<input type="hidden" name="_captcha" value="false">
<input type="hidden" name="_next" value="${abs(lang, '/enquire/thanks/')}">
<input type="hidden" name="language" value="${lang}">
<div class="hp" aria-hidden="true"><label for="${x}-honey">${f.honey}</label><input id="${x}-honey" type="text" name="_honey" tabindex="-1" autocomplete="off"></div>
${field('journey', f.journey, 'select', { options: journeyOpts })}
<div class="two">${field('name', f.name, 'text', { req: true, auto: 'name' })}${field('email', f.email, 'email', { req: true, auto: 'email' })}</div>
<div class="two">${field('travellers', f.travellers, 'text', { req: true, hint: full ? f.travellersHint : '' })}${field('dates', f.dates, 'text', { req: true, hint: full ? f.datesHint : '' })}</div>
${full ? `<div class="two">${field('country', f.country, 'text', { auto: 'country-name' })}${field('nights', f.nights, 'select', { options: f.nightsOptions.map(v => [v, v]) })}</div>
<fieldset class="field"><legend>${f.interests}</legend><div class="checks">${f.interestOptions.map(v => `<label><input type="checkbox" name="interests" value="${attr(strip(v))}">${v}</label>`).join('')}</div></fieldset>` : ''}
${field('message', f.message, 'textarea', { ph: f.messagePh })}
<label class="consent"><input type="checkbox" name="consent" value="yes" required><span>${f.consent.replace('{privacy}', href(lang, '/privacy/'))}</span></label>
<div class="form__send"><button class="btn" type="submit"><span>${f.submit}</span></button><i>${C[lang].ui.hours}</i></div>
<p class="form-status" role="status" aria-live="polite"></p>
</form>`;
}
function reserveHtml(lang) {
  const E = C[lang].enquire;
  return `<section class="section wrap reserve" aria-labelledby="rs-h"><div class="reserve__in">
<div><p class="label">${C[lang].ui.nav.enquire}</p><h2 id="rs-h">${emTail(E.title)}</h2><p class="reserve__txt">${E.intro}</p></div>
${formHtml(lang, false)}</div></section>`;
}
function pEnquire(lang) {
  const E = C[lang].enquire, u = C[lang].ui, p = '/enquire/';
  const body = `<section class="section wrap reserve reserve--page" aria-labelledby="rs-h"><div class="reserve__in">
<div>${crumbsHtml(lang, [[u.nav.enquire, p]])}<h1 id="rs-h">${emTail(E.title)}</h1><p class="reserve__txt">${E.intro}</p>
<p class="label" style="margin-top:2.5rem">${E.asideLabel}</p><ol class="care" style="margin-top:1rem;grid-template-columns:1fr">${E.steps.map(s => `<li>${s}</li>`).join('')}</ol>${contactList(lang)}</div>
${formHtml(lang, true)}</div></section>
<script>(function(){var q=new URLSearchParams(location.search).get('journey');if(q){var s=document.getElementById('f-journey');if(s)s.value=q;}})();</script>`;
  return layout(lang, p, { title: E.metaTitle, description: E.metaDescription, body, solid: true, crumbs: [[u.nav.enquire, p]] });
}
function pThanks(lang) {
  const T = C[lang].thanks, u = C[lang].ui, p = '/enquire/thanks/';
  const body = `${plainTop(lang, { crumbs: [[u.nav.enquire, '/enquire/'], [T.crumb, p]], title: T.title, intro: T.text })}
<section class="section wrap"><div class="split"><div class="prose"><p>${T.next}</p><p style="margin-top:2rem">${btn(T.back, href(lang, '/'))}</p></div>${ph(lang, T.img, { cls: 'r1610', sizes: '(min-width:900px) 50vw, 100vw' })}</div></section>`;
  return layout(lang, p, { title: T.title, description: T.text, body, solid: true, noindex: true });
}
function pLegal(lang, key, p) {
  const L = C[lang][key], u = C[lang].ui;
  const body = `${plainTop(lang, { crumbs: [[L.title, p]], title: L.title, intro: L.intro })}
<section class="section wrap"><div class="legal"><nav aria-label="${attr(u.onThisPage)}"><p class="label label--muted" style="margin-bottom:.75rem">${u.onThisPage}</p><ol>${L.sections.map((s, i) => `<li><a href="#s${i + 1}">${s[0]}</a></li>`).join('')}</ol></nav>
<div class="prose">${L.sections.map((s, i) => `<section id="s${i + 1}"><h2>${s[0]}</h2>${s[1].map(x => x.startsWith('- ') ? `<ul><li>${x.slice(2).split('\n- ').join('</li><li>')}</li></ul>` : `<p>${x}</p>`).join('')}</section>`).join('')}<p class="small muted" style="margin-top:3rem">${u.updated}: ${fmtDate(lang, new Date(Date.UTC(2026, 10, 2)), { day: 'numeric', month: 'long', year: 'numeric' })}</p></div></div></section>`;
  return layout(lang, p, { title: L.metaTitle || L.title, description: L.metaDescription, body, solid: true, crumbs: [[L.title, p]] });
}
function pCredits(lang) {
  const K = C[lang].credits, u = C[lang].ui, p = '/credits/';
  const cc = Object.entries(IMAGES).filter(([, v]) => v.credit && v.credit.license && !/unsplash/i.test(v.credit.license));
  const body = `${plainTop(lang, { crumbs: [[K.title, p]], title: K.title, intro: K.intro })}
<section class="section wrap"><ul class="credits" style="list-style:none;padding:0">${cc.map(([k, v]) => `<li><span><strong>${esc(C[lang].alt[k] || k)}</strong></span><span>${esc(v.credit.title || '')} — ${esc(v.credit.author)}</span><span><a class="link" href="${attr(v.credit.licenseUrl || v.credit.sourceUrl)}" rel="license noopener">${esc(v.credit.license)}</a> · <a class="link" href="${attr(v.credit.sourceUrl)}" rel="noopener">${K.source}</a></span></li>`).join('')}</ul>
<div class="prose" style="margin-top:3rem">${K.body.map(x => `<p>${x}</p>`).join('')}</div></section>`;
  return layout(lang, p, { title: K.title, description: K.intro, body, solid: true, crumbs: [[K.title, p]] });
}
function p404(lang) {
  const N = C[lang].notFound, u = C[lang].ui;
  const body = `${plainTop(lang, { crumbs: [[N.crumb, '/404/']], title: N.title, intro: N.text })}<section class="section wrap">${btn(N.back, href(lang, '/'))}<div style="margin-top:3rem">${placeCards(lang, PLACES)}</div></section>`;
  return layout(lang, '/404/', { title: N.title, description: N.text, body, solid: true, noindex: true, noAlternates: true });
}

/* ---------------- build ---------------- */
function write(file, html) {
  const out = path.join(DIST, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const brandFilled = html.replace(/\{\{brand\}\}/g, cfg.brand.name).replace(/\{\{email\}\}/g, cfg.brand.email)
    .replace(/\{\{emailLink\}\}/g, `<a href="mailto:${cfg.brand.email}">${cfg.brand.email}</a>`)
    .replace(/\{\{address\}\}/g, `${cfg.address.venue}, ${cfg.address.street}, ${cfg.address.locality}, ${cfg.address.country}`)
    .replace(/\{\{site\}\}/g, cfg.siteUrl.replace(/^https?:\/\//, ''));
  if (/\{\{\w+\}\}/.test(brandFilled)) throw new Error('Unreplaced placeholder in ' + file + ': ' + brandFilled.match(/\{\{\w+\}\}/)[0]);
  fs.writeFileSync(out, brandFilled);
  return out;
}
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}
function minifyCss(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{};,>])\s*/g, '$1').replace(/;}/g, '}').trim();
}
function checkStructure() {
  for (const [k, v] of Object.entries(ALT)) for (const l of LANGS) if (!v[l]) throw new Error(`alt.json: missing ${l} alt for ${k}`);
  for (const k of Object.keys(IMAGES)) if (!ALT[k]) throw new Error(`alt.json: no alt text for image ${k}`);
  // every language must have exactly the same content keys as English
  const shape = (o, p = '') => p === '.alt' ? [] : typeof o !== 'object' || o === null ? [p] : Array.isArray(o) ? o.flatMap((v, i) => shape(v, `${p}[${i}]`)) : Object.keys(o).flatMap(k => shape(o[k], `${p}.${k}`));
  const en = new Set(shape(C.en));
  for (const l of LANGS.filter(x => x !== 'en')) {
    const s = new Set(shape(C[l]));
    const miss = [...en].filter(k => !s.has(k)), extra = [...s].filter(k => !en.has(k));
    if (miss.length || extra.length) throw new Error(`Content shape mismatch in ${l}: missing ${miss.slice(0, 8).join(', ')} | extra ${extra.slice(0, 8).join(', ')}`);
  }
}

function build() {
  checkStructure();
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  copyDir(path.join(__dirname, 'assets/fonts'), path.join(DIST, 'assets/fonts'));
  copyDir(path.join(__dirname, 'assets/img'), path.join(DIST, 'assets/img'));
  const js = fs.readFileSync(path.join(__dirname, 'assets/js/site.js'));
  JS_URL = `/assets/js/site.${hash(js)}.js`;
  fs.mkdirSync(path.join(DIST, 'assets/js'), { recursive: true });
  fs.writeFileSync(path.join(DIST, JS_URL), js);
  const vars = `:root{${Object.entries(cfg.palette).map(([k, v]) => `--${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`).join(';')};--f-display:${cfg.fonts.display};--f-text:${cfg.fonts.text}}`;
  CSS = minifyCss(vars + fs.readFileSync(path.join(__dirname, 'assets/css/site.css'), 'utf8'));
  fs.writeFileSync(path.join(DIST, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${cfg.palette.ochre}"/><path d="M0 22 L8 10 L16 22 L24 10 L32 22 V32 H0Z" fill="${cfg.palette.imigongo}"/><path d="M0 27 L8 15 L16 27 L24 15 L32 27" fill="none" stroke="${cfg.palette.cream}" stroke-width="1.6"/></svg>`);

  const pages = [];
  for (const lang of LANGS) {
    const pre = loc(lang).prefix.slice(1);
    const at = p => path.join(pre, p, 'index.html');
    const add = (p, html) => { write(at(p), html); pages.push([lang, p]); };
    add('/', pHome(lang));
    for (const s of PLACES) add(`/${s}/`, pPlace(lang, s));
    add('/gorilla-trekking/', pGorilla(lang));
    add('/history/', pHistory(lang));
    add('/calendar/', pCalendar(lang));
    add('/journeys/', pJourneys(lang));
    add('/stays/', pStays(lang));
    add('/about/', pAbout(lang));
    add('/journal/', pJournal(lang));
    for (const post of C[lang].journal.posts) add(`/journal/${post.slug}/`, pPost(lang, post));
    add('/enquire/', pEnquire(lang));
    write(at('/enquire/thanks/'), pThanks(lang));
    add('/privacy/', pLegal(lang, 'privacy', '/privacy/'));
    add('/booking-terms/', pLegal(lang, 'terms', '/booking-terms/'));
    add('/cookies/', pLegal(lang, 'cookies', '/cookies/'));
    add('/credits/', pCredits(lang));
    if (lang === 'en') write('404.html', p404(lang));
    else write(path.join(pre, '404.html'), p404(lang));
  }
  // sitemap with hreflang alternates
  const byPath = [...new Set(pages.map(([, p]) => p))];
  const sm = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${byPath.flatMap(p => LANGS.map(l => `<url><loc>${abs(l, p)}</loc>${LANGS.map(x => `<xhtml:link rel="alternate" hreflang="${x}" href="${abs(x, p)}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${abs('en', p)}"/></url>`)).join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sm);
  fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${cfg.siteUrl}/sitemap.xml\n`);
  console.log(`Built ${pages.length} pages (+ thanks and 404 pages) in ${LANGS.length} languages → dist/`);
}
build();
