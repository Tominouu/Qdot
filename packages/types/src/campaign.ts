import { z } from "zod";
import type { Delta } from "./analytics";
import type { QRCode } from "./qr";

export const CreateCampaignSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  description: z.string().trim().max(280).default(""),
});
export type CreateCampaignInput = z.input<typeof CreateCampaignSchema>;

export const UpdateCampaignSchema = CreateCampaignSchema.partial().refine((v) => Object.keys(v).length > 0, "Nothing to update");
export type UpdateCampaignInput = z.input<typeof UpdateCampaignSchema>;

export interface Campaign {
  id: string;
  name: string;
  description: string;
  qrCodeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignDetail {
  campaign: Campaign;
  qrCodes: QRCode[];
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
  activeCodes: number;
  topCountry: { name: string; countryCode: string; share: number } | null;
  totalScansDelta: Delta;
  uniqueVisitorsDelta: Delta;
  /** Last 7 days, one label per day. */
  labels: string[];
  channels: ChannelSeries[];
}
