import { z } from "zod";

export const TIME_RANGES = ["24h", "7d", "30d", "3m", "all"] as const;
export type TimeRange = (typeof TIME_RANGES)[number];
export type DeviceType = "mobile" | "desktop" | "tablet";

export const AnalyticsQuerySchema = z.object({
  range: z.enum(TIME_RANGES).default("7d"),
  /** IANA time zone used to bucket scans, e.g. "Europe/Paris". */
  tz: z
    .string()
    .max(64)
    .refine((tz) => {
      try {
        new Intl.DateTimeFormat("en-US", { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    }, "Unknown time zone")
    .default("UTC"),
});
export type AnalyticsQuery = z.input<typeof AnalyticsQuerySchema>;

export interface ScanEvent {
  id: string;
  qrCodeId: string;
  scannedAt: string;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  device: DeviceType;
  os: string | null;
  browser: string | null;
  referrer: string | null;
}

export interface TimeSeriesPoint {
  label: string;
  /** ISO timestamp of the bucket start. */
  start: string;
  total: number;
  unique: number;
}

export interface ShareItem {
  label: string;
  /** Integer percentage 0–100. */
  share: number;
  count: number;
}

export interface CountryShare extends ShareItem {
  countryCode: string;
}

/** Relative change vs the previous period (percent); null when there is no comparable period. */
export type Delta = { value: number } | null;

export interface PeakActivity {
  label: string;
  scans: number;
}

interface Breakdown {
  /** Number of distinct countries in the period (the list below is top 5 + "Other"). */
  countryCount: number;
  countries: CountryShare[];
  cities: ShareItem[];
  devices: ShareItem[];
  operatingSystems: ShareItem[];
  browsers: ShareItem[];
  referrers: ShareItem[];
}

/** Workspace-wide analytics (Analytics Overview). */
export interface AnalyticsSummary extends Breakdown {
  range: TimeRange;
  totalScans: number;
  uniqueScans: number;
  activeCodes: number;
  totalScansDelta: Delta;
  uniqueScansDelta: Delta;
  sparklines: { total: number[]; unique: number[] };
  timeseries: TimeSeriesPoint[];
}

/** Analytics for one QR code (QR detail). */
export interface QRCodeAnalytics extends Breakdown {
  qrCodeId: string;
  range: TimeRange;
  totalScans: number;
  uniqueVisitors: number;
  totalScansDelta: Delta;
  uniqueVisitorsDelta: Delta;
  /** Percentage of scans from phones. */
  mobileShare: number;
  dominantPlatform: string | null;
  sparklines: { total: number[]; unique: number[] };
  timeseries: TimeSeriesPoint[];
  peak: PeakActivity | null;
  recentScans: ScanEvent[];
}
