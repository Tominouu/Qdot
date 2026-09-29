"use client";

import { Segmented } from "@/components/ui/segmented";
import { useI18n } from "@/lib/i18n/provider";
import type { TimeRange } from "@/types";

const RANGES: TimeRange[] = ["24h", "7d", "30d", "3m", "all"];

export function RangeChips({
  value,
  onChange,
  className,
}: {
  value: TimeRange;
  onChange: (r: TimeRange) => void;
  className?: string;
}) {
  const { t } = useI18n();
  const options = RANGES.map((r) => ({ value: r, label: t.analytics.chips[r] }));
  return <Segmented label={t.analytics.timeRange} options={options} value={value} onChange={onChange} className={className} />;
}
