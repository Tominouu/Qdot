import { cn } from "@/lib/utils/cn";
import type { ShareItem } from "@/types";

const FILL_OPACITY = [0.8, 0.5, 0.4, 0.3, 0.2];

/** Label + % + thin bar rows (Geography list, mobile "Top Locations"). */
export function ShareBars({ items, className, showCount }: { items: ShareItem[]; className?: string; showCount?: boolean }) {
  return (
    <ul className={cn("flex flex-col gap-3", className)}>
      {items.map((item, i) => (
        <li key={item.label} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="text-fg-strong">{item.label}</span>
            <span className="text-subtle tabular-nums">
              {showCount && item.count !== undefined ? `${item.count.toLocaleString("en-US")} · ` : ""}
              {item.share}%
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-[3px] bg-line"
            role="meter"
            aria-label={`${item.label} share`}
            aria-valuenow={item.share}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full origin-left animate-grow-x rounded-[3px]"
              style={{
                width: `${item.share}%`,
                background: `rgba(250,250,250,${FILL_OPACITY[Math.min(i, FILL_OPACITY.length - 1)]})`,
                animationDelay: `${i * 60}ms`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
