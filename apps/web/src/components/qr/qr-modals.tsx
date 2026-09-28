"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Field, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { downloadQRCode, type ExportFormat } from "@/lib/qr/export";
import type { QRCode } from "@/types";
import { StyledQR } from "./styled-qr";

interface QRModalProps {
  qr: QRCode;
  open: boolean;
  onClose: () => void;
}

export function ShareQRModal({ qr, open, onClose }: QRModalProps) {
  const link = qr.shortUrl;
  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;
  return (
    <Modal open={open} onClose={onClose} title="Share QR Code">
      <div className="flex items-center gap-4">
        <div className="shrink-0 rounded-lg bg-bg p-1.5">
          <StyledQR value={link} style={qr.style} size={60} />
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
          Share via…
        </Button>
      )}
    </Modal>
  );
}

const RESOLUTIONS = [
  { value: "3000", label: "High Density (3000 x 3000px)" },
  { value: "1024", label: "Standard (1024 x 1024px)" },
  { value: "512", label: "Web (512 x 512px)" },
];

export function ExportQRModal({ qr, open, onClose }: QRModalProps) {
  const [format, setFormat] = useState<ExportFormat>("svg");
  const [resolution, setResolution] = useState("3000");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  return (
    <Modal open={open} onClose={onClose} title="Export Asset">
      <div className="flex flex-col gap-3">
        <Field label="Vector Format">
          {(id) => (
            <Select
              id={id}
              className="w-full"
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              options={[
                { value: "svg", label: "Scalable Vector (.SVG)" },
                { value: "png", label: "Raster Image (.PNG)" },
              ]}
            />
          )}
        </Field>
        <Field label="Resolution/Size">
          {(id) => <Select id={id} className="w-full" value={resolution} onChange={(e) => setResolution(e.target.value)} options={RESOLUTIONS} />}
        </Field>
      </div>
      <Button
        size="sm"
        className="self-start"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await downloadQRCode({ payload: qr.shortUrl, style: qr.style, name: qr.name, format, pixelSize: Number(resolution) });
            toast(`${format.toUpperCase()} exported`);
            onClose();
          } catch {
            toast("Export failed. Please try again.", "warning");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Exporting…" : "Export Custom Asset"}
      </Button>
    </Modal>
  );
}

export function DeleteQRModal({ qr, open, onClose, onConfirm }: QRModalProps & { onConfirm: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal open={open} onClose={onClose} title="Delete QR Code">
      <p className="text-sm text-muted">
        Are you absolutely sure you want to delete <span className="font-semibold text-fg">{qr.name}</span>? Printed codes will no longer
        resolve.
      </p>
      <div className="flex justify-end gap-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
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
          {busy ? "Deleting…" : "Delete Permanently"}
        </Button>
      </div>
    </Modal>
  );
}
