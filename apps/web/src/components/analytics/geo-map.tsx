import { COUNTRY_CENTROIDS } from "@/lib/geo/country-centroids";
import { LAND_GRID, isLand } from "@/lib/geo/world-land";
import type { CountryShare } from "@/types";

/** Viewport aspect (lng° per lat°), roughly the card's map area. */
const ASPECT = 2.6;
const MIN_SPAN_LNG = 110;

/**
 * Glowing scan-density dots over a dotted world basemap (Figma "map-viz"). Equirectangular
 * projection, framed around the known countries with a minimum span so context stays visible.
 */
export function GeoMap({ points, className }: { points: CountryShare[]; className?: string }) {
  const located = points.flatMap((p) => {
    const c = COUNTRY_CENTROIDS[p.countryCode];
    return c ? [{ ...p, lat: c[0], lng: c[1] }] : [];
  });

  const view = frame(located);
  const basemap = landDots(view);

  if (!located.length) return <div className={`h-[180px] rounded-lg bg-inset ${className ?? ""}`} />;

  const maxShare = Math.max(...located.map((p) => p.share));
  const unit = view.w / 360; // keeps marker sizes constant-ish across zoom levels

  return (
    <div
      role="img"
      aria-label={`Scan locations: ${located.map((p) => `${p.label} ${p.share}%`).join(", ")}`}
      className={`relative h-[180px] overflow-hidden rounded-lg bg-inset ${className ?? ""}`}
    >
      <svg
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <radialGradient id="geo-glow">
            <stop offset="0%" stopColor="var(--qd-fg-strong)" stopOpacity={1} />
            <stop offset="70%" stopColor="var(--qd-fg-strong)" stopOpacity={0} />
          </radialGradient>
        </defs>
        <path d={basemap} fill="var(--qd-border)" opacity={0.55} />
        {located.map((p, i) => {
          const weight = p.share / maxShare;
          return (
            <g
              key={p.countryCode}
              className="animate-pop"
              style={{ animationDelay: `${i * 80}ms`, transformBox: "fill-box", transformOrigin: "center" }}
            >
              <circle cx={p.lng} cy={-p.lat} r={(8 + weight * 18) * unit} fill="url(#geo-glow)" opacity={0.18 + weight * 0.2} />
              <circle
                cx={p.lng}
                cy={-p.lat}
                r={(2.5 + weight * 1.5) * unit}
                fill="var(--qd-fg-strong)"
                opacity={0.6 + weight * 0.4}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

type View = { x: number; y: number; w: number; h: number };

/** Viewbox in (lng, -lat) space: bounding box of the points, padded, widened to ASPECT, clamped to the world. */
function frame(located: { lat: number; lng: number }[]): View {
  if (!located.length) return { x: -180, y: -84, w: 360, h: 142 };
  const lngs = located.map((p) => p.lng);
  const lats = located.map((p) => p.lat);
  const pad = 12;
  let w = Math.max(Math.max(...lngs) - Math.min(...lngs) + pad * 2, MIN_SPAN_LNG);
  let h = Math.max(Math.max(...lats) - Math.min(...lats) + pad * 2, w / ASPECT);
  w = Math.min(Math.max(w, h * ASPECT), 360);
  h = Math.min(w / ASPECT, LAND_GRID.north - LAND_GRID.south);
  const cx = (Math.max(...lngs) + Math.min(...lngs)) / 2;
  const cy = -(Math.max(...lats) + Math.min(...lats)) / 2;
  const x = clamp(cx - w / 2, -180, 180 - w);
  const y = clamp(cy - h / 2, -LAND_GRID.north, -LAND_GRID.south - h);
  return { x, y, w, h };
}

/** One path of small circles, one per land cell in view; coarser grid when zoomed out. */
function landDots(view: View): string {
  const step = view.w > 200 ? 2 : 1;
  const r = step * 0.32;
  const out: string[] = [];
  for (let row = 0; row < LAND_GRID.rows; row += step) {
    const lat = LAND_GRID.north - row - step / 2;
    if (-lat < view.y - step || -lat > view.y + view.h + step) continue;
    for (let col = 0; col < LAND_GRID.cols; col += step) {
      const lng = LAND_GRID.west + col + step / 2;
      if (lng < view.x - step || lng > view.x + view.w + step) continue;
      if (!isLand(row, col) && !(step > 1 && isLand(row + 1, col + 1))) continue;
      out.push(`M${lng - r} ${-lat}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`);
    }
  }
  return out.join("");
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}
