"use client";

import { Calendar, ChevronDown, Globe, QrCode } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Pill } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { getAnalyticsSummary } from "@/lib/api/analytics";
import { useResource } from "@/lib/hooks/use-resource";
import { formatNumber } from "@/lib/utils/format";
import type { TimeRange } from "@/types";
import { EmptyChartVisual } from "./empty-chart-visual";
import { GeoMap } from "./geo-map";
import { RangeChips } from "./range-chips";
import { ScansLineChart } from "./scans-line-chart";
import { ShareBars } from "./share-bars";
import { StatCard, StatCardSkeleton } from "./stat-card";
import { BrowserList, DeviceBar } from "./system-breakdown";

const RANGE_LABELS: Record<TimeRange, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "3m": "Last 3 months",
  all: "All time",
};

function DateRangeSelect({ value, onChange }: { value: TimeRange; onChange: (r: TimeRange) => void }) {
  return (
    <label className="relative inline-flex h-[37px] cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-4 text-[13px] font-semibold text-fg transition-colors hover:border-line-strong focus-within:border-fg-strong">
      <Calendar className="size-3.5" aria-hidden />
      <span>{RANGE_LABELS[value]}</span>
      <ChevronDown className="size-3.5 text-muted md:hidden" aria-hidden />
      <select
        aria-label="Date range"
        value={value}
        onChange={(e) => onChange(e.target.value as TimeRange)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {Object.entries(RANGE_LABELS).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AnalyticsOverview() {
  const [range, setRange] = useState<TimeRange>("30d");
  const [metric, setMetric] = useState<"total" | "unique">("total");
  const { data, loading } = useResource(() => getAnalyticsSummary(range), [range]);

  if (data && data.totalScans === 0) {
    return (
      <EmptyState
        className="min-h-[70dvh]"
        visual={<EmptyChartVisual />}
        title="Your analytics will appear here"
        description="Once your QR codes start getting scans, you'll see detailed analytics."
        actions={<Pill className="bg-surface px-2.5 py-1.5 font-semibold text-muted-2">Analytics update in real-time</Pill>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <PageHeader
        title="Analytics Overview"
        description="Track performance across all generated QR assets."
        actions={<DateRangeSelect value={range} onChange={setRange} />}
      />

      <section aria-label="Key metrics" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:overflow-visible sm:px-0">
        <div className="grid w-max grid-cols-4 gap-3 sm:w-auto sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
          {data && !loading ? (
            <>
              <StatCard
                className="w-[180px] sm:w-auto"
                label="Total scans"
                value={formatNumber(data.totalScans)}
                delta={data.totalScansDelta.value}
                sparkline={data.sparklines.total}
              />
              <StatCard
                className="w-[180px] sm:w-auto"
                label="Unique scans"
                value={formatNumber(data.uniqueScans)}
                delta={data.uniqueScansDelta.value}
                sparkline={data.sparklines.unique}
              />
              <StatCard className="w-[180px] sm:w-auto" label="Countries" value={data.countries} icon={<Globe />} footnote="Global scanning distribution" />
              <StatCard className="w-[180px] sm:w-auto" label="Active codes" value={data.activeCodes} icon={<QrCode />} footnote="Tracking in real-time" />
            </>
          ) : (
            Array.from({ length: 4 }, (_, i) => <StatCardSkeleton key={i} className="w-[180px] sm:w-auto" />)
          )}
        </div>
      </section>

      <Card className="flex flex-col gap-6 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <CardTitle>
              <span className="md:hidden">Scans Trend</span>
              <span className="hidden md:inline">Scans over time</span>
            </CardTitle>
            <Segmented
              variant="track"
              label="Metric"
              value={metric}
              onChange={setMetric}
              options={[
                { value: "total", label: "Total" },
                { value: "unique", label: "Unique" },
              ]}
            />
          </div>
          <RangeChips value={range} onChange={setRange} className="hidden md:flex" />
        </div>
        {data && !loading ? (
          <ScansLineChart
            data={data.timeseries}
            metric={metric}
            height={280}
            label={`${metric === "total" ? "Total" : "Unique"} scans, ${RANGE_LABELS[range].toLowerCase()}`}
          />
        ) : (
          <Skeleton className="h-[280px] w-full" />
        )}
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-5 p-5 md:p-6">
          <CardTitle>
            <span className="md:hidden">Top Locations</span>
            <span className="hidden md:inline">Geography Distribution</span>
          </CardTitle>
          {data ? (
            <>
              <GeoMap points={data.geography} className="hidden md:block" />
              <ShareBars items={data.geography} />
            </>
          ) : (
            <Skeleton className="h-[360px] w-full" />
          )}
        </Card>
        <Card className="flex flex-col gap-5 p-5 md:p-6">
          <CardTitle>System Information</CardTitle>
          {data ? (
            <>
              <DeviceBar items={data.devices} />
              <hr className="border-line" />
              <BrowserList items={data.browsers} />
            </>
          ) : (
            <Skeleton className="h-[240px] w-full" />
          )}
        </Card>
      </div>
    </div>
  );
}
