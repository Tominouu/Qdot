import { CAMPAIGN_ANALYTICS, type MockCampaign } from "@/data/campaigns";
import { USE_MOCK_API } from "@/lib/config";
import type { Campaign, CampaignAnalytics, CampaignDetail, CreateCampaignInput, QRCode, UpdateCampaignInput } from "@/types";
import { ApiError, apiRequest, browserTimeZone, toQuery } from "./client";
import { delay, readStore, writeStore } from "./mock-store";

const toCampaign = (c: MockCampaign): Campaign => ({
  id: c.id,
  name: c.name,
  description: c.description,
  qrCodeCount: c.qrCodeIds.length,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});

const notFound = () => new ApiError("Campaign not found", 404, "CAMPAIGN_NOT_FOUND");

export async function listCampaigns(): Promise<Campaign[]> {
  if (!USE_MOCK_API) return apiRequest<Campaign[]>("/campaigns");
  return delay(readStore().campaigns.map(toCampaign));
}

export async function getCampaign(id: string): Promise<CampaignDetail> {
  if (!USE_MOCK_API) return apiRequest<CampaignDetail>(`/campaigns/${encodeURIComponent(id)}`);

  const store = readStore();
  const campaign = store.campaigns.find((c) => c.id === id);
  if (!campaign) throw notFound();
  const qrCodes = campaign.qrCodeIds.map((qid) => store.qrCodes.find((q) => q.id === qid)).filter((q): q is QRCode => Boolean(q));
  return delay({ campaign: toCampaign(campaign), qrCodes });
}

export async function getCampaignAnalytics(id: string): Promise<CampaignAnalytics> {
  if (!USE_MOCK_API) return apiRequest<CampaignAnalytics>(`/campaigns/${encodeURIComponent(id)}/analytics${toQuery({ tz: browserTimeZone() })}`);

  const campaign = readStore().campaigns.find((c) => c.id === id);
  if (!campaign) throw notFound();
  const fixture = CAMPAIGN_ANALYTICS[id];
  if (!fixture)
    return delay({
      campaignId: id,
      totalScans: 0,
      uniqueVisitors: 0,
      activeCodes: 0,
      topCountry: null,
      totalScansDelta: null,
      uniqueVisitorsDelta: null,
      labels: [],
      channels: [],
    });
  return delay({ ...fixture, channels: fixture.channels.filter((ch) => campaign.qrCodeIds.includes(ch.qrCodeId)) });
}

export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  if (!USE_MOCK_API) return apiRequest<Campaign>("/campaigns", { method: "POST", body: JSON.stringify(input) });
  const now = new Date().toISOString();
  const campaign: MockCampaign = {
    id: `cmp_${crypto.randomUUID().slice(0, 8)}`,
    name: input.name.trim(),
    description: input.description?.trim() ?? "",
    qrCodeIds: [],
    createdAt: now,
    updatedAt: now,
  };
  writeStore((s) => {
    s.campaigns.unshift(campaign);
  });
  return delay(toCampaign(campaign));
}

export async function updateCampaign(id: string, patch: UpdateCampaignInput): Promise<Campaign> {
  if (!USE_MOCK_API) return apiRequest<Campaign>(`/campaigns/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) });

  let updated: MockCampaign | undefined;
  writeStore((s) => {
    const c = s.campaigns.find((x) => x.id === id);
    if (!c) return;
    Object.assign(c, patch, { updatedAt: new Date().toISOString() });
    updated = c;
  });
  if (!updated) throw notFound();
  return delay(toCampaign(updated));
}

/** QR codes in the campaign are kept (they become unassigned). */
export async function deleteCampaign(id: string): Promise<void> {
  if (!USE_MOCK_API) return apiRequest<void>(`/campaigns/${encodeURIComponent(id)}`, { method: "DELETE" });
  writeStore((s) => {
    s.campaigns = s.campaigns.filter((c) => c.id !== id);
    for (const q of s.qrCodes) if (q.campaignId === id) q.campaignId = null;
  });
  return delay(undefined);
}
