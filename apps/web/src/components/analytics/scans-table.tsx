"use client";

import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { countryName } from "@/lib/i18n/labels";
import { useI18n } from "@/lib/i18n/provider";
import { formatRelativeTime } from "@/lib/utils/format";
import type { ScanEvent } from "@/types";

/** "Paris, France" / "France" / "Unknown location" (private networks have no geography). */
export function scanLocation(s: ScanEvent, t: Dictionary, locale: Locale): string {
  const country = s.country ? countryName(s.countryCode, s.country, locale) : null;
  return [s.city, country].filter(Boolean).join(", ") || t.common.unknownLocation;
}

function cells(s: ScanEvent, t: Dictionary, locale: Locale) {
  return [
    formatRelativeTime(s.scannedAt, locale),
    scanLocation(s, t, locale),
    t.analytics.deviceTypes[s.device],
    s.browser ?? t.common.unknown,
    s.os ?? t.common.unknown,
  ];
}

/** "Recent scan history": a table on ≥ md, stacked cards on mobile. */
export function ScansTable({ scans }: { scans: ScanEvent[] }) {
  const { t, locale } = useI18n();
  if (!scans.length) {
    return <p className="rounded-2xl border border-line bg-surface p-6 text-sm text-muted">{t.analytics.noScansRecorded}</p>;
  }
  const columns = [t.analytics.table.time, t.analytics.table.location, t.analytics.table.device, t.analytics.table.browser, t.analytics.table.os];
  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-line md:block">
        <table className="w-full table-fixed text-left text-[13px]">
          <thead className="bg-bg">
            <tr>
              {columns.map((c) => (
                <th key={c} scope="col" className="px-6 py-4 text-xs font-medium text-subtle">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scans.map((s) => (
              <tr key={s.id} className="border-t border-line bg-surface transition-colors hover:bg-surface-raised">
                {cells(s, t, locale).map((value, i) => (
                  <td key={i} className={`truncate px-6 py-4 ${i < 2 ? "text-fg-strong" : "text-muted-2"}`}>
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-3 md:hidden">
        {scans.map((s) => (
          <li key={s.id} className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-fg">{scanLocation(s, t, locale)}</p>
              <p className="text-xs text-subtle">{formatRelativeTime(s.scannedAt, locale)}</p>
            </div>
            <p className="mt-1 text-xs text-muted-2">
              {cells(s, t, locale).slice(2).join(" · ")}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
