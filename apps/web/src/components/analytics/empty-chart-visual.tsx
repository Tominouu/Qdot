/** Dashed three-segment line over a soft glow (empty-state-analytics frame). */
export function EmptyChartVisual() {
  return (
    <div className="relative flex h-40 w-[220px] animate-pop items-center justify-center" aria-hidden>
      <div className="absolute inset-4 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0)_70%)]" />
      <svg viewBox="0 0 164 56" className="relative w-[164px]" fill="none" strokeWidth={1.5} strokeDasharray="3 3" strokeLinecap="round">
        <path d="M1 36 L52 6" stroke="#e8503a" />
        <path d="M58 6 L106 54" stroke="#3b82f6" />
        <path d="M108 54 L163 1" stroke="#22c55e" />
      </svg>
    </div>
  );
}
