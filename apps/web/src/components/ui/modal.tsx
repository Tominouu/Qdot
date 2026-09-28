"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

/** Native <dialog> modal: focus trapping, Escape and top-layer stacking come from the platform. */
export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-[calc(100%-32px)] max-w-[424px] rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl shadow-black/50",
        "open:animate-fade-up",
        className,
      )}
    >
      {open && (
        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 id={titleId} className="font-display text-lg font-extrabold text-fg">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="-m-1.5 rounded-md p-1.5 text-muted transition-colors hover:bg-surface-raised hover:text-fg"
            >
              <X className="size-4" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
