"use client";

import { Plus, Share } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/lib/i18n/provider";

const STEP_ICONS = [Share, Plus, null] as const;

/** iOS has no install prompt API: the only way is Share → Add to Home Screen, so we show how. */
export function IosInstallSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={t.pwa.iosTitle}>
      <ol className="flex flex-col gap-4">
        {t.pwa.iosSteps.map((step, i) => {
          const Icon = STEP_ICONS[i];
          return (
            <li key={step} className="flex items-start gap-3 text-sm text-muted-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-raised text-xs font-bold text-fg-strong">
                {Icon ? <Icon className="size-3.5" aria-hidden /> : i + 1}
              </span>
              <span className="pt-1">{step}</span>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-subtle">{t.pwa.iosSafariOnly}</p>
    </Modal>
  );
}
