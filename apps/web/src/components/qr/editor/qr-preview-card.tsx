"use client";

import { AlertTriangle, Info, Smartphone, XCircle } from "lucide-react";
import { StyledQR } from "@/components/qr/styled-qr";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n/provider";
import type { ScanReport } from "@/lib/qr/scannability";
import { cn } from "@/lib/utils/cn";
import { stripProtocol } from "@/lib/utils/format";
import type { QRDesign, QRMode } from "@/types";

const STATUS_DOT: Record<ScanReport["status"], string> = { ok: "bg-success", warning: "bg-warning", error: "bg-danger" };
const CHECK_ICON = { info: Info, warning: AlertTriangle, error: XCircle } as const;
const CHECK_COLOR = { info: "text-info", warning: "text-warning", error: "text-danger" } as const;

interface QRPreviewCardProps {
  payload: string;
  /** False for new dynamic codes: the API assigns the short link on save. */
  payloadIsFinal: boolean;
  mode: QRMode;
  design: QRDesign;
  report: ScanReport;
  destination: string | null;
  phoneMockup: boolean;
  onPhoneMockupChange: (v: boolean) => void;
  compact?: boolean;
}

export function QRPreviewCard({ payload, payloadIsFinal, mode, design, report, destination, phoneMockup, onPhoneMockupChange, compact }: QRPreviewCardProps) {
  const { t } = useI18n();
  const pv = t.editor.preview;
  const scan = t.editor.scan;

  // Transparent designs are previewed on a checkerboard so the transparency is visible.
  const surface = design.background.transparent
    ? "bg-[length:16px_16px] bg-[repeating-conic-gradient(#3f3f46_0%_25%,#27272a_0%_50%)]"
    : "";

  const card = (
    <div
      className={cn("overflow-hidden border border-line transition-[border-radius] duration-300", phoneMockup ? "rounded-2xl" : "rounded-3xl", surface)}
      style={design.background.transparent ? undefined : { background: design.background.color }}
    >
      <StyledQR value={payload} design={design} framed title={pv.encodesTitle(payload)} />
    </div>
  );

  return (
    <div className="flex w-full flex-col items-center gap-5">
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

      <div className="flex w-full max-w-[384px] flex-col gap-2" role="status" aria-live="polite">
        <p className="flex items-center justify-center gap-2 text-[13px] font-semibold text-fg-strong">
          <span className={cn("size-2 rounded-full", STATUS_DOT[report.status])} aria-hidden />
          {report.status === "ok" ? scan.ok : report.status === "warning" ? scan.warning : scan.error}
        </p>
        {report.checks.length > 0 && (
          <ul className="flex flex-col gap-1.5 rounded-xl border border-line bg-surface p-3">
            {report.checks.map((c) => {
              const Icon = CHECK_ICON[c.level];
              return (
                <li key={c.id} className="flex items-start gap-2 text-xs text-muted-2">
                  <Icon className={cn("mt-0.5 size-3.5 shrink-0", CHECK_COLOR[c.level])} aria-hidden />
                  {scan.checks[c.id]}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="max-w-[384px] text-center text-xs text-subtle">
        {mode === "static" ? (
          pv.staticEncodes
        ) : payloadIsFinal ? (
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
