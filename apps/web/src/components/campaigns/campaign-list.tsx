"use client";

import { Megaphone, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { listCampaigns } from "@/lib/api/campaigns";
import { useResource } from "@/lib/hooks/use-resource";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/utils/format";
import { EditCampaignModal } from "./edit-campaign-modal";

/** Campaign index, composed from existing design-system pieces (the design only shows a campaign's detail). */
export function CampaignList() {
  const router = useRouter();
  const { data, loading } = useResource(listCampaigns, []);
  const [creating, setCreating] = useState(false);
  const { t, locale } = useI18n();
  const c = t.campaigns;

  const modal = (
    <EditCampaignModal open={creating} onClose={() => setCreating(false)} onSaved={(saved) => router.push(`/campaigns/${saved.id}`)} />
  );

  if (!loading && data?.length === 0) {
    return (
      <>
        <EmptyState
          className="min-h-[70dvh]"
          visual={
            <span className="flex size-16 animate-pop items-center justify-center rounded-full bg-surface text-muted">
              <Megaphone className="size-6" aria-hidden />
            </span>
          }
          title={c.emptyTitle}
          description={c.emptyDescription}
          actions={
            <Button variant="inverse" className="h-[42px]" onClick={() => setCreating(true)}>
              {c.create}
            </Button>
          }
        />
        {modal}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={c.title}
        description={c.description}
        actions={
          <Button onClick={() => setCreating(true)} leadingIcon={<Plus className="size-4" />}>
            {c.newCampaign}
          </Button>
        }
      />
      <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {loading || !data
          ? Array.from({ length: 3 }, (_, i) => (
              <li key={i}>
                <Skeleton className="h-[150px] rounded-2xl" />
              </li>
            ))
          : data.map((campaign) => (
              <li key={campaign.id} className="animate-fade-up">
                <Link
                  href={`/campaigns/${campaign.id}`}
                  className="group block h-full rounded-2xl transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg-strong"
                >
                  <Card className="flex h-full flex-col gap-4 p-6 transition-colors group-hover:border-line-strong">
                    <div className="flex flex-col gap-1.5">
                      <h2 className="truncate font-display text-lg font-extrabold text-fg">{campaign.name}</h2>
                      <p className="line-clamp-2 min-h-[2.5em] text-[13px] text-muted">{campaign.description || c.noDescription}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between border-t border-line pt-4 text-xs">
                      <span className="font-semibold text-fg">
                        {c.qrCount(campaign.qrCodeCount)}
                      </span>
                      <span className="text-faint">{c.createdOn(formatDate(campaign.createdAt, locale))}</span>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
      </ul>
      {modal}
    </div>
  );
}
