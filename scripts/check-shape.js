#!/usr/bin/env node
/* Usage: node scripts/check-shape.js fr
   Checks that src/content/<lang>.js has exactly the same shape as en.js, that protected values
   (slugs, ids, image keys) are unchanged, and that {{placeholders}} and HTML tags are preserved. */
const path = require('path');
const lang = process.argv[2];
const en = require(path.join(__dirname, '../src/content/en.js'));
const other = require(path.join(__dirname, `../src/content/${lang}.js`));
const shape = (o, p = '') => typeof o !== 'object' || o === null ? [p + ':' + typeof o] : Array.isArray(o) ? o.flatMap((v, i) => shape(v, `${p}[${i}]`)) : Object.keys(o).flatMap(k => shape(o[k], `${p}.${k}`));
const a = new Set(shape(en)), b = new Set(shape(other));
const miss = [...a].filter(k => !b.has(k)), extra = [...b].filter(k => !a.has(k));
const KEEP = /\.(slug|id|img|card|ctaImg|gallery\[\d+\]|strip\[\d+\]|nights)$/;
const get = (o, p) => p.split(/\.|\[|\]/).filter(Boolean).reduce((x, k) => x?.[k], o);
const keys = [...a].map(k => k.split(':')[0]);
const changed = keys.filter(k => KEEP.test(k) && get(en, k) !== get(other, k));
const tags = s => (String(s).match(/\{\{\w+\}\}|\{privacy\}|<\/?[a-z]+/g) || []).sort().join('|');
const phDiff = keys.filter(k => typeof get(en, k) === 'string' && tags(get(en, k)) !== tags(get(other, k)));
const same = keys.filter(k => typeof get(en, k) === 'string' && get(en, k).length > 25 && get(en, k) === get(other, k));
console.log(`missing: ${miss.length}`, miss.slice(0, 20));
console.log(`extra: ${extra.length}`, extra.slice(0, 20));
console.log(`changed protected values: ${changed.length}`, changed.slice(0, 20));
console.log(`placeholder/HTML tag mismatches: ${phDiff.length}`, phDiff.slice(0, 20));
console.log(`long strings identical to English (check they are names/titles): ${same.length}`, same.slice(0, 30));
process.exit(miss.length || extra.length || changed.length || phDiff.length ? 1 : 0);
