"use client";

import { WifiOff } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

/** Pinned while the device is offline: the app keeps its screens but can't reach the API. */
export function OfflineBanner() {
  const { t } = useI18n();
  return (
    <div role="status" className="sticky top-0 z-[60] flex items-center justify-center gap-2 bg-warning/15 px-4 py-2 text-center text-xs font-semibold text-warning backdrop-blur">
      <WifiOff className="size-3.5 shrink-0" aria-hidden />
      {t.pwa.offline}
    </div>
  );
}
