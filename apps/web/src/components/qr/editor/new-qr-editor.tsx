"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePendingQR } from "@/lib/onboarding/pending-qr";
import type { QRCategory } from "@/types";
import { QREditor } from "./qr-editor";
import { initialDraft } from "./use-qr-draft";

interface NewQREditorProps {
  /** Placeholder code for the live preview (the API assigns the real one). */
  previewCode: string;
  category?: QRCategory;
  campaignId?: string;
  /** Restore the draft saved before the onboarding Account step. */
  resume?: boolean;
}

export function NewQREditor({ previewCode, category, campaignId, resume }: NewQREditorProps) {
  const [fresh] = useState(() => initialDraft({ previewCode, category, campaignId }));
  const pending = usePendingQR();

  if (!resume) return <QREditor initial={fresh} />;
  // Pending draft lives in sessionStorage, readable only after hydration.
  if (pending === undefined)
    return (
      <div className="flex min-h-dvh items-center justify-center" aria-busy>
        <Skeleton className="size-[384px] rounded-3xl" />
      </div>
    );
  return pending ? <QREditor key="resume" initial={initialDraft({ previewCode, pending: pending.draft })} /> : <QREditor initial={fresh} />;
}
