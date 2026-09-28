import { COUNTRY_CENTROIDS } from "@/lib/geo/country-centroids";
import type { CountryShare } from "@/types";

/**
 * Glowing scan-density dots on a dark canvas (Figma "map-viz"). Points are
 * projected equirectangularly into the bounding box of the known countries.
 */
export function GeoMap({ points, className }: { points: CountryShare[]; className?: string }) {
  const located = points.flatMap((p) => {
    const c = COUNTRY_CENTROIDS[p.countryCode];
    return c ? [{ ...p, lat: c[0], lng: c[1] }] : [];
  });
  if (!located.length) return <div className={`h-[180px] rounded-lg bg-inset ${className ?? ""}`} />;

  const lngs = located.map((p) => p.lng);
  const lats = located.map((p) => p.lat);
  const pad = 4;
  const [minLng, maxLng] = [Math.min(...lngs) - pad, Math.max(...lngs) + pad];
  const [minLat, maxLat] = [Math.min(...lats) - pad, Math.max(...lats) + pad];
  const maxShare = Math.max(...located.map((p) => p.share));

  return (
    <div
      role="img"
      aria-label={`Scan locations: ${located.map((p) => `${p.label} ${p.share}%`).join(", ")}`}
      className={`relative h-[180px] overflow-hidden rounded-lg bg-inset ${className ?? ""}`}
    >
      {located.map((p, i) => {
        const x = ((p.lng - minLng) / (maxLng - minLng)) * 100;
        const y = (1 - (p.lat - minLat) / (maxLat - minLat)) * 100;
        const weight = p.share / maxShare;
        const glow = 16 + weight * 36;
        return (
          <span key={p.countryCode} className="absolute animate-pop" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 80}ms` }}>
            <span
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: glow,
                height: glow,
                background: `radial-gradient(circle, rgba(250,250,250,${0.18 + weight * 0.2}) 0%, rgba(250,250,250,0) 70%)`,
              }}
            />
            <span
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg-strong"
              style={{ width: 5 + weight * 3, height: 5 + weight * 3, opacity: 0.6 + weight * 0.4 }}
            />
          </span>
        );
      })}
    </div>
  );
}
