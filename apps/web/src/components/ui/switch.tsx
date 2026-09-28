"use client";

import { cn } from "@/lib/utils/cn";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  /** `accent` is the coral pill used in the editor; `neutral` is the settings toggle. */
  tone?: "neutral" | "accent";
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked, onCheckedChange, label, tone = "neutral", size = "md", disabled, className }: SwitchProps) {
  const dims = size === "sm" ? "h-5 w-9" : "h-6 w-11";
  const knob = size === "sm" ? "size-3.5 data-[on=true]:translate-x-4" : "size-[18px] data-[on=true]:translate-x-5";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      data-on={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center rounded-full p-[3px] transition-colors duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg-strong disabled:opacity-50",
        dims,
        checked ? (tone === "accent" ? "bg-accent" : "bg-fg") : "bg-line",
        className,
      )}
    >
      <span
        data-on={checked}
        className={cn(
          "block rounded-full shadow-sm transition-transform duration-200 ease-out",
          knob,
          checked ? (tone === "accent" ? "bg-white" : "bg-[#d4d4d8]") : "bg-subtle",
        )}
      />
    </button>
  );
}
