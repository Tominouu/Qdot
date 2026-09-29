"use client";

import { Smartphone } from "lucide-react";
import { StyledQR } from "@/components/qr/styled-qr";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n/provider";
import type { Scannability } from "@/lib/qr/scannability";
import { cn } from "@/lib/utils/cn";
import { stripProtocol } from "@/lib/utils/format";
import type { QRStyle } from "@/types";

const STATUS_DOT: Record<Scannability, string> = {
  scannable: "bg-success",
  "low-contrast": "bg-warning",
  "invalid-color": "bg-danger",
  "sparse-logo": "bg-warning",
};

interface QRPreviewCardProps {
  payload: string;
  /** False for new codes: the API assigns the short link on save. */
  payloadIsFinal: boolean;
  style: QRStyle;
  scannability: Scannability;
  destination: string | null;
  phoneMockup: boolean;
  onPhoneMockupChange: (v: boolean) => void;
  compact?: boolean;
}

export function QRPreviewCard({ payload, payloadIsFinal, style, scannability, destination, phoneMockup, onPhoneMockupChange, compact }: QRPreviewCardProps) {
  const { t } = useI18n();
  const pv = t.editor.preview;

  const card = (
    <div
      className={cn(
        "flex flex-col items-center gap-6 border border-line transition-[background-color,border-radius,padding] duration-300",
        compact ? "rounded-3xl p-6" : "rounded-3xl p-8",
        phoneMockup && "rounded-2xl p-5",
      )}
      style={{ background: style.background }}
    >
      <div className={cn("w-full transition-[max-width] duration-300", compact ? "max-w-[180px]" : phoneMockup ? "max-w-[200px]" : "max-w-[320px]")}>
        <StyledQR value={payload} style={style} title={pv.encodesTitle(payload)} />
      </div>
      <p className="flex items-center gap-2 rounded-full text-[13px] font-semibold text-fg-strong" role="status" aria-live="polite">
        <span className={cn("size-2 rounded-full", STATUS_DOT[scannability])} aria-hidden />
        {t.editor.status[scannability]}
      </p>
    </div>
  );

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {phoneMockup ? (
        <div className="relative w-[280px] animate-fade-up rounded-[44px] border-[10px] border-[#0b0b0f] bg-bg p-3 pt-10 shadow-2xl shadow-black/60 ring-1 ring-line">
          <span className="absolute top-3 left-1/2 h-5 w-20 -translate-x-1/2 rounded-full bg-[#0b0b0f]" aria-hidden />
          {card}
          <p className="mt-4 truncate px-2 text-center text-[11px] text-muted" title={destination ?? undefined}>
            {pv.opens} {destination ? stripProtocol(destination) : pv.yourDestination}
          </p>
        </div>
      ) : (
        <div className={cn("w-full", compact ? "max-w-[228px]" : "max-w-[384px]")}>{card}</div>
      )}

      <p className="max-w-[384px] text-center text-xs text-subtle">
        {payloadIsFinal ? (
          <>
            {pv.encodes} <span className="font-mono text-muted-2">{stripProtocol(payload)}</span>
          </>
        ) : (
          pv.assignedOnSave
        )}
        {destination && (
          <>
            {" "}
            {pv.redirectsTo} <span className="break-all text-muted-2">{stripProtocol(destination)}</span>
          </>
        )}
      </p>

      {!compact && (
        <div className="flex items-center gap-2.5 rounded-full border border-line bg-surface px-4 py-2.5">
          <Smartphone className="size-4 text-muted-2" aria-hidden />
          <span className="text-[13px] text-muted-2">{pv.phoneMockup}</span>
          <span className="h-px w-3 bg-line" aria-hidden />
          <Switch size="sm" tone="accent" label={pv.phoneMockup} checked={phoneMockup} onCheckedChange={onPhoneMockupChange} />
        </div>
      )}
    </div>
  );
}
