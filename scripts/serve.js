#!/usr/bin/env node
/* Minimal static server for ./dist that mimics Vercel's cleanUrls + trailingSlash. */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, '../dist');
const PORT = process.env.PORT || 4321;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.avif': 'image/avif', '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.json': 'application/json' };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!path.extname(p) && !p.endsWith('/')) { res.writeHead(308, { Location: p + '/' }); return res.end(); }
  let f = path.join(DIST, p);
  if (p.endsWith('/')) f = path.join(f, 'index.html');
  if (!f.startsWith(DIST) || !fs.existsSync(f)) {
    const lang = (p.match(/^\/(fr|de|es)\//) || [])[1];
    res.writeHead(404, { 'Content-Type': TYPES['.html'] });
    return res.end(fs.readFileSync(path.join(DIST, lang ? `${lang}/404.html` : '404.html')));
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
