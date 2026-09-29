import { useId, useMemo } from "react";
import { buildQRGeometry, gradientVector, type QRGeometry } from "@/lib/qr/render/geometry";
import { layerFill } from "@/lib/qr/render/svg";
import { cn } from "@/lib/utils/cn";
import type { QRDesign } from "@/types";

interface StyledQRProps {
  /** Encoded payload: the redirect short URL for dynamic codes, the content itself for static ones. */
  value: string;
  design: QRDesign;
  /** Rendered edge length in px (CSS). Omit to fill the container. */
  size?: number;
  /**
   * Draw the quiet zone and background (editor preview, standalone display).
   * Off by default: cards draw the symbol edge-to-edge on their own background.
   */
  framed?: boolean;
  className?: string;
  title?: string;
}

/**
 * Real, scannable QR code rendered as SVG with the full Qdot design
 * (shapes, eyes, gradients, texture, background, logo). Works on server and client.
 */
export function StyledQR({ value, design, size, framed = false, className, title }: StyledQRProps) {
  const g = useMemo(() => buildQRGeometry(value, design, framed ? {} : { margin: 0 }), [value, design, framed]);
  const gradientId = `qdot-g${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      viewBox={`0 0 ${g.viewBox} ${g.viewBox}`}
      width={size}
      height={size}
      role="img"
      aria-label={title ?? `QR code for ${value}`}
      shapeRendering="geometricPrecision"
      className={cn("block", !size && "h-auto w-full", className)}
    >
      <ModuleGradient g={g} id={gradientId} />
      {framed && g.background && <rect width={g.viewBox} height={g.viewBox} fill={g.background} />}
      {framed && g.backgroundImage && (
        <image href={g.backgroundImage.href} width={g.viewBox} height={g.viewBox} preserveAspectRatio="xMidYMid slice" opacity={g.backgroundImage.opacity} />
      )}
      {g.layers.map((l, i) => (
        <path
          key={i}
          d={l.d}
          fill={layerFill(g, l.paint, gradientId)}
          fillOpacity={l.opacity < 1 ? l.opacity : undefined}
          fillRule={l.fillRule}
          className="transition-[fill] duration-200"
        />
      ))}
      {g.logo && (
        <g>
          {g.logo.plate && <path d={g.logo.plate.d} fill={g.logo.plate.color} />}
          <image href={g.logo.href} x={g.logo.x} y={g.logo.y} width={g.logo.size} height={g.logo.size} preserveAspectRatio="xMidYMid meet" />
        </g>
      )}
    </svg>
  );
}

function ModuleGradient({ g, id }: { g: QRGeometry; id: string }) {
  const fill = g.moduleFill;
  if (fill.type === "solid") return null;
  const v = gradientVector(g, fill.rotation);
  const stops = fill.stops.map((s, i) => <stop key={i} offset={s.offset} stopColor={s.color} />);
  return (
    <defs>
      {fill.type === "linear" ? (
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={v.x1} y1={v.y1} x2={v.x2} y2={v.y2}>
          {stops}
        </linearGradient>
      ) : (
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={v.cx} cy={v.cy} r={v.r}>
          {stops}
        </radialGradient>
      )}
    </defs>
  );
}

/**
 * Small QR on its own background (cards, lists, modals), so any design stays
 * visible whatever the surrounding surface. Transparent designs sit on a checkerboard.
 */
export function QRThumbnail({ value, design, size, title, className }: { value: string; design: QRDesign; size: number; title?: string; className?: string }) {
  const pad = Math.max(4, Math.round(size * 0.08));
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-[10px]",
        design.background.transparent && "bg-[length:12px_12px] bg-[repeating-conic-gradient(#3f3f46_0%_25%,#27272a_0%_50%)]",
        className,
      )}
      style={{ padding: pad, background: design.background.transparent ? undefined : design.background.color }}
    >
      <StyledQR value={value} design={design} size={size} title={title} />
    </span>
  );
}
