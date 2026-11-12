// A11's placement mockups: serves art/ on localhost, and saves a11-*.png files the browser page posts to art/mockups/.
// Local tool only (never deployed). Run from the launch config `a11-mock`: node art/tools/a11-mock-server.mjs
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ART = dirname(dirname(fileURLToPath(import.meta.url)));
const PORT = 8093;
const TYPES = { '.html': 'text/html', '.png': 'image/png', '.js': 'text/javascript', '.json': 'application/json', '.gif': 'image/gif' };
const CORS = { 'Access-Control-Allow-Origin': '*' };

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
  const save = path.match(/^\/save\/(a11-[\w-]+\.png)$/);
  if (req.method === 'POST' && save) {
    let body = '';
    for await (const part of req) body += part;
    const b64 = body.slice(body.indexOf(',') + 1);
    await writeFile(join(ART, 'mockups', save[1]), Buffer.from(b64, 'base64'));
    res.writeHead(200, CORS).end(`saved ${save[1]}\n`);
    return;
  }
  if (path === '/') { res.writeHead(302, { ...CORS, Location: '/mockups/a11-placement.html' }).end(); return; }
  const file = normalize(join(ART, path));
  if (!file.startsWith(ART + sep)) { res.writeHead(403, CORS).end(); return; }
  try {
    const data = await readFile(file);
    res.writeHead(200, { ...CORS, 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' }).end(data);
  } catch {
    res.writeHead(404, CORS).end('not found\n');
  }
}).listen(PORT, () => console.log(`a11 mock server on http://localhost:${PORT}`));
