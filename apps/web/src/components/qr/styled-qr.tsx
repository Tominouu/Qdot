import { useMemo } from "react";
import { buildQRGeometry } from "@/lib/qr/geometry";
import { cn } from "@/lib/utils/cn";
import type { QRStyle } from "@/types";

interface StyledQRProps {
  /** Encoded payload — for dynamic codes this is the redirect short URL. */
  value: string;
  style: QRStyle;
  /** Rendered edge length in px (CSS). Omit to fill the container. */
  size?: number;
  /** Draw the style background behind modules (off when the parent card provides it). */
  withBackground?: boolean;
  className?: string;
  title?: string;
}

/**
 * Real, scannable QR code rendered as SVG with Qdot styling
 * (pattern, eye shape, colors, texture, logo). Works on server and client.
 */
export function StyledQR({ value, style, size, withBackground = false, className, title }: StyledQRProps) {
  const g = useMemo(() => buildQRGeometry(value, style), [value, style]);
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
      {withBackground && <rect width={g.viewBox} height={g.viewBox} fill={g.background} rx={1.2} />}
      {g.layers.map((l, i) => (
        <path
          key={i}
          d={l.d}
          fill={l.fill}
          fillOpacity={l.opacity < 1 ? l.opacity : undefined}
          fillRule={l.fillRule}
          className="transition-[fill] duration-200"
        />
      ))}
      {g.logo && (
        <g>
          <rect x={g.logo.x} y={g.logo.y} width={g.logo.size} height={g.logo.size} rx={1} fill={g.background} />
          <image
            href={g.logo.href}
            x={g.logo.x + g.logo.padding}
            y={g.logo.y + g.logo.padding}
            width={g.logo.size - g.logo.padding * 2}
            height={g.logo.size - g.logo.padding * 2}
            preserveAspectRatio="xMidYMid meet"
          />
        </g>
      )}
    </svg>
  );
}
