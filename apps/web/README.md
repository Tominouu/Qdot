# Qdot — web

Frontend for Qdot, the open-source dynamic QR code platform. Next.js (App Router) + TypeScript + Tailwind CSS v4, built from the Figma "v2" frames.

## Run

```bash
pnpm install          # from the repo root
pnpm dev              # http://localhost:3000
pnpm build && pnpm --filter web start
```

Copy `.env.example` to `.env.local`:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Qdot API, e.g. `http://localhost:4000` (see the root README). **Unset = mock mode**: fixtures from `src/data`, persisted to `localStorage` — handy for UI work without the backend. |
| `NEXT_PUBLIC_REDIRECT_BASE_URL` | Optional; only used to draw the editor preview before a code is saved. Saved codes use the API's `shortUrl`. |

With the API, `(app)` routes require a session (checked via `/auth/me`); signed-out visitors are sent to `/sign-in?next=…`.

## Structure

```text
src/
  app/                    routes
    page.tsx              landing
    onboarding/           step 1 of the create flow
    (editor)/qr-codes/    new + [id]/edit — full-screen QR editor
    (app)/                sidebar shell: qr-codes, qr-codes/[id], [id]/success,
                          analytics, campaigns/[id], settings/[section]
  components/
    ui/                   design-system primitives (Button, Field, Switch, Modal, Toast…)
    layout/               sidebar, mobile tab bar, logo, page header
    qr/                   StyledQR renderer, library, detail, success, modals
    qr/editor/            editor state (use-qr-draft) + panels
    analytics/            stat cards, Recharts charts, geo map, breakdowns
    campaigns/ settings/ onboarding/ marketing/
  lib/
    api/                  the only place that talks to the backend (mock or HTTP)
    qr/                   matrix → geometry → SVG, export, scannability, presets
    hooks/ utils/ config.ts
  types/                  QRCode, Campaign, ScanEvent, AnalyticsSummary…
  data/                   mock fixtures
```

### Onboarding & accounts (frontend only)

Flow: `/onboarding` (01 Create) → `/qr-codes/new` (02 Customize, 03 Destination) → `/onboarding/account` (04 Account) → `/qr-codes/:id/success` (05 Done). Also `/sign-in` and `/forgot-password`.

- Without a session, the editor's "Create QR code" saves the full draft (slug, type, name, destination, style, logo, campaign) with `lib/onboarding/pending-qr.ts` (sessionStorage) and continues to the Account step. `/qr-codes/new?resume=1` restores it exactly.
- After sign-up / sign-in (`components/auth/use-auth-flow.ts`), the pending code is created and the user lands on Done; with nothing pending they go to `/qr-codes`.
- `lib/api/auth.ts` calls `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`; the session is an HTTP-only cookie. `lib/auth/session.ts` only caches the signed-in user for the UI. Google sign-in and password-reset emails aren't implemented server-side yet (the UI says so).

### API layer

Every screen reads and writes through `src/lib/api/*`, which call the API (`apps/api`) when `NEXT_PUBLIC_API_URL` is set and the mock store otherwise. Request/response types come from `@qdot/types`, shared with the backend. Privacy settings are still stored in the browser (no API endpoint yet).

### QR rendering

`lib/qr/geometry.ts` turns a payload + `QRStyle` into SVG paths (patterns, eye shapes, texture, logo). The same geometry feeds the on-screen `<StyledQR>` and SVG/PNG export. Rendering rules were calibrated by decoding every pattern × eye × texture × logo combination with jsQR:

- finder patterns are always drawn solid (tile gaps break detection);
- eye centers are nudged toward the foreground until they reach 5.2:1 contrast with the background;
- texture keeps module opacity ≥ 0.82 and is disabled when a logo is embedded;
- function patterns (timing/alignment) keep a solid tile shape for dots/diamond.

The editor flags low contrast and the sparse-pattern + logo combination, which remains less reliable.

## Installable app (PWA)

Qdot installs as an app on desktop (Chrome, Edge), Android and iOS/iPadOS.

| Piece | Where |
| --- | --- |
| Web app manifest (localized, shortcuts, screenshots) | `src/app/manifest.ts` → `/manifest.webmanifest` |
| iOS tags (home-screen title, status bar, launch screens, touch icon) | `appleWebApp` / `icons` in `src/app/layout.tsx` |
| Service worker: cache-first build assets, offline page for navigations, update prompt | `public/sw.js`, `public/offline.html`, `src/lib/pwa/provider.tsx` |
| Install button (browser prompt on Chromium, Share-sheet steps on iOS) | `src/components/pwa/install-button.tsx` |
| Icons, maskable/monochrome icons, iOS launch screens, favicon | `pnpm --filter web pwa:assets` (writes `public/pwa`, `src/app/favicon.ico`) |

The service worker only registers in production builds (`next build && next start`); dev unregisters it. Each deploy registers `/sw.js?v=<APP_VERSION>` (`APP_VERSION`, else Netlify `COMMIT_REF` / Vercel commit SHA, else the build time), so users get a "new version" toast and old caches are dropped. Pages and API calls are never cached: they are per-user and per-language. Installing requires HTTPS (or `localhost`).

