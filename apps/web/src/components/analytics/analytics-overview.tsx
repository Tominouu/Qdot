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
import { useI18n } from "@/lib/i18n/provider";
import { formatNumber } from "@/lib/utils/format";
import type { TimeRange } from "@/types";
import { EmptyChartVisual } from "./empty-chart-visual";
import { GeoMap } from "./geo-map";
import { RangeChips } from "./range-chips";
import { ScansLineChart } from "./scans-line-chart";
import { ShareBars } from "./share-bars";
import { StatCard, StatCardSkeleton } from "./stat-card";
import { BrowserList, DeviceBar } from "./system-breakdown";

function DateRangeSelect({ value, onChange }: { value: TimeRange; onChange: (r: TimeRange) => void }) {
  const { t } = useI18n();
  const ranges = t.analytics.ranges;
  return (
    <label className="relative inline-flex h-[37px] cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-4 text-[13px] font-semibold text-fg transition-colors hover:border-line-strong focus-within:border-fg-strong">
      <Calendar className="size-3.5" aria-hidden />
      <span>{ranges[value]}</span>
      <ChevronDown className="size-3.5 text-muted md:hidden" aria-hidden />
      <select
        aria-label={t.analytics.dateRange}
        value={value}
        onChange={(e) => onChange(e.target.value as TimeRange)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {Object.entries(ranges).map(([v, l]) => (
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
  const { t, locale } = useI18n();
  const a = t.analytics;

  if (data && data.totalScans === 0) {
    return (
      <EmptyState
        className="min-h-[70dvh]"
        visual={<EmptyChartVisual />}
        title={a.emptyTitle}
        description={a.emptyDescription}
        actions={<Pill className="bg-surface px-2.5 py-1.5 font-semibold text-muted-2">{a.realtime}</Pill>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <PageHeader
        title={a.title}
        description={a.description}
        actions={<DateRangeSelect value={range} onChange={setRange} />}
      />

      <section aria-label={a.keyMetrics} className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:overflow-visible sm:px-0">
        <div className="grid w-max grid-cols-4 gap-3 sm:w-auto sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
          {data && !loading ? (
            <>
              <StatCard
                className="w-[180px] sm:w-auto"
                label={a.totalScans}
                value={formatNumber(data.totalScans, locale)}
                delta={data.totalScansDelta?.value}
                sparkline={data.sparklines.total}
              />
              <StatCard
                className="w-[180px] sm:w-auto"
                label={a.uniqueScans}
                value={formatNumber(data.uniqueScans, locale)}
                delta={data.uniqueScansDelta?.value}
                sparkline={data.sparklines.unique}
              />
              <StatCard className="w-[180px] sm:w-auto" label={a.countries} value={data.countryCount} icon={<Globe />} footnote={a.globalDistribution} />
              <StatCard className="w-[180px] sm:w-auto" label={a.activeCodes} value={data.activeCodes} icon={<QrCode />} footnote={a.trackingRealtime} />
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
              <span className="md:hidden">{a.scansTrend}</span>
              <span className="hidden md:inline">{a.scansOverTime}</span>
            </CardTitle>
            <Segmented
              variant="track"
              label={a.metric}
              value={metric}
              onChange={setMetric}
              options={[
                { value: "total", label: a.total },
                { value: "unique", label: a.unique },
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
            label={a.chartLabel(metric === "total" ? a.total : a.unique, a.ranges[range].toLowerCase())}
          />
        ) : (
          <Skeleton className="h-[280px] w-full" />
        )}
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-5 p-5 md:p-6">
          <CardTitle>
            <span className="md:hidden">{a.topLocations}</span>
            <span className="hidden md:inline">{a.geography}</span>
          </CardTitle>
          {data ? (
            <>
              <GeoMap points={data.countries} className="hidden md:block" />
              <ShareBars items={data.countries} />
            </>
          ) : (
            <Skeleton className="h-[360px] w-full" />
          )}
        </Card>
        <Card className="flex flex-col gap-5 p-5 md:p-6">
          <CardTitle>{a.system}</CardTitle>
          {data ? (
            <>
              <DeviceBar items={data.devices} />
              <hr className="border-line" />
              <BrowserList items={data.browsers} />
              {data.operatingSystems.length > 0 && <BrowserList title={a.operatingSystems} items={data.operatingSystems} />}
              {data.referrers.length > 0 && <BrowserList title={a.referrers} items={data.referrers} />}
            </>
          ) : (
            <Skeleton className="h-[240px] w-full" />
          )}
        </Card>
      </div>
    </div>
  );
}
