#!/usr/bin/env node
/* Turns the source photos in src/img-src (listed in manifest.json) into right-sized
   AVIF + WebP files in src/assets/img, and writes src/data/images.json for the build.
   Run after adding or replacing a photo: `npm run images` (needs the sharp devDependency). */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const SRC = process.env.IMG_SRC || path.join(__dirname, '../src/img-src');
const OUT = path.join(__dirname, '../src/assets/img');
const DATA = path.join(__dirname, '../src/data/images.json');
const WIDTHS = [480, 800, 1200, 1600, 2400];
const FOCAL = { center: '50% 50%', top: '50% 25%', bottom: '50% 75%', left: '30% 50%', right: '70% 50%' };

(async () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(SRC, 'manifest.json'), 'utf8'));
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(path.dirname(DATA), { recursive: true });
  const data = {};
  for (const m of manifest) {
    const key = m.file.replace(/\.jpe?g$/i, '');
    const input = path.join(SRC, m.file);
    if (!fs.existsSync(input)) { console.warn('missing', input); continue; }
    const meta = await sharp(input).rotate().metadata();
    const W = meta.autoOrient?.width || meta.width, H = meta.autoOrient?.height || meta.height;
    const widths = WIDTHS.filter(w => w <= W);
    if (!widths.length || widths[widths.length - 1] < Math.min(W, 2400) - 200) widths.push(Math.min(W, 2400));
    const files = { avif: [], webp: [] };
    for (const w of widths) {
      const base = sharp(input).rotate().resize({ width: w, withoutEnlargement: true });
      const avif = await base.clone().avif({ quality: 50, effort: 5 }).toBuffer();
      const webp = await base.clone().webp({ quality: 72, effort: 5 }).toBuffer();
      for (const [ext, buf] of [['avif', avif], ['webp', webp]]) {
        const name = `${key}-${w}.${crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8)}.${ext}`;
        fs.writeFileSync(path.join(OUT, name), buf);
        files[ext].push([w, `/assets/img/${name}`]);
      }
    }
    const maxW = widths[widths.length - 1];
    data[key] = {
      w: maxW, h: Math.round(maxW * H / W), focal: FOCAL[m.focal] || m.focal || null, files,
      credit: { title: m.title || '', author: m.author || '', license: m.license || '', licenseUrl: m.licenseUrl || '', sourceUrl: m.sourceUrl || '', location: m.location || '' },
    };
    console.log('ok', key, widths.join(','));
  }
  fs.writeFileSync(DATA, JSON.stringify(data, null, 1));
  console.log('wrote', Object.keys(data).length, 'images');
})();
