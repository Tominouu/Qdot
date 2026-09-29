"use client";

import { Eye } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useCan } from "@/lib/workspace/provider";
import type { Permission } from "@/types";

/** Tells viewers why create/edit actions are missing. */
export function ReadOnlyNotice({ permission }: { permission: Permission }) {
  const allowed = useCan(permission);
  const { t } = useI18n();
  if (allowed) return null;
  return (
    <p role="note" className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-[13px] text-muted-2">
      <Eye className="size-4 shrink-0 text-subtle" aria-hidden />
      {t.workspace.readOnly}
    </p>
  );
}
