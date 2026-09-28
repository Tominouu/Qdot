import { formatNumber } from "@/lib/utils/format";

interface Row {
  name: string;
  value: number;
  color?: string;
}

/** Dark tooltip card shared by the Recharts charts. */
export function ChartTooltipCard({ label, rows }: { label: string; rows: Row[] }) {
  return (
    <div className="min-w-36 rounded-lg border border-line bg-bg/95 px-3 py-2.5 shadow-xl shadow-black/40 backdrop-blur">
      <p className="mb-1.5 text-xs font-semibold text-fg-strong">{label}</p>
      <ul className="flex flex-col gap-1">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-muted-2">
              {r.color && <span className="size-2 rounded-full" style={{ background: r.color }} aria-hidden />}
              {r.name}
            </span>
            <span className="font-semibold text-fg-strong tabular-nums">{formatNumber(r.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
