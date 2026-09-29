"use client";

import { ChevronDown, ImageIcon, X } from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils/cn";
import { MAX_LOGO_DATA_URL_LENGTH } from "@/types";

/** Collapsible panel section (Design tab). */
export function Accordion({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className="border-b border-line last:border-b-0">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 font-display text-xs font-bold text-subtle uppercase transition-colors hover:text-fg"
        >
          {title}
          <ChevronDown className={cn("size-4 transition-transform duration-200", open && "rotate-180")} aria-hidden />
        </button>
      </h3>
      <div id={id} hidden={!open} className="flex flex-col gap-4 px-4 pb-5">
        {children}
      </div>
    </section>
  );
}

/** Static section header (Content column, Settings tab). */
export function PanelSection({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={className} aria-label={title}>
      <h2 className="border-b border-line bg-surface px-4 py-3 font-display text-xs font-bold text-subtle uppercase">{title}</h2>
      <div className="flex flex-col gap-4 p-4">{children}</div>
    </section>
  );
}

export function ControlLabel({ children, htmlFor, aside }: { children: ReactNode; htmlFor?: string; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={htmlFor} className="text-xs text-muted-2">
        {children}
      </label>
      {aside && <span className="text-xs text-subtle tabular-nums">{aside}</span>}
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <ControlLabel htmlFor={id} aside={format ? format(value) : value}>
        {label}
      </ControlLabel>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-accent"
      />
    </div>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex border-b border-line bg-surface">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={tab.value === value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "flex-1 border-b-2 px-4 py-3 font-display text-xs font-bold uppercase transition-colors",
            tab.value === value ? "border-accent text-fg-strong" : "border-transparent text-subtle hover:text-fg",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

const ACCEPT = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Upload for the logo and the background image: type/size checked before anything is stored. */
export function ImageDropzone({
  value,
  onChange,
  onError,
  dropLabel,
  removeLabel,
  caption,
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  onError: (message: string) => void;
  dropLabel: string;
  removeLabel: string;
  caption?: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const { t } = useI18n();

  const accept = async (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPT.includes(file.type)) return onError(t.editor.logo.badType);
    const dataUrl = await readAsDataUrl(file);
    if (dataUrl.length > MAX_LOGO_DATA_URL_LENGTH) return onError(t.editor.logo.tooBig);
    onChange(dataUrl);
  };

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-line p-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- user-supplied data URL */}
        <img src={value} alt={t.editor.logo.uploaded} className="size-10 rounded-md bg-surface object-contain" />
        <p className="flex-1 text-xs text-muted">{caption}</p>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={removeLabel}
          className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface-raised hover:text-fg"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          accept(e.dataTransfer.files[0]);
        }}
        className={cn(
          "flex w-full flex-col items-center gap-2 rounded-lg border border-dashed p-5 text-center transition-colors",
          dragging ? "border-fg-strong bg-surface" : "border-line hover:border-line-strong hover:bg-surface/50",
        )}
      >
        <ImageIcon className="size-[18px] text-muted" aria-hidden />
        <span className="text-xs text-muted">{dropLabel}</span>
      </button>
      <input
        ref={input}
        type="file"
        accept={ACCEPT.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          accept(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </>
  );
}
