"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChannelsLineChart } from "@/components/analytics/channels-line-chart";
import { StatCard, StatCardSkeleton } from "@/components/analytics/stat-card";
import { StyledQR } from "@/components/qr/styled-qr";
import { Pill } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle, SectionHeading } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCampaign, getCampaignAnalytics } from "@/lib/api/campaigns";
import { useResource } from "@/lib/hooks/use-resource";
import { countryName } from "@/lib/i18n/labels";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate, formatNumber } from "@/lib/utils/format";
import type { QRCode } from "@/types";
import { EditCampaignModal } from "./edit-campaign-modal";

/** Emoji flag from an ISO 3166-1 alpha-2 code (regional indicator symbols). */
const flag = (code: string) => (/^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0))) : "");

function CampaignQRCard({ qr }: { qr: QRCode }) {
  const { t, locale } = useI18n();
  return (
    <Link
      href={`/qr-codes/${qr.id}`}
      className="group block rounded-2xl transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg-strong"
    >
      <Card className="flex h-full flex-col gap-7 p-6 transition-colors group-hover:border-line-strong">
        <div className="flex items-center justify-between">
          <StyledQR value={qr.shortUrl} style={qr.style} size={48} title={t.common.qrCodeOf(qr.name)} />
          <Pill className="text-[13px]">{t.status[qr.status]}</Pill>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="truncate text-[15px] font-semibold text-fg">{qr.name}</h3>
          <p className="text-[13px] text-muted tabular-nums">{t.common.scans(qr.totalScans, formatNumber(qr.totalScans, locale))}</p>
        </div>
      </Card>
    </Link>
  );
}

export function CampaignView({ id }: { id: string }) {
  const res = useResource(() => getCampaign(id), [id]);
  const analytics = useResource(() => getCampaignAnalytics(id), [id]);
  const [editing, setEditing] = useState(false);
  const router = useRouter();
  const { t, locale } = useI18n();
  const c = t.campaigns;

  if (res.error)
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-fg">{c.notFound}</h1>
        <ButtonLink href="/qr-codes" variant="neutral">
          {t.common.backToQrCodes}
        </ButtonLink>
      </div>
    );

  const detail = res.data;
  const a = analytics.data;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <Breadcrumb items={[{ label: t.nav.campaigns, href: "/campaigns" }, { label: detail?.campaign.name ?? "…" }]} />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {detail ? (
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex items-center gap-3">
                <h1 className="font-display text-[28px] leading-tight font-black text-fg md:text-[32px]">{detail.campaign.name}</h1>
                <Pill className="text-[13px]">{detail.qrCodes.some((q) => q.status === "active") ? t.status.active : t.status.inactive}</Pill>
              </div>
              <p className="text-[15px] text-muted">{detail.campaign.description}</p>
            </div>
          ) : (
            <Skeleton className="h-16 w-96" />
          )}
          <Button variant="inverse" className="h-[42px] self-start md:self-auto" onClick={() => setEditing(true)} disabled={!detail}>
            {c.edit}
          </Button>
        </div>
      </header>

      <section aria-label={c.metrics} className="grid grid-cols-2 gap-3 md:gap-6 xl:grid-cols-4">
        {a ? (
          <>
            <StatCard label={c.totalScans} value={formatNumber(a.totalScans, locale)} delta={a.totalScansDelta?.value} deltaTone="neutral" />
            <StatCard label={c.uniqueVisitors} value={formatNumber(a.uniqueVisitors, locale)} delta={a.uniqueVisitorsDelta?.value} deltaTone="neutral" />
            <StatCard
              label={c.topCountry}
              value={
                a.topCountry ? (
                  <>
                    {countryName(a.topCountry.countryCode, a.topCountry.name, locale)} <span aria-hidden>{flag(a.topCountry.countryCode)}</span>
                  </>
                ) : (
                  "—"
                )
              }
              deltaLabel={a.topCountry ? c.shareLabel(a.topCountry.share) : undefined}
              deltaTone="neutral"
            />
            <StatCard label={c.activeCodes} value={a.activeCodes} footnote={c.ofTotal(detail?.qrCodes.length ?? 0)} />
          </>
        ) : (
          Array.from({ length: 4 }, (_, i) => <StatCardSkeleton key={i} />)
        )}
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeading
          title={c.qrCodes(String(detail?.qrCodes.length ?? "…"))}
          action={
            <ButtonLink
              href={`/qr-codes/new?campaign=${id}`}
              variant="secondary"
              className="h-[37px] rounded-lg border-line px-4 text-[13px]"
              leadingIcon={<Plus className="size-3.5" />}
            >
              {c.addQr}
            </ButtonLink>
          }
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
          {!detail ? (
            Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[154px] rounded-2xl" />)
          ) : detail.qrCodes.length ? (
            detail.qrCodes.map((qr) => <CampaignQRCard key={qr.id} qr={qr} />)
          ) : (
            <p className="col-span-full rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
              {c.emptyQr}
            </p>
          )}
        </div>
      </section>

      <Card className="flex flex-col gap-6 p-5 md:p-6">
        <CardTitle>{c.byChannel}</CardTitle>
        {!a ? (
          <Skeleton className="h-[280px] w-full" />
        ) : a.totalScans > 0 ? (
          <ChannelsLineChart labels={a.labels} channels={a.channels} />
        ) : (
          <p className="py-16 text-center text-sm text-muted">{c.noScans7d}</p>
        )}
      </Card>

      {detail && a && (
        <Card className="flex flex-wrap gap-x-8 gap-y-5 p-6">
          {[
            [c.created, formatDate(detail.campaign.createdAt, locale)],
            [c.lastModified, formatDate(detail.campaign.updatedAt, locale)],
            [c.impressions, c.impressionsValue(formatNumber(a.totalScans, locale))],
          ].map(([label, value], i) => (
            <div key={label} className={`flex flex-col gap-2 ${i > 0 ? "sm:border-l sm:border-line sm:pl-8" : ""}`}>
              <p className="text-xs text-muted uppercase">{label}</p>
              <p className="font-display text-base font-bold text-fg">{value}</p>
            </div>
          ))}
        </Card>
      )}

      {detail && (
        <EditCampaignModal
          campaign={detail.campaign}
          open={editing}
          onClose={() => setEditing(false)}
          onSaved={(campaign) => res.setData({ ...detail, campaign })}
          onDeleted={() => router.push("/campaigns")}
        />
      )}
    </div>
  );
}
