# Qdot

Open-source dynamic QR codes: create and customize codes, change their destination after printing, and see who scans them — without cookies or stored IP addresses.

```text
apps/web            Next.js frontend            http://localhost:3000
apps/api            Fastify API + redirects     http://localhost:4000
packages/types      Shared API contract (Zod schemas + TypeScript types)
packages/database   Drizzle schema + SQL migrations (PostgreSQL)
```

## Requirements

- Node.js 20+ and pnpm (`corepack enable`)
- PostgreSQL 14+ on `localhost:5432`
  - macOS: `brew install postgresql@16 && brew services start postgresql@16`
  - Ubuntu: `sudo apt install postgresql`

## First-time setup

```bash
pnpm install

# 1. Database + user (adjust the password)
psql -d postgres -c "CREATE USER qdot WITH PASSWORD 'qdot';"
psql -d postgres -c "CREATE DATABASE qdot OWNER qdot;"
#   (Ubuntu: prefix with `sudo -u postgres`)

# 2. Configuration
cp apps/api/.env.example apps/api/.env          # then set SESSION_SECRET: openssl rand -base64 48
cp apps/web/.env.example apps/web/.env.local    # NEXT_PUBLIC_API_URL=http://localhost:4000

# 3. Schema + GeoIP data
pnpm db:migrate
pnpm geoip:download        # optional, ~130 MB; without it scans are stored without location

# 4. Run web + API
pnpm dev
```

Open http://localhost:3000, create an account, and create a QR code.

> **No PostgreSQL yet?** `pnpm db:embedded` starts a zero-install Postgres (PGlite) on port 5432, persisted in `apps/api/data/pglite`. Use `DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres` and `DATABASE_POOL_MAX=1` (it serves one connection at a time). Development only.

## Scanning with your phone (local)

QR codes encode `QR_REDIRECT_BASE_URL/r/<code>`. `localhost` means nothing to your phone, so for real scans:

1. Find your computer's LAN IP (macOS: `ipconfig getifaddr en0`, Ubuntu: `hostname -I`).
2. In `apps/api/.env`: `QR_REDIRECT_BASE_URL=http://192.168.1.42:4000` (your IP), restart the API.
3. Phone and computer on the same Wi-Fi; allow incoming connections to Node if the firewall asks.
4. Download the code from Qdot, scan it: the API records the scan and redirects (302) to the destination. The scan shows up in the dashboard.

`shortUrl` is built from `QR_REDIRECT_BASE_URL` when codes are read, so pick your production value (e.g. `https://qr.qdot.com`) once — printed codes contain it.

## Scripts (repo root)

| Command | What it does |
| --- | --- |
| `pnpm dev` | Web (3000) + API (4000) with reload |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:generate` | Create a migration after editing `packages/database/src/schema.ts` |
| `pnpm geoip:download` | Fetch the DB-IP City Lite database (re-run monthly) |
| `pnpm test` | API integration tests (in-memory Postgres, nothing to install) |
| `pnpm typecheck` · `pnpm lint` · `pnpm build` | Checks and production builds |

## API

All responses are JSON; errors are always `{ "error": { "code": "QR_NOT_FOUND", "message": "QR code not found." } }`.
Authenticated routes use the `qdot_session` cookie (HTTP-only, signed, SameSite=Lax, 30 days sliding).

| Route | |
| --- | --- |
| `GET /health` | `{ "status": "ok" }` (checks the database) |
| `POST /auth/register` · `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` | Email + password (Argon2id). Login/register: 10 req/min/IP |
| `POST /qr` · `GET /qr` · `GET /qr/:id` · `PATCH /qr/:id` · `DELETE /qr/:id` | Owner-only. `GET /qr?status=&search=` |
| `GET /qr/:id/analytics?range=24h\|7d\|30d\|3m\|all&tz=Europe/Paris` | Aggregated on the server |
| `GET /analytics?range=&tz=` | Workspace totals across all codes |
| `POST /campaigns` · `GET /campaigns` · `GET /campaigns/:id` · `PATCH /campaigns/:id` · `DELETE /campaigns/:id` | Owner-only; deleting keeps its codes |
| `GET /campaigns/:id/analytics?tz=` | Last 7 days per code |
| `GET /r/:code` | **Public redirect**: 302 to the saved destination (`Cache-Control: no-store`), 404 unknown, 410 paused |

Security: http(s)-only destinations (validated by Zod and a DB constraint), ownership checks on every resource (other users' ids return 404), CORS restricted to `CORS_ORIGIN` with credentials, unknown `Origin` rejected on writes, no stack traces or SQL errors in responses.

## Privacy

For each scan Qdot stores: time, country/region/city, device type, OS, browser, and the referrer **hostname**.

- The IP address is used in memory for the GeoIP lookup and then discarded — never written to the database or logs.
- The raw User-Agent is not stored, only the normalized device/OS/browser.
- Unique visitors are approximated Plausible-style: `sha256(daily random salt, IP, User-Agent)`. The salt lives only in memory and changes every UTC day, so hashes can't be reversed or linked across days. Counts are "unique daily visitors"; a restart re-salts (slight overcount that day).
- Link-preview bots (WhatsApp, Slack…) and `HEAD` requests are redirected but not counted.

IP geolocation by [DB-IP](https://db-ip.com) (CC BY 4.0). Any MaxMind-format City `.mmdb` (e.g. GeoLite2-City) works via `GEOIP_DB_PATH`.

## Ubuntu VPS (later)

Nothing here is platform-specific; a plain setup is enough:

```bash
# Node 20+, pnpm, PostgreSQL installed; database/user created as above
git clone … qdot && cd qdot && pnpm install --frozen-lockfile
cp apps/api/.env.example apps/api/.env   # NODE_ENV=production, TRUST_PROXY=true, real secrets/URLs
pnpm build
pnpm --filter @qdot/api migrate:prod
node apps/api/dist/server.js             # run under systemd (Restart=always)
pnpm --filter web start                  # Next.js on :3000, also under systemd
```

Typical domains behind Caddy/Nginx (HTTPS): `app.qdot.com → :3000`, `api.qdot.com → :4000`, `qr.qdot.com → :4000` (serves `/r/:code`). With `NODE_ENV=production` cookies are `Secure`; keep `TRUST_PROXY=true` so GeoIP sees visitor IPs. Refresh GeoIP monthly with a cron job running `pnpm geoip:download`.
