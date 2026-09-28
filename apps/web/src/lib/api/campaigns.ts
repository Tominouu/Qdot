import { CAMPAIGN_ANALYTICS } from "@/data/campaigns";
import { USE_MOCK_API } from "@/lib/config";
import type { Campaign, CampaignAnalytics, QRCode } from "@/types";
import { ApiError, apiRequest } from "./client";
import { delay, readStore, writeStore } from "./mock-store";

export async function listCampaigns(): Promise<Campaign[]> {
  if (!USE_MOCK_API) return apiRequest<Campaign[]>("/campaigns");
  return delay(readStore().campaigns);
}

export interface CampaignDetail {
  campaign: Campaign;
  qrCodes: QRCode[];
  analytics: CampaignAnalytics;
}

export async function getCampaign(id: string): Promise<CampaignDetail> {
  if (!USE_MOCK_API) return apiRequest<CampaignDetail>(`/campaigns/${encodeURIComponent(id)}`);

  const store = readStore();
  const campaign = store.campaigns.find((c) => c.id === id);
  const analytics = CAMPAIGN_ANALYTICS[id];
  if (!campaign || !analytics) throw new ApiError("Campaign not found", 404);
  const qrCodes = campaign.qrCodeIds
    .map((qid) => store.qrCodes.find((q) => q.id === qid))
    .filter((q): q is QRCode => Boolean(q));
  return delay({
    campaign,
    qrCodes,
    analytics: { ...analytics, channels: analytics.channels.filter((ch) => campaign.qrCodeIds.includes(ch.qrCodeId)) },
  });
}

export async function updateCampaign(id: string, patch: Partial<Pick<Campaign, "name" | "description" | "status">>): Promise<Campaign> {
  if (!USE_MOCK_API)
    return apiRequest<Campaign>(`/campaigns/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) });

  let updated: Campaign | undefined;
  writeStore((s) => {
    const c = s.campaigns.find((x) => x.id === id);
    if (!c) return;
    Object.assign(c, patch, { updatedAt: new Date().toISOString() });
    updated = c;
  });
  if (!updated) throw new ApiError("Campaign not found", 404);
  return delay(updated);
}
