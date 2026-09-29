"use client";

import { useId, useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { localizeTimeLabel } from "@/lib/i18n/labels";
import { useI18n } from "@/lib/i18n/provider";
import type { TimeSeriesPoint } from "@/types";
import { CHART, SEGMENT_COLORS } from "./chart-theme";
import { ChartTooltipCard } from "./chart-tooltip";

interface ScansLineChartProps {
  data: TimeSeriesPoint[];
  metric?: "total" | "unique";
  height?: number;
  /** Accessible summary of what the chart shows. */
  label: string;
}

interface CursorProps {
  points?: { x: number; y: number }[];
  height?: number;
  top?: number;
}

function DashedCursor({ points, top = 0, height = 0 }: CursorProps) {
  if (!points?.length) return null;
  const x = points[0].x;
  return <line x1={x} x2={x} y1={top} y2={top + height} stroke={CHART.cursor} strokeWidth={1.25} strokeDasharray="4 4" />;
}

/**
 * Single-series scans chart. The multi-colored segments are a decorative
 * signature of the Figma design (color does not encode data here).
 */
export function ScansLineChart({ data: raw, metric = "total", height = 240, label }: ScansLineChartProps) {
  const gradientId = useId().replace(/:/g, "");
  const { t, locale } = useI18n();
  const data = useMemo(() => raw.map((p) => ({ ...p, label: localizeTimeLabel(p.label, locale) })), [raw, locale]);
  const peakIndex = useMemo(
    () => data.reduce((best, p, i) => (p[metric] > data[best][metric] ? i : best), 0),
    [data, metric],
  );

  // Hard-stop gradient: split the line into up to 6 equal colored bands.
  const stops = useMemo(() => {
    const bands = Math.max(1, Math.min(6, data.length - 1));
    return Array.from({ length: bands }, (_, i) => ({
      from: i / bands,
      to: (i + 1) / bands,
      color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
    }));
  }, [data.length]);

  if (!data.length) return null;

  return (
    <div role="img" aria-label={label} style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              {stops.flatMap((s) => [
                <stop key={`${s.from}-a`} offset={s.from} stopColor={s.color} />,
                <stop key={`${s.from}-b`} offset={s.to} stopColor={s.color} />,
              ])}
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={CHART.grid} strokeOpacity={0.45} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: CHART.axis, fontSize: 12 }}
            tickMargin={14}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis hide domain={[0, (max: number) => Math.ceil(max * 1.1)]} />
          <Tooltip
            defaultIndex={peakIndex}
            cursor={<DashedCursor />}
            content={({ active, payload, label: l }) =>
              active && payload?.length ? (
                <ChartTooltipCard
                  label={String(l)}
                  rows={[{ name: metric === "total" ? t.analytics.totalScans : t.analytics.uniqueScans, value: Number(payload[0].value) }]}
                />
              ) : null
            }
          />
          <Line
            type="linear"
            dataKey={metric}
            stroke={`url(#${gradientId})`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: CHART.activeDot, stroke: CHART.surface, strokeWidth: 2 }}
            animationDuration={700}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
