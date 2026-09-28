import { seededRandom } from "@/lib/utils/seeded-random";
import type { CountryShare, ScanEvent, ShareItem, TimeRange, TimeSeriesPoint } from "@/types";

/** Weekly shape taken from the Figma "Scans over time" chart (Mon → Sun). */
const WEEK_SHAPE = [0.62, 0.72, 0.64, 0.86, 0.83, 1, 0.94];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Deterministic mock series; the real API buckets scans server-side. */
export function buildTimeseries(range: TimeRange, scale: number, seed = 1): TimeSeriesPoint[] {
  const rand = seededRandom(seed);
  const jitter = (v: number) => Math.round(v * (0.92 + rand() * 0.16));
  const make = (label: string, weight: number, i: number): TimeSeriesPoint => {
    const total = jitter(scale * weight);
    return { label, start: String(i), total, unique: Math.round(total * (0.66 + rand() * 0.06)) };
  };

  switch (range) {
    case "24h":
      return Array.from({ length: 24 }, (_, h) => {
        const diurnal = 0.25 + 0.75 * Math.sin((Math.PI * Math.max(0, h - 6)) / 18) ** 2;
        return make(`${String(h).padStart(2, "0")}:00`, diurnal / 16, h);
      });
    case "7d":
      return WEEKDAYS.map((d, i) => make(d, WEEK_SHAPE[i], i));
    case "30d":
      return Array.from({ length: 30 }, (_, i) => {
        const date = new Date(Date.UTC(2026, 7, 30 + i));
        return make(`${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`, (0.7 + (i / 29) * 0.3) * WEEK_SHAPE[i % 7], i);
      });
    case "3m":
      return Array.from({ length: 13 }, (_, i) => {
        const date = new Date(Date.UTC(2026, 6, 1 + i * 7));
        return make(`${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`, (0.55 + (i / 12) * 0.45) * 7, i);
      });
    case "all":
      return MONTHS.slice(0, 9).map((m, i) => make(m, (0.2 + (i / 8) * 0.8) * 30, i));
  }
}

export const RANGE_MULTIPLIER: Record<TimeRange, number> = { "24h": 0.035, "7d": 0.24, "30d": 1, "3m": 2.7, all: 6.2 };

const withCounts = <T extends { share: number }>(items: T[], total: number) => items.map((i) => ({ ...i, count: Math.round((i.share / 100) * total) }));

export function mockBreakdown(total: number) {
  return {
    countryCount: 24,
    countries: withCounts<Omit<CountryShare, "count">>(
      [
        { label: "France", countryCode: "FR", share: 72 },
        { label: "Belgium", countryCode: "BE", share: 11 },
        { label: "Switzerland", countryCode: "CH", share: 8 },
        { label: "Germany", countryCode: "DE", share: 5 },
        { label: "Other", countryCode: "XX", share: 4 },
      ],
      total,
    ),
    cities: withCounts<Omit<ShareItem, "count">>(
      [
        { label: "Paris, FR", share: 41 },
        { label: "Lyon, FR", share: 14 },
        { label: "Brussels, BE", share: 9 },
      ],
      total,
    ),
    devices: withCounts<Omit<ShareItem, "count">>(
      [
        { label: "Mobile", share: 94 },
        { label: "Desktop", share: 4 },
        { label: "Tablet", share: 2 },
      ],
      total,
    ),
    browsers: withCounts<Omit<ShareItem, "count">>(
      [
        { label: "Safari", share: 52 },
        { label: "Chrome", share: 31 },
        { label: "Firefox", share: 10 },
        { label: "Edge", share: 7 },
      ],
      total,
    ),
    operatingSystems: withCounts<Omit<ShareItem, "count">>(
      [
        { label: "iOS", share: 61 },
        { label: "Android", share: 33 },
        { label: "macOS", share: 4 },
        { label: "Windows", share: 2 },
      ],
      total,
    ),
    referrers: withCounts<Omit<ShareItem, "count">>(
      [
        { label: "Direct scan", share: 88 },
        { label: "instagram.com", share: 7 },
        { label: "Other", share: 5 },
      ],
      total,
    ),
  };
}

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

export function buildRecentScans(qrCodeId: string): ScanEvent[] {
  const rows: Omit<ScanEvent, "id" | "qrCodeId" | "scannedAt" | "referrer">[] = [
    { country: "France", countryCode: "FR", region: "Île-de-France", city: "Paris", device: "mobile", os: "iOS", browser: "Safari" },
    { country: "United States", countryCode: "US", region: "New York", city: "New York", device: "mobile", os: "Android", browser: "Chrome" },
    { country: "United Kingdom", countryCode: "GB", region: "England", city: "London", device: "mobile", os: "iOS", browser: "Safari" },
    { country: "Germany", countryCode: "DE", region: "Berlin", city: "Berlin", device: "mobile", os: "Android", browser: "Samsung Internet" },
    { country: "Japan", countryCode: "JP", region: "Tokyo", city: "Tokyo", device: "tablet", os: "iOS", browser: "Chrome" },
  ];
  return rows.map((r, i) => ({ ...r, id: `${qrCodeId}_scan_${i}`, qrCodeId, scannedAt: minutesAgo([2, 12, 45, 60, 120][i]), referrer: null }));
}
