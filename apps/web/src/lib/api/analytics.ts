import { buildRecentScans, buildTimeseries, mockBreakdown, RANGE_MULTIPLIER } from "@/data/analytics";
import { USE_MOCK_API } from "@/lib/config";
import { hashString, seededRandom } from "@/lib/utils/seeded-random";
import type { AnalyticsSummary, QRCodeAnalytics, TimeRange } from "@/types";
import { ApiError, apiRequest, browserTimeZone, toQuery } from "./client";
import { delay, readStore } from "./mock-store";

const sparkline = (seed: number) => {
  const rand = seededRandom(seed);
  return Array.from({ length: 8 }, (_, i) => 0.4 + i * 0.05 + rand() * 0.2);
};

/** Workspace-wide analytics (Analytics Overview screen). Aggregated by the API. */
export async function getAnalyticsSummary(range: TimeRange = "30d"): Promise<AnalyticsSummary> {
  if (!USE_MOCK_API) return apiRequest<AnalyticsSummary>(`/analytics${toQuery({ range, tz: browserTimeZone() })}`);

  const codes = readStore().qrCodes;
  const m = codes.some((c) => c.totalScans > 0) ? RANGE_MULTIPLIER[range] : 0;
  const totalScans = Math.round(48293 * m);
  const breakdown = mockBreakdown(totalScans);
  return delay({
    range,
    totalScans,
    uniqueScans: Math.round(31847 * m),
    activeCodes: codes.filter((c) => c.status === "active").length,
    totalScansDelta: m ? { value: 24.1 } : null,
    uniqueScansDelta: m ? { value: 18.7 } : null,
    sparklines: { total: sparkline(11), unique: sparkline(23) },
    timeseries: m ? buildTimeseries(range, 2000, 7) : [],
    ...(m ? breakdown : { ...breakdown, countryCount: 0, countries: [], cities: [], devices: [], browsers: [], operatingSystems: [], referrers: [] }),
  });
}

/** Analytics for a single QR code (detail screen). Aggregated by the API. */
export async function getQRCodeAnalytics(qrCodeId: string, range: TimeRange = "7d"): Promise<QRCodeAnalytics> {
  if (!USE_MOCK_API)
    return apiRequest<QRCodeAnalytics>(`/qr/${encodeURIComponent(qrCodeId)}/analytics${toQuery({ range, tz: browserTimeZone() })}`);

  const qr = readStore().qrCodes.find((q) => q.id === qrCodeId);
  if (!qr) throw new ApiError("QR code not found", 404, "QR_NOT_FOUND");
  const seed = hashString(qr.id);
  const hasScans = qr.totalScans > 0;
  const timeseries = hasScans ? buildTimeseries(range, qr.totalScans / 18, seed) : [];
  const peak = timeseries.reduce<(typeof timeseries)[number] | null>((a, b) => (!a || b.total > a.total ? b : a), null);
  const breakdown = mockBreakdown(qr.totalScans);

  return delay({
    qrCodeId,
    range,
    totalScans: qr.totalScans,
    uniqueVisitors: qr.uniqueScans,
    totalScansDelta: hasScans ? { value: 18.2 } : null,
    uniqueVisitorsDelta: hasScans ? { value: 12.1 } : null,
    mobileShare: hasScans ? 91 : 0,
    dominantPlatform: hasScans ? "iOS" : null,
    sparklines: { total: sparkline(seed), unique: sparkline(seed + 1) },
    timeseries,
    peak: peak ? { label: range === "24h" ? peak.label : `${peak.label} 3PM`, scans: Math.round(peak.total * 0.2) } : null,
    recentScans: hasScans ? buildRecentScans(qr.id) : [],
    ...(hasScans ? breakdown : { ...breakdown, countryCount: 0, countries: [], cities: [], devices: [], browsers: [], operatingSystems: [], referrers: [] }),
  });
}
