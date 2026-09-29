"use client";

import { Eyebrow } from "@/components/ui/card";
import { localizeShareLabel } from "@/lib/i18n/labels";
import { useI18n } from "@/lib/i18n/provider";
import type { ShareItem } from "@/types";

const DEVICE_COLORS = ["#e8503a", "#3b82f6", "#71717a"];
const BROWSER_COLORS = ["#e8503a", "#3b82f6", "#71717a", "#71717a"];

export function DeviceBar({ items: raw }: { items: ShareItem[] }) {
  const { t } = useI18n();
  const items = raw.map((d) => ({ ...d, label: localizeShareLabel(d.label, t) }));
  return (
    <div className="flex flex-col gap-3">
      <Eyebrow className="text-xs">{t.analytics.devices}</Eyebrow>
      <div className="flex h-6 overflow-hidden rounded-xl" role="img" aria-label={items.map((d) => `${d.label} ${d.share}%`).join(", ")}>
        {items.map((d, i) => (
          <div
            key={d.label}
            className="h-full origin-left animate-grow-x"
            style={{ width: `${d.share}%`, background: DEVICE_COLORS[i % DEVICE_COLORS.length], animationDelay: `${i * 90}ms` }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {items.map((d, i) => (
          <li key={d.label} className="flex items-center gap-1.5 text-xs text-muted-2">
            <span className="size-2 rounded-full" style={{ background: i === 0 ? "#fafafa" : DEVICE_COLORS[i] }} aria-hidden />
            {d.label} ({d.share}%)
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BrowserList({ items, title }: { items: ShareItem[]; title?: string }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-3">
      <Eyebrow className="text-xs">{title ?? t.analytics.browsers}</Eyebrow>
      <ul className="flex flex-col gap-3">
        {items.map((b, i) => (
          <li key={b.label} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex items-center gap-3 text-fg-strong">
              <span className="size-3 rounded-[2px]" style={{ background: BROWSER_COLORS[i % BROWSER_COLORS.length] }} aria-hidden />
              {localizeShareLabel(b.label, t)}
            </span>
            <span className="text-subtle tabular-nums">{b.share}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
