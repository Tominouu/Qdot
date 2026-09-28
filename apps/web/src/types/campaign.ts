import type { Delta } from "./analytics";

export type CampaignStatus = "active" | "paused" | "ended";

export interface Campaign {
  id: string;
  name: string;
  description: string;
  status: CampaignStatus;
  qrCodeIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChannelSeries {
  qrCodeId: string;
  name: string;
  points: number[];
}

export interface CampaignAnalytics {
  campaignId: string;
  totalScans: number;
  uniqueVisitors: number;
  topCountry: { name: string; countryCode: string; share: number };
  conversionRate: number;
  totalScansDelta: Delta;
  uniqueVisitorsDelta: Delta;
  conversionRateDelta: Delta;
  labels: string[];
  channels: ChannelSeries[];
}
