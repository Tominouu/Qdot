import { formatRelativeTime } from "@/lib/utils/format";
import type { ScanEvent } from "@/types";

const COLUMNS = ["Time", "Location", "Device", "Browser", "OS"] as const;

const DEVICE_LABEL: Record<ScanEvent["device"], string> = { mobile: "Mobile", tablet: "Tablet", desktop: "Desktop" };

/** "Paris, France" / "France" / "Unknown location" (private networks have no geography). */
export function scanLocation(s: ScanEvent): string {
  return [s.city, s.country].filter(Boolean).join(", ") || "Unknown location";
}

function cells(s: ScanEvent) {
  return [formatRelativeTime(s.scannedAt), scanLocation(s), DEVICE_LABEL[s.device], s.browser ?? "Unknown", s.os ?? "Unknown"];
}

/** "Recent scan history": a table on ≥ md, stacked cards on mobile. */
export function ScansTable({ scans }: { scans: ScanEvent[] }) {
  if (!scans.length) {
    return <p className="rounded-2xl border border-line bg-surface p-6 text-sm text-muted">No scans recorded yet.</p>;
  }
  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-line md:block">
        <table className="w-full table-fixed text-left text-[13px]">
          <thead className="bg-bg">
            <tr>
              {COLUMNS.map((c) => (
                <th key={c} scope="col" className="px-6 py-4 text-xs font-medium text-subtle">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scans.map((s) => (
              <tr key={s.id} className="border-t border-line bg-surface transition-colors hover:bg-surface-raised">
                {cells(s).map((value, i) => (
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
              <p className="text-sm font-semibold text-fg">{scanLocation(s)}</p>
              <p className="text-xs text-subtle">{formatRelativeTime(s.scannedAt)}</p>
            </div>
            <p className="mt-1 text-xs text-muted-2">
              {cells(s).slice(2).join(" · ")}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
