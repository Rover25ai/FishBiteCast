# fishbitecast.com

fishbitecast.com is a Next.js web app that generates a freshwater fishing forecast score from location, weather, and moon phase.

## Current Feature Highlights

- Bite Score (0-100) with explainable weather + moon factor breakdown
- Best weather-driven windows for the next 24 hours
- Solunar major/minor feeding windows (modeled moonrise/set + overhead/underfoot)
- Manual city search fallback when geolocation is denied
- Offline cached forecast fallback with last-updated indicator

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + custom CSS theme
- Recharts for hourly charting
- Open-Meteo for weather + geocoding (no API keys)
- Local moon-phase approximation
- Vitest (unit) + Playwright (E2E)

## Run

```bash
npm install
npm run dev
```

Then open `https://localhost:3010`.

## Test

```bash
npm run test
npm run test:e2e
```

## Build

```bash
npm run build
npm run start
```

## HTTPS on Port 443 (Let's Encrypt)

This repo now includes a production TLS stack using Docker + Caddy.

1. Confirm DNS:
- `fishbitecast.com` and `www.fishbitecast.com` must point to this server's public IP.

2. Open firewall:
- Allow inbound TCP `80` and `443`.

3. Set production env values:

```bash
cp .env.production.example .env.production
```

Update `.env.production`:
- `DOMAIN=fishbitecast.com`
- `ACME_EMAIL=<your-email>`

4. Start TLS stack (binds host ports `80` and `443`):

```bash
npm run tls:up
```

5. View logs:

```bash
npm run tls:logs
```

6. Stop stack:

```bash
npm run tls:down
```

Notes:
- `localhost` is also configured with Caddy `tls internal` for local smoke testing.
- Let's Encrypt issuance will fail until DNS + public reachability for `DOMAIN` are correct.

## Deploy (Vercel)

1. Push this folder to a Git repository.
2. Import the project in Vercel.
3. Framework preset: Next.js.
4. No required environment variables.
5. Deploy.

## Privacy

- Geolocation is used only in-browser to request weather for selected coordinates.
- No user account or personal profile data is required.
- Cached forecast and settings are stored locally in browser storage.

## Backlog

- Solunar tables
- Catch log + notes
- Web push notifications for peak windows
- Optional cloud sync for multi-device history
