"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Field, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n/provider";
import { downloadQRCode, type ExportFormat } from "@/lib/qr/export";
import type { QRCode } from "@/types";
import { qrPayload } from "@/lib/qr/types";
import { QRThumbnail } from "./styled-qr";

interface QRModalProps {
  qr: QRCode;
  open: boolean;
  onClose: () => void;
}

export function ShareQRModal({ qr, open, onClose }: QRModalProps) {
  const link = qr.shortUrl;
  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={t.modals.shareTitle}>
      <div className="flex items-center gap-4">
        <div className="shrink-0 rounded-lg bg-bg p-1.5">
          <QRThumbnail value={qrPayload(qr)} design={qr.design} size={52} title={t.common.qrCodeOf(qr.name)} />
        </div>
        <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-line bg-surface px-3">
          <p className="min-w-0 flex-1 truncate text-sm text-fg">{link}</p>
          <CopyButton value={link} className="-mr-1" iconClassName="size-4" />
        </div>
      </div>
      {canNativeShare && (
        <Button
          variant="neutral"
          size="sm"
          className="self-end"
          onClick={() => navigator.share({ title: qr.name, url: link }).catch(() => undefined)}
        >
          {t.modals.shareVia}
        </Button>
      )}
    </Modal>
  );
}

const RESOLUTIONS = ["3000", "1024", "512"] as const;

export function ExportQRModal({ qr, open, onClose }: QRModalProps) {
  const [format, setFormat] = useState<ExportFormat>("svg");
  const [resolution, setResolution] = useState("3000");
  const [printSize, setPrintSize] = useState<"30" | "50" | "100">("50");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();
  const m = t.modals;

  return (
    <Modal open={open} onClose={onClose} title={m.exportTitle}>
      <div className="flex flex-col gap-3">
        <Field label={m.format}>
          {(id) => (
            <Select
              id={id}
              className="w-full"
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              options={[
                { value: "svg", label: m.svg },
                { value: "png", label: m.png },
                { value: "pdf", label: m.pdf },
              ]}
            />
          )}
        </Field>
        {format === "pdf" ? (
          <Field label={m.printSize}>
            {(id) => (
              <Select
                id={id}
                className="w-full"
                value={printSize}
                onChange={(e) => setPrintSize(e.target.value as typeof printSize)}
                options={(["30", "50", "100"] as const).map((v) => ({ value: v, label: m.pdfSizes[v] }))}
              />
            )}
          </Field>
        ) : (
          <Field label={m.resolution}>
            {(id) => <Select id={id} className="w-full" value={resolution} onChange={(e) => setResolution(e.target.value)} options={RESOLUTIONS.map((r) => ({ value: r, label: m.resolutions[r] }))} />}
          </Field>
        )}
      </div>
      <Button
        size="sm"
        className="self-start"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await downloadQRCode({ payload: qrPayload(qr), design: qr.design, name: qr.name, format, pixelSize: Number(resolution), printSizeMm: Number(printSize) });
            toast(m.exported(format.toUpperCase()));
            onClose();
          } catch {
            toast(m.exportFailed, "warning");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? m.exporting : m.exportCta}
      </Button>
    </Modal>
  );
}

export function DeleteQRModal({ qr, open, onClose, onConfirm }: QRModalProps & { onConfirm: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={t.modals.deleteTitle}>
      <p className="text-sm text-muted">
        {t.modals.deleteBefore}
        <span className="font-semibold text-fg">{qr.name}</span>
        {t.modals.deleteAfter}
      </p>
      <div className="flex justify-end gap-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          {t.common.cancel}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await onConfirm();
            setBusy(false);
          }}
        >
          {busy ? t.modals.deleting : t.modals.deleteCta}
        </Button>
      </div>
    </Modal>
  );
}
