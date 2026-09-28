"use client";

import { ArrowLeft, Check, Download, Pause, Pencil, Play, Share, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { RangeChips } from "@/components/analytics/range-chips";
import { ScansLineChart } from "@/components/analytics/scans-line-chart";
import { ScansTable } from "@/components/analytics/scans-table";
import { ShareBars } from "@/components/analytics/share-bars";
import { StatCard, StatCardSkeleton } from "@/components/analytics/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { getQRCodeAnalytics } from "@/lib/api/analytics";
import { deleteQRCode, getQRCode, updateQRCode } from "@/lib/api/qr";
import { shortUrlFor } from "@/lib/config";
import { useResource } from "@/lib/hooks/use-resource";
import { downloadQRCode } from "@/lib/qr/export";
import { formatNumber } from "@/lib/utils/format";
import type { TimeRange } from "@/types";
import { DeleteQRModal, ExportQRModal, ShareQRModal } from "./qr-modals";
import { StyledQR } from "./styled-qr";

type ModalName = "share" | "export" | "delete" | null;

export function QRDetail({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const qrRes = useResource(() => getQRCode(id), [id]);
  const [range, setRange] = useState<TimeRange>("7d");
  const stats = useResource(() => getQRCodeAnalytics(id, range), [id, range]);
  const [modal, setModal] = useState<ModalName>(null);
  const [updating, setUpdating] = useState(false);

  if (qrRes.error) return <NotFoundState />;
  const qr = qrRes.data;
  if (!qr) return <DetailSkeleton />;

  const shortUrl = shortUrlFor(qr.slug);
  const paused = qr.status !== "active";

  const toggleStatus = async () => {
    setUpdating(true);
    const next = await updateQRCode(qr.id, { status: paused ? "active" : "paused" });
    qrRes.setData(next);
    setUpdating(false);
    toast(next.status === "paused" ? "QR code redirection paused" : "QR code is live again", next.status === "paused" ? "warning" : "success");
  };

  const downloadSvg = async () => {
    await downloadQRCode({ payload: shortUrl, style: qr.style, name: qr.name, format: "svg" });
    toast("SVG downloaded");
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Mobile top nav (mobile-qr-detail frame) */}
      <div className="-mt-2 flex items-center gap-3 md:hidden">
        <Link href="/qr-codes" aria-label="Back to QR codes" className="-ml-1 rounded-md p-1 text-fg">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="min-w-0 flex-1 truncate font-display text-xl font-extrabold text-fg">{qr.name}</h1>
        <StatusBadge status={qr.status} />
      </div>

      <header className="hidden flex-col gap-3 md:flex">
        <Breadcrumb items={[{ label: "QR Codes", href: "/qr-codes" }, { label: qr.name }]} />
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="truncate font-display text-[32px] leading-tight font-black text-fg">{qr.name}</h1>
              <StatusBadge status={qr.status} />
            </div>
            <div className="flex min-w-0 items-center gap-1.5">
              <a href={qr.destinationUrl} target="_blank" rel="noreferrer" className="truncate text-sm text-muted hover:text-fg hover:underline">
                {qr.destinationUrl}
              </a>
              <CopyButton value={qr.destinationUrl} label="Copy destination URL" toastMessage="Destination URL copied" />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={`/qr-codes/${qr.id}/edit`} variant="neutral" className="h-[37px] rounded-lg px-4 text-[13px]">
              Edit
            </ButtonLink>
            <Button variant="neutral" className="h-[37px] rounded-lg px-4 text-[13px]" onClick={downloadSvg}>
              Download SVG
            </Button>
            <Button variant="neutral" className="h-[37px] rounded-lg px-4 text-[13px]" onClick={() => setModal("share")}>
              Share
            </Button>
            {qr.status !== "archived" && (
              <Button
                variant={paused ? "neutral" : "warning"}
                className="h-[37px] rounded-lg px-4 text-[13px]"
                disabled={updating}
                onClick={toggleStatus}
              >
                {paused ? "Resume QR" : "Pause QR"}
              </Button>
            )}
          </div>
        </div>
      </header>

      <section aria-label="QR code and key metrics" className="flex flex-col gap-6 md:gap-10 lg:flex-row">
        <Card className="flex flex-col items-center gap-6 bg-bg p-8 md:bg-surface lg:w-[380px] lg:shrink-0">
          <div className="w-full max-w-[240px] animate-fade-up">
            <StyledQR value={shortUrl} style={qr.style} title={`${qr.name} QR code, encodes ${shortUrl}`} />
          </div>
          <p className="flex items-center gap-2 text-[13px] font-semibold text-fg-strong">
            <Check className="size-4" aria-hidden /> V2.0 Fully Custom Style
          </p>
        </Card>

        {/* Mobile action grid */}
        <div className="grid grid-cols-4 gap-2 md:hidden">
          <MobileAction icon={<Pencil />} label="Edit" href={`/qr-codes/${qr.id}/edit`} />
          <MobileAction icon={<Download />} label="Download" onClick={() => setModal("export")} />
          <MobileAction icon={<Share />} label="Share" onClick={() => setModal("share")} />
          {qr.status !== "archived" && (
            <MobileAction icon={paused ? <Play /> : <Pause />} label={paused ? "Resume" : "Pause"} onClick={toggleStatus} />
          )}
        </div>

        <div className="grid flex-1 grid-cols-2 content-start gap-3 md:gap-4">
          {stats.data ? (
            <>
              <StatCard
                label="Total scans"
                value={formatNumber(stats.data.totalScans)}
                delta={stats.data.totalScansDelta.value}
                sparkline={stats.data.sparklines.total}
              />
              <StatCard
                label="Unique visitors"
                value={formatNumber(stats.data.uniqueVisitors)}
                delta={stats.data.uniqueVisitorsDelta.value}
                sparkline={stats.data.sparklines.unique}
              />
              <StatCard label="Avg. scan time" value={`${stats.data.avgScanTimeSeconds}s`} footnote="From lens capture to direct load" />
              <StatCard label="Mobile scans" value={`${stats.data.mobileShare}%`} footnote={`${stats.data.dominantPlatform} dominant platform`} />
            </>
          ) : (
            Array.from({ length: 4 }, (_, i) => <StatCardSkeleton key={i} />)
          )}
        </div>
      </section>

      <Card className="flex flex-col gap-6 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle>
            <span className="md:hidden">Scans Timeline</span>
            <span className="hidden md:inline">Performance History</span>
          </CardTitle>
          <RangeChips value={range} onChange={setRange} />
        </div>
        {stats.loading ? (
          <Skeleton className="h-[240px] w-full" />
        ) : stats.data && stats.data.timeseries.length ? (
          <>
            <ScansLineChart data={stats.data.timeseries} label={`Scans for ${qr.name} over the selected period`} />
            <p className="flex w-fit items-center gap-2 rounded-lg border border-line bg-bg p-3 text-[13px] text-muted-2">
              <span className="size-2 rounded-full bg-fg-strong" aria-hidden />
              <span>
                Peak Activity: <b className="font-bold text-fg-strong">{stats.data.peak.label}</b> · {formatNumber(stats.data.peak.scans)} scans
              </span>
            </p>
          </>
        ) : (
          <p className="py-16 text-center text-sm text-muted">No scans yet — share your code to start collecting data.</p>
        )}
      </Card>

      {stats.data && stats.data.topLocations.length > 0 && (
        <section className="flex flex-col gap-4 md:hidden">
          <h2 className="font-display text-lg font-extrabold text-fg">Top Locations</h2>
          <ShareBars items={stats.data.topLocations} />
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-extrabold text-fg">Recent scan history</h2>
        {stats.data ? <ScansTable scans={stats.data.recentScans} /> : <Skeleton className="h-[240px] w-full rounded-2xl" />}
      </section>

      <div className="flex justify-end">
        <Button variant="ghost-danger" size="sm" leadingIcon={<Trash2 className="size-4" />} onClick={() => setModal("delete")}>
          Delete QR code
        </Button>
      </div>

      <ShareQRModal qr={qr} open={modal === "share"} onClose={() => setModal(null)} />
      <ExportQRModal qr={qr} open={modal === "export"} onClose={() => setModal(null)} />
      <DeleteQRModal
        qr={qr}
        open={modal === "delete"}
        onClose={() => setModal(null)}
        onConfirm={async () => {
          await deleteQRCode(qr.id);
          toast(`${qr.name} deleted`, "info");
          router.push("/qr-codes");
        }}
      />
    </div>
  );
}

function MobileAction({ icon, label, href, onClick }: { icon: ReactNode; label: string; href?: string; onClick?: () => void }) {
  const cls =
    "flex flex-col items-center gap-2 rounded-xl border border-line bg-surface py-3 text-xs font-semibold text-fg transition-colors active:bg-surface-raised [&_svg]:size-5";
  return href ? (
    <Link href={href} className={cls}>
      {icon}
      {label}
    </Link>
  ) : (
    <button type="button" className={cls} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-10" aria-busy>
      <Skeleton className="h-16 w-80" />
      <div className="flex flex-col gap-10 lg:flex-row">
        <Skeleton className="h-[345px] rounded-2xl lg:w-[380px]" />
        <div className="grid flex-1 grid-cols-2 content-start gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
      <Skeleton className="h-[400px] rounded-2xl" />
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="font-display text-2xl font-bold text-fg">QR code not found</h1>
      <p className="text-muted">It may have been deleted.</p>
      <ButtonLink href="/qr-codes" variant="neutral">
        Back to QR codes
      </ButtonLink>
    </div>
  );
}

