# Qdot — web

Frontend for Qdot, the open-source dynamic QR code platform. Next.js (App Router) + TypeScript + Tailwind CSS v4, built from the Figma "v2" frames.

## Run

```bash
pnpm install          # from the repo root
pnpm dev              # http://localhost:3000
pnpm build && pnpm --filter web start
```

Copy `.env.example` to `.env.local` to configure:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Qdot API base URL. **Empty = mock mode** (fixtures in `src/data`, persisted to `localStorage`). |
| `NEXT_PUBLIC_REDIRECT_BASE_URL` | Redirect service encoded in every QR code (`https://qr.example.com/<slug>`). The backend records the scan and redirects; the frontend never handles scans. |

In mock mode, reset data with `localStorage.removeItem("qdot.mock.v1")`.

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

### Connecting the real API

Every screen reads and writes through `src/lib/api/*`. Each function already has an HTTP branch (`apiRequest`) used when `NEXT_PUBLIC_API_URL` is set; the paths there (`/qr-codes`, `/qr-codes/:id/analytics`, `/campaigns/:id`, `/settings/privacy`, `/me`) are placeholders to align with the backend contract once it exists.

### QR rendering

`lib/qr/geometry.ts` turns a payload + `QRStyle` into SVG paths (patterns, eye shapes, texture, logo). The same geometry feeds the on-screen `<StyledQR>` and SVG/PNG export. Rendering rules were calibrated by decoding every pattern × eye × texture × logo combination with jsQR:

- finder patterns are always drawn solid (tile gaps break detection);
- eye centers are nudged toward the foreground until they reach 5.2:1 contrast with the background;
- texture keeps module opacity ≥ 0.82 and is disabled when a logo is embedded;
- function patterns (timing/alignment) keep a solid tile shape for dots/diamond.

The editor flags low contrast and the sparse-pattern + logo combination, which remains less reliable.
