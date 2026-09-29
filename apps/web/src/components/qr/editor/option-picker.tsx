"use client";

import { eyePaths } from "@/lib/qr/render/eyes";
import { MODULE_SHAPE_DEFS } from "@/lib/qr/render/shapes";
import { cn } from "@/lib/utils/cn";
import type { EyeCenterShape, EyeFrameShape, ModuleShape } from "@/types";

interface OptionPickerProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  renderPreview: (v: T) => React.ReactNode;
  columns?: 3 | 4 | 5;
}

/** Grid of selectable tiles with a live shape preview and arrow-key navigation. */
export function OptionPicker<T extends string>({ label, options, value, onChange, renderPreview, columns = 4 }: OptionPickerProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("grid gap-2", { 3: "grid-cols-3", 4: "grid-cols-4", 5: "grid-cols-5" }[columns])}>
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.label}
            title={o.label}
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
            <span className="flex size-7 items-center justify-center rounded-[4px] bg-surface-raised text-fg">{renderPreview(o.value)}</span>
            <span className={cn("w-full truncate text-center text-[10px]", active ? "text-fg" : "text-muted")}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** 4×4 sample with an L-shaped cluster so connected shapes (classy, extra-rounded) show their joins. */
const SAMPLE = ["1101", "1001", "0011", "1011"].map((row) => [...row].map((c) => c === "1"));

export function ModuleShapePreview({ shape }: { shape: ModuleShape }) {
  const dark = (r: number, c: number) => SAMPLE[r]?.[c] ?? false;
  let d = "";
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (dark(r, c)) d += MODULE_SHAPE_DEFS[shape].path(c, r, { top: dark(r - 1, c), right: dark(r, c + 1), bottom: dark(r + 1, c), left: dark(r, c - 1) });
  return (
    <svg viewBox="-0.3 -0.3 4.6 4.6" className="size-5" aria-hidden>
      <path d={d} fill="currentColor" />
    </svg>
  );
}

export function EyePreview({ outer, inner, center }: { outer: EyeFrameShape; inner: EyeFrameShape; center: EyeCenterShape }) {
  const eye = eyePaths(outer, inner, center, 0, 0);
  return (
    <svg viewBox="-0.2 -0.2 7.4 7.4" className="size-5" aria-hidden>
      <path d={eye.frame} fill="currentColor" fillRule="evenodd" />
      <path d={eye.center} fill="#e8503a" />
    </svg>
  );
}
