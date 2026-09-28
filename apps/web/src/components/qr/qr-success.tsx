"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { copyText } from "@/components/ui/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { getQRCode } from "@/lib/api/qr";
import { useResource } from "@/lib/hooks/use-resource";
import { downloadQRCode, type ExportFormat } from "@/lib/qr/export";
import { ShareQRModal } from "./qr-modals";
import { StyledQR } from "./styled-qr";

export function QRSuccess({ id }: { id: string }) {
  const { data: qr, error } = useResource(() => getQRCode(id), [id]);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (error)
    return (
      <div className="flex flex-col items-center gap-4 py-24">
        <p className="text-muted">QR code not found.</p>
        <ButtonLink href="/qr-codes" variant="neutral">
          Back to QR codes
        </ButtonLink>
      </div>
    );

  const download = async (format: ExportFormat) => {
    if (!qr) return;
    await downloadQRCode({ payload: qr.shortUrl, style: qr.style, name: qr.name, format });
    toast(`${format.toUpperCase()} downloaded`);
  };

  return (
    <div className="flex flex-col items-center gap-10 pt-2 text-center md:pt-8">
      <div className="relative flex size-[120px] items-center justify-center" aria-hidden>
        <span className="absolute size-[100px] rounded-full bg-white/20 blur-2xl" />
        <span className="relative flex size-[60px] animate-pop items-center justify-center rounded-full bg-white shadow-[0_0_40px_rgba(255,255,255,0.35)]">
          <Check className="size-6 text-bg" strokeWidth={2.5} />
        </span>
      </div>

      <div className="flex max-w-[600px] animate-fade-up flex-col gap-3 [animation-delay:120ms]">
        <h1 className="font-display text-[30px] leading-tight font-black text-fg md:text-[36px]">Your QR code is ready!</h1>
        <p className="text-base text-muted">
          {qr ? `${qr.name} has been created and is now ${qr.status === "draft" ? "saved as a draft" : "active"}.` : " "}
        </p>
      </div>

      <div className="flex w-full max-w-[335px] animate-fade-up flex-col items-center gap-6 rounded-3xl border border-line bg-surface p-8 shadow-[0_0_60px_rgba(255,255,255,0.06)] [animation-delay:200ms]">
        {qr ? (
          <div className="w-full max-w-[240px]">
            <StyledQR value={qr.shortUrl} style={qr.style} title={`${qr.name} QR code, encodes ${qr.shortUrl}`} />
          </div>
        ) : (
          <Skeleton className="size-[240px]" />
        )}
        <p className="flex items-center gap-2 text-[13px] font-semibold text-fg-strong">
          <span className="relative flex size-2" aria-hidden>
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-fg-strong opacity-50" />
            <span className="relative size-2 rounded-full bg-fg-strong" />
          </span>
          Your QR code is live and ready to scan
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="neutral" className="h-[37px] rounded-lg bg-transparent px-4 text-[13px]" onClick={() => download("svg")} disabled={!qr}>
          Download SVG
        </Button>
        <Button variant="neutral" className="h-[37px] rounded-lg bg-transparent px-4 text-[13px]" onClick={() => download("png")} disabled={!qr}>
          Download PNG
        </Button>
        <Button
          variant="ghost"
          className="h-[37px] rounded-lg px-4 text-[13px]"
          disabled={!qr}
          onClick={async () => {
            if (!qr) return;
            await copyText(qr.shortUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
            toast("Link copied to clipboard", "info");
          }}
        >
          {copied ? "Copied!" : "Copy Link"}
        </Button>
        <Button variant="ghost" className="h-[37px] rounded-lg px-4 text-[13px]" onClick={() => setSharing(true)} disabled={!qr}>
          Share
        </Button>
      </div>

      <div className="flex items-center gap-8 text-sm font-semibold">
        <Link href={qr ? `/qr-codes/${qr.id}` : "/analytics"} className="text-muted-2 transition-colors hover:text-fg">
          View analytics
        </Link>
        <span className="h-3 w-px bg-line" aria-hidden />
        <Link href="/onboarding" className="text-fg-strong transition-colors hover:text-white">
          Create another
        </Link>
      </div>

      {qr && <ShareQRModal qr={qr} open={sharing} onClose={() => setSharing(false)} />}
    </div>
  );
}
