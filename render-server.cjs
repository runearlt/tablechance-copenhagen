// Serve the existing site and its unchanged walking-route handler on Render.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { handler } = require('./walks.cjs');
const root = path.join(__dirname, 'dist');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.txt': 'text/plain; charset=utf-8' };
const server = http.createServer(async (req, res) => {
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'strict-origin-when-cross-origin' };
  const send = (status, body, extra = {}) => {
    res.writeHead(status, { ...headers, ...extra });
    res.end(req.method === 'HEAD' ? undefined : body);
  };
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/healthz') return send(200, 'ok', { 'Content-Type': 'text/plain' });
    if (url.pathname === '/api/walks') {
      const result = await handler({ httpMethod: req.method, queryStringParameters: Object.fromEntries(url.searchParams) });
      return send(result.statusCode, result.body, result.headers);
    }
    if (!['GET', 'HEAD'].includes(req.method)) return send(405, 'Method not allowed');
    const name = decodeURIComponent(url.pathname);
    const target = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
    if (!target.startsWith(root + path.sep)) return send(404, 'Not found');
    const body = await fs.readFile(target);
    return send(200, body, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream' });
  } catch (error) {
    return send(error instanceof URIError ? 400 : 404, 'Not found');
  }
});
server.listen(Number(process.env.PORT || 10000), '0.0.0.0', () => console.log('Tablechance ready'));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
