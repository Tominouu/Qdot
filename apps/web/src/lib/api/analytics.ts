import {
  BROWSERS,
  DEVICES,
  GEOGRAPHY,
  OPERATING_SYSTEMS,
  RANGE_MULTIPLIER,
  REFERRERS,
  buildRecentScans,
  buildSparkline,
  buildTimeseries,
} from "@/data/analytics";
import { USE_MOCK_API } from "@/lib/config";
import { hashString } from "@/lib/utils/seeded-random";
import type { AnalyticsSummary, QRCodeAnalytics, TimeRange } from "@/types";
import { ApiError, apiRequest, toQuery } from "./client";
import { delay, readStore } from "./mock-store";

/** Workspace-wide analytics (Analytics Overview screen). */
export async function getAnalyticsSummary(range: TimeRange = "30d"): Promise<AnalyticsSummary> {
  if (!USE_MOCK_API) return apiRequest<AnalyticsSummary>(`/analytics/summary${toQuery({ range })}`);

  const codes = readStore().qrCodes;
  const m = codes.some((c) => c.totalScans > 0) ? RANGE_MULTIPLIER[range] : 0;
  const totalScans = Math.round(48293 * m);
  const uniqueScans = Math.round(31847 * m);
  return delay({
    range,
    totalScans,
    uniqueScans,
    countries: range === "24h" ? 9 : 24,
    activeCodes: codes.filter((c) => c.status === "active").length,
    totalScansDelta: { value: 24.1 },
    uniqueScansDelta: { value: 18.7 },
    sparklines: { total: buildSparkline(11), unique: buildSparkline(23) },
    timeseries: buildTimeseries(range, 2000, 7),
    geography: GEOGRAPHY,
    devices: DEVICES,
    browsers: BROWSERS,
    operatingSystems: OPERATING_SYSTEMS,
    referrers: REFERRERS,
  });
}

/** Analytics for a single QR code (detail screen). */
export async function getQRCodeAnalytics(qrCodeId: string, range: TimeRange = "7d"): Promise<QRCodeAnalytics> {
  if (!USE_MOCK_API)
    return apiRequest<QRCodeAnalytics>(`/qr-codes/${encodeURIComponent(qrCodeId)}/analytics${toQuery({ range })}`);

  const qr = readStore().qrCodes.find((q) => q.id === qrCodeId);
  if (!qr) throw new ApiError("QR code not found", 404);

  const seed = hashString(qr.id);
  const hasScans = qr.totalScans > 0;
  const timeseries = hasScans ? buildTimeseries(range, qr.totalScans / 18, seed) : [];
  const peakPoint = timeseries.reduce((a, b) => (b.total > a.total ? b : a), timeseries[0] ?? { label: "—", total: 0 });

  return delay({
    qrCodeId,
    range,
    totalScans: qr.totalScans,
    uniqueVisitors: qr.uniqueScans,
    totalScansDelta: { value: hasScans ? 18.2 : 0 },
    uniqueVisitorsDelta: { value: hasScans ? 12.1 : 0 },
    avgScanTimeSeconds: hasScans ? 4.2 : 0,
    mobileShare: hasScans ? 91 : 0,
    dominantPlatform: "iOS",
    countries: hasScans ? 6 : 0,
    sparklines: { total: buildSparkline(seed), unique: buildSparkline(seed + 1) },
    timeseries,
    topLocations: hasScans ? GEOGRAPHY.slice(0, 3) : [],
    peak: { label: range === "24h" ? `Today ${peakPoint.label}` : `${peakPoint.label} 3PM`, scans: Math.round(peakPoint.total * 0.2) },
    recentScans: hasScans ? buildRecentScans(qr.id) : [],
  });
}
