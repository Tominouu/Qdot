"use client";

import { Segmented } from "@/components/ui/segmented";
import type { TimeRange } from "@/types";

const RANGES: { value: TimeRange; label: string }[] = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "3m", label: "3m" },
  { value: "all", label: "All" },
];

export function RangeChips({
  value,
  onChange,
  options = RANGES,
  className,
}: {
  value: TimeRange;
  onChange: (r: TimeRange) => void;
  options?: { value: TimeRange; label: string }[];
  className?: string;
}) {
  return <Segmented label="Time range" options={options} value={value} onChange={onChange} className={className} />;
}
