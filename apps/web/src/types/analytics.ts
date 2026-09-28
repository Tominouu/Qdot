export type DeviceType = "mobile" | "desktop" | "tablet";

export type TimeRange = "24h" | "7d" | "30d" | "3m" | "all";

/** A single recorded scan, as the redirect backend will store it. */
export interface ScanEvent {
  id: string;
  qrCodeId: string;
  scannedAt: string;
  country: string;
  countryCode: string;
  city: string;
  device: DeviceType;
  deviceModel: string;
  os: string;
  browser: string;
  referrer: string | null;
}

export interface TimeSeriesPoint {
  /** Axis label, already bucketed by the API (e.g. "Mon", "Jan 12", "14:00"). */
  label: string;
  total: number;
  unique: number;
}

export interface ShareItem {
  label: string;
  /** Integer percentage 0–100. */
  share: number;
  count?: number;
}

export interface GeoShare extends ShareItem {
  countryCode: string;
  /** Approximate centroid used by the geography visual. */
  lat: number;
  lng: number;
}

export interface Delta {
  /** Relative change vs the previous period, in percent. */
  value: number;
}

export interface PeakActivity {
  label: string;
  scans: number;
}

export interface AnalyticsSummary {
  range: TimeRange;
  totalScans: number;
  uniqueScans: number;
  countries: number;
  activeCodes: number;
  totalScansDelta: Delta;
  uniqueScansDelta: Delta;
  sparklines: { total: number[]; unique: number[] };
  timeseries: TimeSeriesPoint[];
  geography: GeoShare[];
  devices: ShareItem[];
  browsers: ShareItem[];
  operatingSystems: ShareItem[];
  referrers: ShareItem[];
}

/** Analytics scoped to one QR code (detail screen). */
export interface QRCodeAnalytics {
  qrCodeId: string;
  range: TimeRange;
  totalScans: number;
  uniqueVisitors: number;
  totalScansDelta: Delta;
  uniqueVisitorsDelta: Delta;
  avgScanTimeSeconds: number;
  mobileShare: number;
  dominantPlatform: string;
  countries: number;
  sparklines: { total: number[]; unique: number[] };
  timeseries: TimeSeriesPoint[];
  topLocations: GeoShare[];
  peak: PeakActivity;
  recentScans: ScanEvent[];
}
