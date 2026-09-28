"use client";

import { cn } from "@/lib/utils/cn";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  /**
   * `chips`: loose buttons, active one outlined (time ranges, library filters).
   * `track`: pills inside a dark track (Total / Unique, mobile tabs).
   */
  variant?: "chips" | "track";
  size?: "sm" | "md";
  className?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  variant = "chips",
  size = "sm",
  className,
}: SegmentedProps<T>) {
  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = options[(index + dir + options.length) % options.length];
    onChange(next.value);
    const el = (e.currentTarget.parentElement?.children[(index + dir + options.length) % options.length] as HTMLElement) ?? null;
    el?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "flex items-center",
        variant === "track" ? "gap-1 rounded-lg border border-line bg-inset p-1" : "gap-2",
        className,
      )}
    >
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onKeyDown={(e) => onKeyDown(e, i)}
            onClick={() => onChange(o.value)}
            className={cn(
              "shrink-0 font-semibold whitespace-nowrap transition-colors duration-150",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg-strong",
              variant === "track"
                ? cn("rounded-md px-3 py-1 text-xs", active ? "bg-line text-fg-strong" : "font-normal text-subtle hover:text-fg")
                : cn(
                    "rounded-md border",
                    size === "sm" ? "px-3 py-1.5 text-xs" : "rounded-lg px-4 py-2 text-[13px]",
                    active
                      ? "border-line bg-surface text-fg-strong"
                      : cn("border-transparent text-subtle hover:bg-surface/60 hover:text-fg", size === "md" && "font-medium"),
                  ),
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
