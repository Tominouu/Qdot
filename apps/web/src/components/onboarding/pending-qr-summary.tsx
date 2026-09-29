"use client";

import Link from "next/link";
import { QRThumbnail } from "@/components/qr/styled-qr";
import { Card } from "@/components/ui/card";
import { previewShortUrl } from "@/lib/config";
import { useI18n } from "@/lib/i18n/provider";
import { contentPayload, contentSummary, defaultContent } from "@/lib/qr/types";
import type { PendingQRCode } from "@/types";

export const RESUME_EDITOR_HREF = "/qr-codes/new?resume=1";

/** The QR code waiting to be saved, so users see their work is preserved. */
export function PendingQRSummary({ pending }: { pending: PendingQRCode }) {
  const { draft } = pending;
  const { t } = useI18n();
  const content = draft.contents[draft.type] ?? defaultContent(draft.type);
  const payload = draft.mode === "dynamic" ? previewShortUrl(draft.previewCode) : contentPayload(content);
  return (
    <Card className="flex w-full items-center gap-4 p-4">
      <QRThumbnail value={payload} design={draft.design} size={48} title={t.onboarding.pending.preview(draft.name || t.onboarding.pending.yourQr)} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate font-display text-base font-extrabold text-fg">{draft.name || t.onboarding.pending.untitled}</p>
        <p className="truncate text-xs text-muted">{contentSummary(content)}</p>
      </div>
      <Link href={RESUME_EDITOR_HREF} className="shrink-0 rounded-md px-2 py-1 text-[13px] font-semibold text-muted transition-colors hover:bg-surface-raised hover:text-fg">
        {t.common.edit}
      </Link>
    </Card>
  );
}
