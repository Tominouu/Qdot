"use client";

import { ImageIcon, X } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

const MAX_BYTES = 1024 * 1024;
const ACCEPT = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];

interface LogoDropzoneProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  onError: (message: string) => void;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function LogoDropzone({ value, onChange, onError }: LogoDropzoneProps) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const accept = async (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPT.includes(file.type)) return onError("Logo must be a PNG, JPG, SVG or WebP image");
    if (file.size > MAX_BYTES) return onError("Logo must be smaller than 1 MB");
    onChange(await readAsDataUrl(file));
  };

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-line p-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- user-supplied data URL */}
        <img src={value} alt="Uploaded logo" className="size-10 rounded-md bg-surface object-contain" />
        <p className="flex-1 text-xs text-muted">Logo embedded · error correction raised to H</p>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remove logo"
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
        <span className="text-xs text-muted">Drop your logo here</span>
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
