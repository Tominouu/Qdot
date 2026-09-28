import { type Database, qrCodes, type QRCodeRow } from "@qdot/database";
import type {
  AnalyticsSummary,
  CampaignAnalytics,
  CountryShare,
  Delta,
  PeakActivity,
  QRCodeAnalytics,
  ScanEvent,
  ShareItem,
  TimeRange,
  TimeSeriesPoint,
} from "@qdot/types";
import { sql, type SQL } from "drizzle-orm";

type Unit = "hour" | "day" | "week" | "month";

interface Window {
  unit: Unit;
  buckets: number;
  /** Inclusive lower bound of the range. */
  start: Date;
  /** Start of the previous, equally long period (for deltas); null for "all". */
  previousStart: Date | null;
}

interface Scope {
  ids: string[];
  tz: string;
}

const UNIT_FOR_RANGE: Record<Exclude<TimeRange, "all">, { unit: Unit; buckets: number }> = {
  "24h": { unit: "hour", buckets: 24 },
  "7d": { unit: "day", buckets: 7 },
  "30d": { unit: "day", buckets: 30 },
  "3m": { unit: "week", buckets: 13 },
};

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function scopeSql(ids: string[]): SQL {
  return sql`qr_code_id in (${sql.join(
    ids.map((id) => sql`${id}::uuid`),
    sql`, `,
  )})`;
}

async function rows<T>(db: Database, query: SQL): Promise<T[]> {
  return (await db.execute(query)) as unknown as T[];
}

async function resolveWindow(db: Database, scope: Scope, range: TimeRange): Promise<Window> {
  if (range === "all") {
    // Months between the first scan and now (0 when there are no scans yet).
    const [r] = await rows<{ months: number | null }>(
      db,
      sql`select
            (extract(year from age(date_trunc('month', now() at time zone ${scope.tz}), date_trunc('month', min(created_at) at time zone ${scope.tz}))) * 12
             + extract(month from age(date_trunc('month', now() at time zone ${scope.tz}), date_trunc('month', min(created_at) at time zone ${scope.tz}))))::int as months
          from scan_events where ${scopeSql(scope.ids)}`,
    );
    const buckets = Math.min(24, Math.max(1, (r?.months ?? 0) + 1));
    const [s] = await rows<{ start: string }>(
      db,
      sql`select ((date_trunc('month', now() at time zone ${scope.tz}) - (${buckets - 1}::int * interval '1 month')) at time zone ${scope.tz})::text as start`,
    );
    return { unit: "month", buckets, start: new Date(s.start), previousStart: null };
  }
  const { unit, buckets } = UNIT_FOR_RANGE[range];
  const [s] = await rows<{ start: string; now: string }>(
    db,
    sql`select ((date_trunc(${unit}, now() at time zone ${scope.tz}) - (${buckets - 1}::int * ${`1 ${unit}`}::interval)) at time zone ${scope.tz})::text as start,
               now()::text as now`,
  );
  const start = new Date(s.start);
  const now = new Date(s.now);
  return { unit, buckets, start, previousStart: new Date(start.getTime() - (now.getTime() - start.getTime())) };
}

function formatBucket(local: string, unit: Unit, range: TimeRange): string {
  // `local` is a wall-clock timestamp in the requested time zone ("YYYY-MM-DDTHH:MM:SS").
  const [date, time] = local.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const h = Number(time.slice(0, 2));
  const utc = new Date(Date.UTC(y, m - 1, d, h));
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { ...o, timeZone: "UTC" }).format(utc);
  if (unit === "hour") return `${String(h).padStart(2, "0")}:00`;
  if (unit === "day" && range === "7d") return fmt({ weekday: "short" });
  if (unit === "month") return fmt({ month: "short" });
  return fmt({ month: "short", day: "numeric" });
}

async function timeseries(db: Database, scope: Scope, w: Window, range: TimeRange): Promise<TimeSeriesPoint[]> {
  const interval = `1 ${w.unit}`;
  const result = await rows<{ b: string; total: number; uniq: number }>(
    db,
    sql`with series as (
          select generate_series(
            date_trunc(${w.unit}, now() at time zone ${scope.tz}) - (${w.buckets - 1}::int * ${interval}::interval),
            date_trunc(${w.unit}, now() at time zone ${scope.tz}),
            ${interval}::interval
          ) as b
        ), scans as (
          select date_trunc(${w.unit}, created_at at time zone ${scope.tz}) as b, count(*)::int as total, count(distinct visitor_hash)::int as uniq
          from scan_events
          where ${scopeSql(scope.ids)} and created_at >= ${w.start.toISOString()}::timestamptz
          group by 1
        )
        select to_char(series.b, 'YYYY-MM-DD"T"HH24:MI:SS') as b, coalesce(scans.total, 0)::int as total, coalesce(scans.uniq, 0)::int as uniq
        from series left join scans on scans.b = series.b
        order by series.b`,
  );
  return result.map((r) => ({ label: formatBucket(r.b, w.unit, range), start: r.b, total: Number(r.total), unique: Number(r.uniq) }));
}

async function totals(db: Database, scope: Scope, w: Window) {
  const prev = w.previousStart?.toISOString() ?? null;
  const [r] = await rows<{ total: number; uniq: number; prev_total: number; prev_uniq: number }>(
    db,
    sql`select
          count(*) filter (where created_at >= ${w.start.toISOString()}::timestamptz)::int as total,
          count(distinct visitor_hash) filter (where created_at >= ${w.start.toISOString()}::timestamptz)::int as uniq,
          count(*) filter (where ${prev}::timestamptz is not null and created_at >= ${prev}::timestamptz and created_at < ${w.start.toISOString()}::timestamptz)::int as prev_total,
          count(distinct visitor_hash) filter (where ${prev}::timestamptz is not null and created_at >= ${prev}::timestamptz and created_at < ${w.start.toISOString()}::timestamptz)::int as prev_uniq
        from scan_events
        where ${scopeSql(scope.ids)} and created_at >= coalesce(${prev}::timestamptz, ${w.start.toISOString()}::timestamptz)`,
  );
  const delta = (current: number, previous: number): Delta =>
    w.previousStart === null || previous === 0 ? null : { value: Math.round(((current - previous) / previous) * 1000) / 10 };
  return {
    total: Number(r.total),
    unique: Number(r.uniq),
    totalDelta: delta(Number(r.total), Number(r.prev_total)),
    uniqueDelta: delta(Number(r.uniq), Number(r.prev_uniq)),
  };
}

/** Top `limit` values as shares of `total`, with the remainder folded into "Other". */
function toShares(groups: { label: string; count: number }[], total: number, limit = 5): ShareItem[] {
  if (!total) return [];
  const top = groups.slice(0, limit);
  const rest = groups.slice(limit).reduce((sum, g) => sum + g.count, 0);
  const items = rest ? [...top, { label: "Other", count: rest }] : top;
  return items.map((g) => ({ label: g.label, count: g.count, share: Math.round((g.count / total) * 100) }));
}

async function breakdown(db: Database, scope: Scope, w: Window, column: SQL, fallback: string, limit = 5) {
  const groups = await rows<{ label: string | null; count: number }>(
    db,
    sql`select ${column} as label, count(*)::int as count
        from scan_events where ${scopeSql(scope.ids)} and created_at >= ${w.start.toISOString()}::timestamptz
        group by 1 order by 2 desc limit 50`,
  );
  const normalized = groups.map((g) => ({ label: g.label ?? fallback, count: Number(g.count) }));
  return (total: number) => toShares(normalized, total, limit);
}

async function countries(db: Database, scope: Scope, w: Window, total: number): Promise<{ count: number; items: CountryShare[] }> {
  const groups = await rows<{ code: string | null; label: string | null; count: number }>(
    db,
    sql`select country_code as code, country as label, count(*)::int as count
        from scan_events where ${scopeSql(scope.ids)} and created_at >= ${w.start.toISOString()}::timestamptz
        group by 1, 2 order by 3 desc limit 50`,
  );
  const count = groups.filter((g) => g.code).length;
  if (!total) return { count, items: [] };
  const top = groups.slice(0, 5);
  const rest = groups.slice(5).reduce((s, g) => s + Number(g.count), 0);
  const items: CountryShare[] = top.map((g) => ({
    countryCode: g.code ?? "XX",
    label: g.label ?? "Unknown",
    count: Number(g.count),
    share: Math.round((Number(g.count) / total) * 100),
  }));
  if (rest) items.push({ countryCode: "XX", label: "Other", count: rest, share: Math.round((rest / total) * 100) });
  return { count, items };
}

async function peak(db: Database, scope: Scope, w: Window, range: TimeRange): Promise<PeakActivity | null> {
  const [r] = await rows<{ dow: number; h: number; c: number }>(
    db,
    sql`select extract(isodow from created_at at time zone ${scope.tz})::int as dow,
               extract(hour from created_at at time zone ${scope.tz})::int as h,
               count(*)::int as c
        from scan_events where ${scopeSql(scope.ids)} and created_at >= ${w.start.toISOString()}::timestamptz
        group by 1, 2 order by 3 desc limit 1`,
  );
  if (!r) return null;
  const hour = Number(r.h);
  const h12 = `${hour % 12 === 0 ? 12 : hour % 12}${hour < 12 ? "AM" : "PM"}`;
  return { label: range === "24h" ? h12 : `${WEEKDAYS[Number(r.dow) - 1]} ${h12}`, scans: Number(r.c) };
}

async function recentScans(db: Database, qrCodeId: string): Promise<ScanEvent[]> {
  const result = await rows<{
    id: string;
    created_at: string;
    country: string | null;
    country_code: string | null;
    region: string | null;
    city: string | null;
    device_type: ScanEvent["device"];
    os: string | null;
    browser: string | null;
    referrer: string | null;
  }>(db, sql`select id, created_at::text, country, country_code, region, city, device_type, os, browser, referrer
             from scan_events where qr_code_id = ${qrCodeId}::uuid order by created_at desc limit 5`);
  return result.map((r) => ({
    id: r.id,
    qrCodeId,
    scannedAt: new Date(r.created_at).toISOString(),
    country: r.country,
    countryCode: r.country_code,
    region: r.region,
    city: r.city,
    device: r.device_type,
    os: r.os,
    browser: r.browser,
    referrer: r.referrer,
  }));
}

const lastPoints = (series: TimeSeriesPoint[], key: "total" | "unique") => series.slice(-12).map((p) => p[key]);

/** Everything the dashboards need for a set of QR codes. */
async function aggregate(db: Database, scope: Scope, range: TimeRange) {
  const w = await resolveWindow(db, scope, range);
  const [series, t] = await Promise.all([timeseries(db, scope, w, range), totals(db, scope, w)]);
  const [cities, devices, operatingSystems, browsers, referrers, countryShares, peakActivity] = await Promise.all([
    breakdown(db, scope, w, sql`case when city is null then null else city || coalesce(', ' || country_code, '') end`, "Unknown"),
    breakdown(db, scope, w, sql`initcap(device_type)`, "Unknown", 3),
    breakdown(db, scope, w, sql`os`, "Unknown"),
    breakdown(db, scope, w, sql`browser`, "Unknown"),
    breakdown(db, scope, w, sql`referrer`, "Direct scan"),
    countries(db, scope, w, t.total),
    peak(db, scope, w, range),
  ]);
  return {
    window: w,
    series,
    totals: t,
    peak: peakActivity,
    breakdown: {
      countryCount: countryShares.count,
      countries: countryShares.items,
      cities: cities(t.total).filter((c) => c.label !== "Unknown"),
      devices: devices(t.total),
      operatingSystems: operatingSystems(t.total),
      browsers: browsers(t.total),
      referrers: referrers(t.total),
    },
  };
}

function emptyAnalytics(range: TimeRange) {
  return {
    series: [] as TimeSeriesPoint[],
    totals: { total: 0, unique: 0, totalDelta: null as Delta, uniqueDelta: null as Delta },
    peak: null,
    breakdown: { countryCount: 0, countries: [], cities: [], devices: [], operatingSystems: [], browsers: [], referrers: [] },
    range,
  };
}

export async function qrCodeAnalytics(db: Database, qr: QRCodeRow, q: { range: TimeRange; tz: string }): Promise<QRCodeAnalytics> {
  const a = await aggregate(db, { ids: [qr.id], tz: q.tz }, q.range);
  const mobile = a.breakdown.devices.find((d) => d.label === "Mobile");
  return {
    qrCodeId: qr.id,
    range: q.range,
    totalScans: a.totals.total,
    uniqueVisitors: a.totals.unique,
    totalScansDelta: a.totals.totalDelta,
    uniqueVisitorsDelta: a.totals.uniqueDelta,
    mobileShare: mobile?.share ?? 0,
    dominantPlatform: a.breakdown.operatingSystems.find((o) => o.label !== "Unknown" && o.label !== "Other")?.label ?? null,
    sparklines: { total: lastPoints(a.series, "total"), unique: lastPoints(a.series, "unique") },
    timeseries: a.series,
    peak: a.peak,
    recentScans: await recentScans(db, qr.id),
    ...a.breakdown,
  };
}

export async function workspaceAnalytics(db: Database, userId: string, q: { range: TimeRange; tz: string }): Promise<AnalyticsSummary> {
  const owned = await rows<{ id: string; status: string }>(db, sql`select id, status from ${qrCodes} where user_id = ${userId}::uuid`);
  const activeCodes = owned.filter((o) => o.status === "active").length;
  if (!owned.length) {
    const e = emptyAnalytics(q.range);
    return {
      range: q.range,
      totalScans: 0,
      uniqueScans: 0,
      activeCodes,
      totalScansDelta: null,
      uniqueScansDelta: null,
      sparklines: { total: [], unique: [] },
      timeseries: [],
      ...e.breakdown,
    };
  }
  const a = await aggregate(db, { ids: owned.map((o) => o.id), tz: q.tz }, q.range);
  return {
    range: q.range,
    totalScans: a.totals.total,
    uniqueScans: a.totals.unique,
    activeCodes,
    totalScansDelta: a.totals.totalDelta,
    uniqueScansDelta: a.totals.uniqueDelta,
    sparklines: { total: lastPoints(a.series, "total"), unique: lastPoints(a.series, "unique") },
    timeseries: a.series,
    ...a.breakdown,
  };
}

export async function campaignAnalytics(
  db: Database,
  campaignId: string,
  codes: { id: string; name: string; status: string }[],
  tz: string,
): Promise<CampaignAnalytics> {
  const activeCodes = codes.filter((c) => c.status === "active").length;
  const base: CampaignAnalytics = {
    campaignId,
    totalScans: 0,
    uniqueVisitors: 0,
    activeCodes,
    topCountry: null,
    totalScansDelta: null,
    uniqueVisitorsDelta: null,
    labels: [],
    channels: [],
  };
  if (!codes.length) return base;

  const scope = { ids: codes.map((c) => c.id), tz };
  const a = await aggregate(db, scope, "7d");
  const perCode = await rows<{ qr_code_id: string; b: string; c: number }>(
    db,
    sql`select qr_code_id, to_char(date_trunc('day', created_at at time zone ${tz}), 'YYYY-MM-DD"T"HH24:MI:SS') as b, count(*)::int as c
        from scan_events where ${scopeSql(scope.ids)} and created_at >= ${a.window.start.toISOString()}::timestamptz
        group by 1, 2`,
  );
  const top = a.breakdown.countries.find((c) => c.countryCode !== "XX");
  return {
    ...base,
    totalScans: a.totals.total,
    uniqueVisitors: a.totals.unique,
    totalScansDelta: a.totals.totalDelta,
    uniqueVisitorsDelta: a.totals.uniqueDelta,
    topCountry: top ? { name: top.label, countryCode: top.countryCode, share: top.share } : null,
    labels: a.series.map((p) => p.label),
    channels: codes.map((c) => ({
      qrCodeId: c.id,
      name: c.name,
      points: a.series.map((p) => Number(perCode.find((r) => r.qr_code_id === c.id && r.b === p.start)?.c ?? 0)),
    })),
  };
}
