"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChannelSeries } from "@/types";
import { CHART, SERIES_COLORS } from "./chart-theme";
import { ChartTooltipCard } from "./chart-tooltip";

interface ChannelsLineChartProps {
  labels: string[];
  channels: ChannelSeries[];
  height?: number;
}

/** "Scans over time · By Channel": one line per QR code in the campaign. */
export function ChannelsLineChart({ labels, channels, height = 240 }: ChannelsLineChartProps) {
  const data = useMemo(
    () => labels.map((label, i) => Object.fromEntries([["label", label], ...channels.map((c) => [c.qrCodeId, c.points[i]])])),
    [labels, channels],
  );
  const colorOf = (i: number) => SERIES_COLORS[i % SERIES_COLORS.length];

  return (
    <div className="flex flex-col gap-4">
      <div role="img" aria-label={`Scans per day by QR code: ${channels.map((c) => c.name).join(", ")}`} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} strokeOpacity={0.45} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: CHART.axis, fontSize: 12 }} tickMargin={14} interval={0} />
            <YAxis hide domain={[0, (max: number) => Math.ceil(max * 1.1)]} />
            <Tooltip
              cursor={{ stroke: CHART.cursor, strokeDasharray: "4 4", strokeWidth: 1.25 }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <ChartTooltipCard
                    label={String(label)}
                    rows={channels.map((c, i) => ({
                      name: c.name,
                      value: Number(payload.find((p) => p.dataKey === c.qrCodeId)?.value ?? 0),
                      color: colorOf(i),
                    }))}
                  />
                ) : null
              }
            />
            {channels.map((c, i) => (
              <Line
                key={c.qrCodeId}
                type="linear"
                dataKey={c.qrCodeId}
                name={c.name}
                stroke={colorOf(i)}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4.5, fill: colorOf(i), stroke: CHART.surface, strokeWidth: 2 }}
                animationDuration={700}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legend">
        {channels.map((c, i) => (
          <li key={c.qrCodeId} className="flex items-center gap-2 text-xs text-muted-2">
            <span className="h-0.5 w-4 rounded-full" style={{ background: colorOf(i) }} aria-hidden />
            {c.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
