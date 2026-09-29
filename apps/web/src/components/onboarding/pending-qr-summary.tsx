"use client";

import Link from "next/link";
import { StyledQR } from "@/components/qr/styled-qr";
import { Card } from "@/components/ui/card";
import { previewShortUrl } from "@/lib/config";
import { useI18n } from "@/lib/i18n/provider";
import { stripProtocol } from "@/lib/utils/format";
import type { PendingQRCode } from "@/types";

export const RESUME_EDITOR_HREF = "/qr-codes/new?resume=1";

/** The QR code waiting to be saved, so users see their work is preserved. */
export function PendingQRSummary({ pending }: { pending: PendingQRCode }) {
  const { draft, create } = pending;
  const { t } = useI18n();
  return (
    <Card className="flex w-full items-center gap-4 p-4">
      <div className="shrink-0 rounded-[10px] p-2" style={{ background: draft.style.background }}>
        <StyledQR value={previewShortUrl(draft.previewCode)} style={draft.style} size={48} title={t.onboarding.pending.preview(draft.name || t.onboarding.pending.yourQr)} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate font-display text-base font-extrabold text-fg">{draft.name || t.onboarding.pending.untitled}</p>
        <p className="truncate text-xs text-muted">{stripProtocol(create.destinationUrl)}</p>
      </div>
      <Link href={RESUME_EDITOR_HREF} className="shrink-0 rounded-md px-2 py-1 text-[13px] font-semibold text-muted transition-colors hover:bg-surface-raised hover:text-fg">
        {t.common.edit}
      </Link>
    </Card>
  );
}
