# Tablechance Copenhagen

A separately deployed Copenhagen edition of the Tablechance surprise-dining concept. Free demo bookings; no prices or discount promises. This is not a real reservation service and none of the listed venues is a confirmed partner.

## Run

Node.js 22: `npm run build` then `npm start`. The service listens on `PORT` (default 10000). No npm dependencies or API keys are required. Run `npm test` for booking and reveal checks.

## Deploy

Render Node web service: build `npm run build`, start `npm start`, health path `/healthz`, free instance, Frankfurt region. Connect this GitHub repository and enable automatic deployment on commit. `render.yaml` contains the equivalent Blueprint configuration.

## Data and images

`restaurants.json` records sources and image credits. Venue identities, addresses and map pins are sourced from official tourism listings, restaurant websites and OpenStreetMap. All 18:00–22:00 service windows and capacity are simulated, not published restaurant availability. Remote photographs retain their original copyright; source links and credits are available in the website. Obtain appropriate restaurant and photography agreements before a commercial launch.

The circle is illustrative. `/api/walks` verifies real pedestrian routes using FOSSGIS / OpenStreetMap; route failure blocks booking. User coordinates are used transiently for routing. Bookings remain in browser local storage. Restaurant assignment happens at the reveal time, 15 minutes before the reservation, using Europe/Copenhagen local time. This client-side demo does not provide tamper-proof assignments, guaranteed inventory, server-side reservations or notifications.

## Edit

Main layout: `index.html`; styling: `styles.css`; booking and maps: `app.js`; pure logic: `core.mjs`; venue catalogue: `restaurants.json`. Commit and push changes to redeploy.

The product prompt is in `PROMPT.txt`.
