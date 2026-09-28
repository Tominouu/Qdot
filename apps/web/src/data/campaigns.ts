import type { Campaign, CampaignAnalytics } from "@/types";

export const CAMPAIGNS: Campaign[] = [
  {
    id: "summer-2026",
    name: "Summer 2026",
    description: "Summer marketing campaign across all restaurant locations",
    status: "active",
    qrCodeIds: ["qr_summer_menu", "qr_restaurant_wifi", "qr_instagram", "qr_feedback"],
    createdAt: "2026-05-01T09:00:00.000Z",
    updatedAt: "2026-09-25T16:40:00.000Z",
  },
];

export const CAMPAIGN_ANALYTICS: Record<string, CampaignAnalytics> = {
  "summer-2026": {
    campaignId: "summer-2026",
    totalScans: 28745,
    uniqueVisitors: 19281,
    topCountry: { name: "France", countryCode: "FR", share: 42 },
    conversionRate: 4.8,
    totalScansDelta: { value: 22.3 },
    uniqueVisitorsDelta: { value: 15.8 },
    conversionRateDelta: { value: 0.4 },
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    channels: [
      { qrCodeId: "qr_summer_menu", name: "Summer Menu", points: [1420, 1610, 1540, 1880, 2050, 2310, 2140] },
      { qrCodeId: "qr_instagram", name: "Instagram Page", points: [980, 1120, 1260, 1210, 1180, 1320, 1350] },
      { qrCodeId: "qr_restaurant_wifi", name: "Restaurant WiFi", points: [540, 610, 700, 820, 760, 880, 910] },
      { qrCodeId: "qr_feedback", name: "Feedback Form", points: [310, 420, 380, 460, 520, 470, 540] },
    ],
  },
};
