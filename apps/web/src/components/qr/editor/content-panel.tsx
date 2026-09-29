"use client";

import { Contact, Link2, Lock, Mail, MessageSquare, Phone, Wifi, type LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
import { Field, Input } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { useI18n } from "@/lib/i18n/provider";
import { QR_TYPE_LIST } from "@/lib/qr/types";
import { cn } from "@/lib/utils/cn";
import type { QRContent, QRContentType } from "@/types";
import { CONTENT_FORMS, type ContentFormProps } from "./content-forms";
import { PanelSection } from "./controls";
import type { QRDraftController } from "./use-qr-draft";

const ICONS: Record<QRContentType, LucideIcon> = { url: Link2, wifi: Wifi, vcard: Contact, email: Mail, sms: MessageSquare, phone: Phone };

export function ContentPanel({ ctrl }: { ctrl: QRDraftController }) {
  const { t } = useI18n();
  const { draft, content, mode, dynamicCapable, errors } = ctrl;
  const Form = CONTENT_FORMS[draft.type] as unknown as ComponentType<ContentFormProps<QRContentType>>;
  const shownErrors = draft.touched ? errors : {};

  return (
    <PanelSection title={t.editor.sections.content}>
      <div role="radiogroup" aria-label={t.editor.panels.type} className="grid grid-cols-3 gap-2">
        {QR_TYPE_LIST.map((def) => {
          const Icon = ICONS[def.type];
          const active = draft.type === def.type;
          // A saved dynamic code must keep pointing at a URL (printed images resolve through /r/:code).
          const disabled = draft.modeLocked && draft.mode === "dynamic" && !def.dynamic;
          return (
            <button
              key={def.type}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => active || ctrl.setType(def.type)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                active ? "border-fg-strong bg-surface-raised text-fg-strong" : "border-line bg-surface text-subtle enabled:hover:text-fg",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {t.editor.contentTypes[def.type].label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-2">{t.editor.mode.label}</span>
          {dynamicCapable && !draft.modeLocked ? (
            <Segmented
              variant="track"
              label={t.editor.mode.label}
              value={mode}
              onChange={(m) => ctrl.set({ mode: m })}
              options={[
                { value: "dynamic", label: t.editor.mode.dynamic },
                { value: "static", label: t.editor.mode.static },
              ]}
            />
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-raised px-2 py-1 text-xs font-semibold text-fg">
              {draft.modeLocked && <Lock className="size-3" aria-hidden />}
              {mode === "dynamic" ? t.editor.mode.dynamic : t.editor.mode.static}
            </span>
          )}
        </div>
        <p className="text-[11px] leading-relaxed text-subtle">
          {!dynamicCapable ? t.editor.mode.staticOnly : draft.modeLocked ? t.editor.mode.locked : mode === "dynamic" ? t.editor.mode.dynamicHint : t.editor.mode.staticHint}
        </p>
      </div>

      <Form value={content} onChange={(c: QRContent) => ctrl.setContent(c)} errors={shownErrors} onBlur={() => ctrl.touch()} />

      <Field label={t.editor.panels.name} labelClassName="text-xs font-normal text-muted-2">
        {(id) => <Input id={id} density="sm" placeholder={t.editor.panels.namePlaceholder} value={draft.name} maxLength={80} onChange={(e) => ctrl.set({ name: e.target.value })} />}
      </Field>
    </PanelSection>
  );
}
