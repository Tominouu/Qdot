"use client";

import { eyePaths, modulePath } from "@/lib/qr/geometry";
import { cn } from "@/lib/utils/cn";
import type { QREyeShape, QRPattern } from "@/types";

interface OptionPickerProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  renderPreview: (v: T) => React.ReactNode;
}

/** Row of four selectable tiles (Pattern / Eye Shape) with arrow-key navigation. */
export function OptionPicker<T extends string>({ label, options, value, onChange, renderPreview }: OptionPickerProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-4 gap-2">
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
              if (!dir) return;
              e.preventDefault();
              const next = (i + dir + options.length) % options.length;
              onChange(options[next].value);
              (e.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
            }}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1 rounded-lg border bg-surface p-2 transition-[border-color,background-color,transform] duration-150",
              "hover:bg-surface-raised active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg-strong",
              active ? "border-fg-strong" : "border-line hover:border-line-strong",
            )}
          >
            <span className="flex size-6 items-center justify-center rounded-[4px] bg-surface-raised text-fg">{renderPreview(o.value)}</span>
            <span className={cn("truncate text-[10px]", active ? "text-fg" : "text-muted")}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function PatternPreview({ pattern }: { pattern: QRPattern }) {
  const cells = [
    [0, 0],
    [2, 0],
    [1, 1],
    [0, 2],
    [2, 2],
  ];
  return (
    <svg viewBox="0 0 3 3" className="size-4" aria-hidden>
      <path d={cells.map(([x, y]) => modulePath(pattern, x, y)).join("")} fill="currentColor" />
    </svg>
  );
}

export function EyePreview({ shape }: { shape: QREyeShape }) {
  const eye = eyePaths(shape, "rounded", 0, 0);
  return (
    <svg viewBox="0 0 7 7" className="size-4" aria-hidden>
      <path d={eye.frame} fill="currentColor" fillRule={eye.frameRule} />
      <path d={eye.ball} fill="#e8503a" />
    </svg>
  );
}
