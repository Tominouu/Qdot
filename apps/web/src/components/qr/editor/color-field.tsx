"use client";

import { useId, useState } from "react";
import { isHexColor } from "@/lib/qr/scannability";
import { cn } from "@/lib/utils/cn";

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  /** `row` = label left / swatch right (desktop panel); `stacked` = input box (mobile). */
  layout?: "row" | "stacked";
}

export function ColorField({ label, value, onChange, layout = "row" }: ColorFieldProps) {
  const id = useId();
  // Draft text while the user types; otherwise the field mirrors `value`.
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? value.toUpperCase();

  const commit = (raw: string) => {
    const hex = raw.startsWith("#") ? raw : `#${raw}`;
    if (isHexColor(hex)) onChange(hex.toUpperCase());
    setDraft(null);
  };

  const swatch = (
    <label className="relative size-4 shrink-0 cursor-pointer overflow-hidden rounded-[4px] ring-1 ring-white/15 transition-transform hover:scale-110">
      <span className="absolute inset-0" style={{ background: value }} />
      <input
        type="color"
        aria-label={`${label} color picker`}
        value={value.toLowerCase()}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  );

  const hexInput = (
    <input
      id={id}
      value={text}
      spellCheck={false}
      maxLength={7}
      onChange={(e) => {
        setDraft(e.target.value.toUpperCase());
        const hex = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
        if (isHexColor(hex)) onChange(hex.toUpperCase());
      }}
      onBlur={(e) => commit(e.target.value)}
      className={cn(
        "rounded bg-transparent text-xs text-fg-strong tabular-nums outline-none focus:ring-1 focus:ring-fg-strong",
        layout === "row" ? "w-[62px] px-0.5 text-right" : "w-full px-1 text-sm",
      )}
    />
  );

  if (layout === "stacked") {
    return (
      <div className="flex h-10 items-center gap-3 rounded-lg border border-line bg-surface px-3">
        {swatch}
        <label htmlFor={id} className="sr-only">
          {label} hex value
        </label>
        {hexInput}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-xs text-muted-2">
        {label}
      </label>
      <div className="flex items-center gap-2">
        {swatch}
        {hexInput}
      </div>
    </div>
  );
}
