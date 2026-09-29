"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import { formatNumber, formatRelativeTime, stripProtocol } from "@/lib/utils/format";
import type { QRCode } from "@/types";
import { StyledQR } from "./styled-qr";

function lastScanLabel(qr: QRCode, t: Dictionary, locale: Locale): string {
  if (qr.status === "archived") return t.status.archived;
  if (!qr.lastScanAt) return t.library.noScans;
  return t.library.lastScan(formatRelativeTime(qr.lastScanAt, locale));
}

const cardInteractive =
  "group transition-[border-color,transform,background-color] duration-200 hover:-translate-y-0.5 hover:border-line-strong " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg-strong";

/** Library grid card (qr-library — v2). */
export function QRCard({ qr }: { qr: QRCode }) {
  const { t, locale } = useI18n();
  return (
    <Link href={`/qr-codes/${qr.id}`} className={`block rounded-2xl ${cardInteractive}`}>
      <Card className="flex h-full flex-col gap-5 p-6 group-hover:bg-[#2b2b2f]">
        <div className="flex items-start justify-between gap-3">
          <StyledQR value={qr.shortUrl} style={qr.style} size={110} title={t.common.qrCodeOf(qr.name)} />
          <StatusBadge status={qr.status} />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <h3 className="truncate font-display text-lg font-extrabold text-fg">{qr.name}</h3>
          <p className="truncate text-xs text-muted">{qr.destinationUrl}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-5">
          <p className="shrink-0 text-[13px] font-semibold whitespace-nowrap text-fg tabular-nums">{t.common.scans(qr.totalScans, formatNumber(qr.totalScans, locale))}</p>
          <p className="truncate text-xs text-faint">{lastScanLabel(qr, t, locale)}</p>
        </div>
      </Card>
    </Link>
  );
}

/** Compact row (mobile-qr-library frame, and the desktop list view). */
export function QRRow({ qr }: { qr: QRCode }) {
  const { t, locale } = useI18n();
  return (
    <Link href={`/qr-codes/${qr.id}`} className={`block rounded-2xl ${cardInteractive}`}>
      <Card className="flex items-center gap-4 p-4 group-hover:bg-[#2b2b2f]">
        <div className="shrink-0 rounded-[10px] bg-bg p-2">
          <StyledQR value={qr.shortUrl} style={qr.style} size={48} title={t.common.qrCodeOf(qr.name)} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="truncate font-display text-base font-extrabold text-fg">{qr.name}</h3>
            <StatusBadge status={qr.status} className="md:hidden" />
          </div>
          <p className="truncate font-mono text-xs text-muted">{stripProtocol(qr.destinationUrl)}</p>
          <p className="text-xs text-subtle tabular-nums">{t.common.scans(qr.totalScans, formatNumber(qr.totalScans, locale))}</p>
        </div>
        <p className="hidden w-40 truncate text-right text-xs text-faint md:block">{lastScanLabel(qr, t, locale)}</p>
        <StatusBadge status={qr.status} className="hidden md:inline-flex" />
      </Card>
    </Link>
  );
}

export function QRCardSkeleton() {
  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex justify-between">
        <Skeleton className="size-[110px]" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-3 w-56" />
      <Skeleton className="mt-2 h-4 w-full" />
    </Card>
  );
}
