// A12's tournament mockups: serves the repo (the game in public/, the mock code in art/) on localhost, and saves the
// a12-*.png files the page posts to art/mockups/. Local tool only (never deployed).
// Run from the launch config `a12-mock`, then open http://localhost:8094/public/hogg-squash/?dev and import
// /art/tools/a12-mock.js (it draws with the game's own font, panels and character sheets).
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const PORT = 8094;
const TYPES = { '.html': 'text/html', '.png': 'image/png', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
  '.css': 'text/css', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
  const save = path.match(/^\/save\/(a12-[\w-]+\.png)$/);
  if (req.method === 'POST' && save) {
    let body = '';
    for await (const part of req) body += part;
    const b64 = body.slice(body.indexOf(',') + 1);
    await writeFile(join(ROOT, 'art', 'mockups', save[1]), Buffer.from(b64, 'base64'));
    res.writeHead(200).end(`saved ${save[1]}\n`);
    return;
  }
  if (path === '/') { res.writeHead(302, { Location: '/public/hogg-squash/?dev' }).end(); return; }
  let file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT + sep)) { res.writeHead(403).end(); return; }
  if (path.endsWith('/')) file = join(file, 'index.html');
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' })
      .end(data);
  } catch {
    res.writeHead(404).end('not found\n');
  }
}).listen(PORT, () => console.log(`a12 mock server on http://localhost:${PORT}`));
