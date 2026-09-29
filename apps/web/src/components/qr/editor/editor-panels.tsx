"use client";

import { Link2 } from "lucide-react";
import type { ReactNode } from "react";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n/provider";
import { CONTENT_TYPES } from "@/lib/qr/content-types";
import { EYE_OPTIONS, PATTERN_OPTIONS } from "@/lib/qr/presets";
import { cn } from "@/lib/utils/cn";
import { ColorField } from "./color-field";
import { LogoDropzone } from "./logo-dropzone";
import { EyePreview, OptionPicker, PatternPreview } from "./option-picker";
import type { QRDraftController } from "./use-qr-draft";

export function PanelSection({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={className} aria-label={title}>
      <h2 className="border-y border-line bg-surface px-4 py-3 font-display text-xs font-bold text-subtle uppercase first:border-t-0 lg:border-t-0">
        {title}
      </h2>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function DestinationPanel({ ctrl, inputRef }: { ctrl: QRDraftController; inputRef?: React.Ref<HTMLInputElement> }) {
  const { draft, config, inputError, set } = ctrl;
  const showError = draft.touched && inputError;
  const { t } = useI18n();
  return (
    <PanelSection title={t.editor.panels.destination}>
      <div className="flex flex-col gap-4">
        <Field label={t.editor.contentTypes[config.value].field} error={showError ? inputError : undefined} labelClassName="text-xs font-normal text-muted-2">
          {(id, describedBy) => (
            <Input
              ref={inputRef}
              id={id}
              density="sm"
              type={config.inputType}
              inputMode={config.inputType === "tel" ? "tel" : config.inputType === "url" ? "url" : undefined}
              autoComplete="off"
              placeholder={config.placeholder}
              value={draft.input}
              aria-invalid={showError ? true : undefined}
              aria-describedby={describedBy}
              onChange={(e) => set({ input: e.target.value })}
              onBlur={() => draft.input && ctrl.touch()}
              icon={draft.type === "url" ? <Link2 className="size-3.5" /> : undefined}
            />
          )}
        </Field>
        <Field label={t.editor.panels.name} labelClassName="text-xs font-normal text-muted-2">
          {(id) => (
            <Input
              id={id}
              density="sm"
              placeholder={t.editor.panels.namePlaceholder}
              value={draft.name}
              maxLength={80}
              onChange={(e) => set({ name: e.target.value })}
            />
          )}
        </Field>
      </div>
    </PanelSection>
  );
}

export function TypePanel({ ctrl }: { ctrl: QRDraftController }) {
  const { draft, set } = ctrl;
  const { t } = useI18n();
  return (
    <PanelSection title={t.editor.panels.type}>
      <div role="radiogroup" aria-label={t.editor.panels.contentType} className="flex flex-wrap gap-2">
        {CONTENT_TYPES.map((ct) => {
          const active = draft.type === ct.value;
          // Only dynamic URL codes are supported by the API for now.
          const available = ct.value === "url";
          return (
            <button
              key={ct.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={!available}
              title={available ? undefined : t.editor.panels.comingSoon}
              onClick={() => active || set({ type: ct.value, input: "", touched: false })}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                active ? "border-line-strong bg-surface-raised text-fg-strong" : "border-line bg-surface text-subtle enabled:hover:text-fg",
              )}
            >
              {t.editor.contentTypes[ct.value].label}
            </button>
          );
        })}
      </div>
    </PanelSection>
  );
}

export function StylePanels({ ctrl, compact }: { ctrl: QRDraftController; compact?: boolean }) {
  const { draft, setStyle } = ctrl;
  const { toast } = useToast();
  const { t } = useI18n();
  const p = t.editor.panels;
  return (
    <>
      <PanelSection title={p.pattern}>
        <OptionPicker
          label={p.modulePattern}
          options={PATTERN_OPTIONS.map((v) => ({ value: v, label: t.editor.patterns[v] }))}
          value={draft.style.pattern}
          onChange={(pattern) => setStyle({ pattern })}
          renderPreview={(p) => <PatternPreview pattern={p} />}
        />
      </PanelSection>
      <PanelSection title={p.eyeShape}>
        <OptionPicker
          label={p.eyeShape}
          options={EYE_OPTIONS.map((v) => ({ value: v, label: t.editor.eyes[v] }))}
          value={draft.style.eyeShape}
          onChange={(eyeShape) => setStyle({ eyeShape })}
          renderPreview={(s) => <EyePreview shape={s} />}
        />
      </PanelSection>
      <PanelSection title={p.colors}>
        <div className={cn(compact ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3")}>
          <ColorField label={p.foreground} layout={compact ? "stacked" : "row"} value={draft.style.foreground} onChange={(foreground) => setStyle({ foreground })} />
          <ColorField label={p.background} layout={compact ? "stacked" : "row"} value={draft.style.background} onChange={(background) => setStyle({ background })} />
        </div>
      </PanelSection>
      <PanelSection title={p.logo}>
        <LogoDropzone value={draft.style.logo} onChange={(logo) => setStyle({ logo })} onError={(m) => toast(m, "warning")} />
      </PanelSection>
    </>
  );
}
