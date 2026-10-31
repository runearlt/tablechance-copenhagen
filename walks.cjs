// Netlify counterpart of server.py: live pedestrian routes, never straight-line estimates.
const data = require('./restaurants.json');
const cache = new Map();
let queue = Promise.resolve();
let lastRequest = 0;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
function distance(a, b) {
  const rad = Math.PI / 180;
  const dlat = (b[1] - a[1]) * rad, dlon = (b[0] - a[0]) * rad;
  return 6371000 * 2 * Math.asin(Math.min(1, Math.sqrt(Math.sin(dlat / 2) ** 2 +
    Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dlon / 2) ** 2)));
}
function walk(origin, destination, deadline) {
  const task = queue.then(async () => {
    const now = Date.now();
    for (const [key, entry] of cache) if (now - entry.at >= 900000) cache.delete(key);
    const key = JSON.stringify([origin, destination]);
    if (cache.has(key)) return cache.get(key).route;
    const wait = Math.max(0, 1050 - (now - lastRequest));
    if (now + wait + 500 >= deadline) throw Error('Route deadline reached');
    if (wait) await pause(wait);
    lastRequest = Date.now();
    const coordinates = [origin, destination].map(point => point.join(',')).join(';');
    const response = await fetch(`https://routing.openstreetmap.de/routed-foot/route/v1/foot/${coordinates}?overview=full&geometries=geojson&steps=false&radiuses=35;35`, {
      headers: { 'User-Agent': 'TablechancePrototype/1.0 (Copenhagen dining demo)' },
      signal: AbortSignal.timeout(Math.max(1, Math.min(12000, deadline - Date.now())))
    });
    if (!response.ok) throw Error('Route service unavailable');
    const payload = await response.json();
    if (payload.code !== 'Ok' || !payload.routes?.length) throw Error('No pedestrian route');
    const route = payload.routes[0], geometry = route.geometry?.coordinates;
    if (!Array.isArray(geometry) || geometry.length < 2 ||
        geometry.some(point => !Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite)) ||
        !Number.isFinite(route.distance) || !Number.isFinite(route.duration) ||
        route.distance < 0 || route.duration < 0) throw Error('Invalid pedestrian route');
    const startGap = distance(origin, geometry[0]), endGap = distance(destination, geometry.at(-1));
    if (Math.max(startGap, endGap) > 35) throw Error('Location too far from walking network');
    const metres = route.distance + startGap + endGap;
    const result = {
      seconds: Math.ceil(Math.max(route.duration + (startGap + endGap) / 1.2, metres / 1.2) + 20),
      distance: Math.ceil(metres), geometry,
      connectors: [origin, geometry[0], geometry.at(-1), destination],
      provider: 'FOSSGIS / OpenStreetMap foot routing', checkedAt: Math.floor(Date.now() / 1000)
    };
    cache.set(key, { at: Date.now(), route: result });
    if (cache.size > 300) cache.delete(cache.keys().next().value);
    return result;
  });
  queue = task.catch(() => {});
  return task;
}
const json = (body, statusCode = 200) => ({ statusCode, headers: {
  'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff'
}, body: JSON.stringify(body) });
exports.handler = async event => {
  if (event.httpMethod !== 'GET') return json({ error: 'Method not allowed.' }, 405);
  const params = event.queryStringParameters || {};
  const lat = Number(params.lat), lng = Number(params.lng);
  if (!params.lat?.trim() || !params.lng?.trim() || !Number.isFinite(lat) || !Number.isFinite(lng))
    return json({ error: 'Choose a valid starting point.' }, 400);
  if (!(lat >= 55.60 && lat <= 55.78 && lng >= 12.45 && lng <= 12.68))
    return json({ supported: false, walks: {}, errors: {} });
  const area = data.areas.find(item => item.id === params.area);
  if (!area) return json({ error: 'Choose a valid dining experience.' }, 400);
  const origin = [lng, lat], walks = {}, errors = {}, deadline = Date.now() + 25000;
  for (const venue of data.restaurants.filter(item => area.restaurants.includes(item.id))) {
    const destination = [venue.lng, venue.lat];
    if (distance(origin, destination) > 700) { errors[venue.id] = 'outside-walking-area'; continue; }
    try { walks[venue.id] = await walk(origin, destination, deadline); }
    catch { errors[venue.id] = 'route-unavailable'; }
  }
  return json({ supported: true, walks, errors });
};
