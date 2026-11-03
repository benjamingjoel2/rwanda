import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
if(!fs.existsSync('dist'))await import('./build.mjs');
http.createServer((req,res)=>{let p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let f=path.join(process.cwd(),'dist',p);if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f))f=path.join(process.cwd(),'dist','index.html');res.setHeader('Content-Type',f.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8');fs.createReadStream(f).pipe(res)}).listen(4173,()=>console.log('http://localhost:4173'));

