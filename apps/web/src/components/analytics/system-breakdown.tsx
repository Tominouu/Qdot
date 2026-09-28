import { Eyebrow } from "@/components/ui/card";
import type { ShareItem } from "@/types";

const DEVICE_COLORS = ["#e8503a", "#3b82f6", "#71717a"];
const BROWSER_COLORS = ["#e8503a", "#3b82f6", "#71717a", "#71717a"];

export function DeviceBar({ items }: { items: ShareItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      <Eyebrow className="text-xs">Device breakdown</Eyebrow>
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

export function BrowserList({ items, title = "Browser share" }: { items: ShareItem[]; title?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <Eyebrow className="text-xs">{title}</Eyebrow>
      <ul className="flex flex-col gap-3">
        {items.map((b, i) => (
          <li key={b.label} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex items-center gap-3 text-fg-strong">
              <span className="size-3 rounded-[2px]" style={{ background: BROWSER_COLORS[i % BROWSER_COLORS.length] }} aria-hidden />
              {b.label}
            </span>
            <span className="text-subtle tabular-nums">{b.share}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
