"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { useToast } from "./toast";

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
  iconClassName?: string;
  toastMessage?: string;
}

/** Icon button that copies `value` and flips to a check mark for feedback. */
export function CopyButton({ value, label = "Copy link", className, iconClassName, toastMessage = "Link copied to clipboard" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : label}
      onClick={async () => {
        await copyText(value);
        setCopied(true);
        toast(toastMessage, "info");
      }}
      className={cn("inline-flex rounded-md p-1 text-muted transition-colors hover:bg-surface-raised hover:text-fg", className)}
    >
      {copied ? <Check className={cn("size-3.5 text-success", iconClassName)} /> : <Copy className={cn("size-3.5", iconClassName)} />}
    </button>
  );
}

export async function copyText(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // Clipboard API unavailable (insecure context): fall back to a hidden textarea.
    const el = document.createElement("textarea");
    el.value = value;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    el.remove();
  }
}
