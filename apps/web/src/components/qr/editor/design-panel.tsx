"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n/provider";
import {
  ERROR_CORRECTION_LEVELS,
  EYE_CENTER_SHAPES,
  EYE_FRAME_SHAPES,
  LOGO_SHAPES,
  LOGO_SIZE_RANGE,
  MAX_MARGIN,
  MIN_MARGIN,
  MODULE_SHAPES,
  type ErrorCorrectionSetting,
  type QRDesign,
  type QRFill,
} from "@/types";
import { ColorField } from "./color-field";
import { Accordion, ControlLabel, ImageDropzone, Slider, Tabs } from "./controls";
import { reliableEyes } from "@/lib/qr/render/eyes";
import { EyePreview, ModuleShapePreview, OptionPicker } from "./option-picker";
import type { QRDraftController } from "./use-qr-draft";

type Update = QRDraftController["updateDesign"];

/** Immutable nested update helper: `set((d) => { d.eyes.outer = "circle"; })`. */
const produce = (update: Update) => (mutate: (d: QRDesign) => void) =>
  update((d) => {
    const next = structuredClone(d);
    mutate(next);
    return next;
  });

export function DesignPanel({ ctrl, compact }: { ctrl: QRDraftController; compact?: boolean }) {
  const { t } = useI18n();
  const [tab, setTab] = useState<"design" | "settings">("design");
  return (
    <div>
      <Tabs
        label={t.editor.sections.design}
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "design", label: t.editor.sections.design },
          { value: "settings", label: t.editor.sections.settings },
        ]}
      />
      {tab === "design" ? <DesignTab ctrl={ctrl} compact={compact} /> : <SettingsTab ctrl={ctrl} />}
    </div>
  );
}

function DesignTab({ ctrl, compact }: { ctrl: QRDraftController; compact?: boolean }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const d = ctrl.draft.design;
  const set = produce(ctrl.updateDesign);
  const e = t.editor.design;
  const layout = compact ? "stacked" : "row";
  const [eyesAdjusted, setEyesAdjusted] = useState(false);

  return (
    <div>
      <Accordion title={e.modules} defaultOpen>
        <OptionPicker
          label={e.shape}
          options={MODULE_SHAPES.map((s) => ({ value: s, label: t.editor.moduleShapes[s] }))}
          value={d.modules.shape}
          onChange={(shape) => set((x) => void (x.modules.shape = shape))}
          renderPreview={(s) => <ModuleShapePreview shape={s} />}
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-xs text-muted-2">{e.texture}</span>
            <span className="text-[11px] text-subtle">{e.textureHint}</span>
          </div>
          <Switch size="sm" tone="accent" label={e.texture} checked={d.modules.textured} onCheckedChange={(v) => set((x) => void (x.modules.textured = v))} />
        </div>
      </Accordion>

      <Accordion title={e.eyes}>
        {(
          [
            ["outer", EYE_FRAME_SHAPES, t.editor.frameShapes],
            ["inner", EYE_FRAME_SHAPES, t.editor.frameShapes],
            ["center", EYE_CENTER_SHAPES, t.editor.centerShapes],
          ] as const
        ).map(([part, shapes, labels]) => (
          <div key={part} className="flex flex-col gap-2">
            <ControlLabel>{e[part]}</ControlLabel>
            <OptionPicker
              label={e[part]}
              columns={5}
              options={shapes.map((s) => ({ value: s, label: (labels as Record<string, string>)[s] }))}
              value={d.eyes[part]}
              onChange={(v) =>
                set((x) => {
                  const wanted = { outer: x.eyes.outer, inner: x.eyes.inner, center: x.eyes.center, [part]: v };
                  const fixed = reliableEyes(wanted, part);
                  setEyesAdjusted(fixed !== wanted);
                  x.eyes = { ...x.eyes, ...fixed };
                })
              }
              renderPreview={(v) => <EyePreview {...d.eyes} {...{ [part]: v }} />}
            />
          </div>
        ))}
        {eyesAdjusted && <p className="text-[11px] leading-relaxed text-subtle">{e.eyesAdjusted}</p>}
      </Accordion>

      <Accordion title={e.colors}>
        <FillEditor fill={d.modules.fill} onChange={(fill) => set((x) => void (x.modules.fill = fill))} layout={layout} />
        <ColorField label={e.eyeFrame} layout={layout} value={d.eyes.frameColor} onChange={(c) => set((x) => void (x.eyes.frameColor = c))} />
        <ColorField label={e.eyeCenter} layout={layout} value={d.eyes.centerColor} onChange={(c) => set((x) => void (x.eyes.centerColor = c))} />
      </Accordion>

      <Accordion title={e.background}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-xs text-muted-2">{e.transparent}</span>
            <span className="text-[11px] text-subtle">{e.transparentHint}</span>
          </div>
          <Switch size="sm" tone="accent" label={e.transparent} checked={d.background.transparent} onCheckedChange={(v) => set((x) => void (x.background.transparent = v))} />
        </div>
        {!d.background.transparent && (
          <ColorField label={e.backgroundColor} layout={layout} value={d.background.color} onChange={(c) => set((x) => void (x.background.color = c))} />
        )}
        <ControlLabel>{e.backgroundImage}</ControlLabel>
        <ImageDropzone
          value={d.background.image?.src ?? null}
          onChange={(src) => set((x) => void (x.background.image = src ? { src, opacity: x.background.image?.opacity ?? 0.3 } : null))}
          onError={(m) => toast(m, "warning")}
          dropLabel={e.dropImage}
          removeLabel={e.removeImage}
        />
        {d.background.image && (
          <Slider
            label={e.imageOpacity}
            min={0.05}
            max={1}
            step={0.05}
            value={d.background.image.opacity}
            format={(v) => `${Math.round(v * 100)} %`}
            onChange={(v) => set((x) => void (x.background.image && (x.background.image.opacity = v)))}
          />
        )}
      </Accordion>

      <Accordion title={e.logo}>
        <ImageDropzone
          value={d.logo?.src ?? null}
          onChange={(src) =>
            set((x) => void (x.logo = src ? { src, size: x.logo?.size ?? 0.2, margin: x.logo?.margin ?? 0.5, background: x.logo?.background ?? x.background.color, shape: x.logo?.shape ?? "rounded" } : null))
          }
          onError={(m) => toast(m, "warning")}
          dropLabel={t.editor.logo.drop}
          removeLabel={t.editor.logo.remove}
        />
        {d.logo && (
          <>
            <Slider
              label={e.logoSize}
              min={LOGO_SIZE_RANGE.min}
              max={LOGO_SIZE_RANGE.max}
              step={0.01}
              value={d.logo.size}
              format={(v) => `${Math.round(v * 100)} %`}
              onChange={(v) => set((x) => void (x.logo && (x.logo.size = v)))}
            />
            <Slider label={e.logoMargin} min={0} max={2} step={0.25} value={d.logo.margin} onChange={(v) => set((x) => void (x.logo && (x.logo.margin = v)))} />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-2">{e.logoPlate}</span>
              <Switch
                size="sm"
                tone="accent"
                label={e.logoPlate}
                checked={d.logo.background !== null}
                onCheckedChange={(v) => set((x) => void (x.logo && (x.logo.background = v ? x.background.color : null)))}
              />
            </div>
            {d.logo.background !== null && (
              <>
                <ColorField label={e.logoPlate} layout={layout} value={d.logo.background} onChange={(c) => set((x) => void (x.logo && (x.logo.background = c)))} />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-2">{e.plateShape}</span>
                  <Segmented
                    variant="track"
                    label={e.plateShape}
                    value={d.logo.shape}
                    onChange={(shape) => set((x) => void (x.logo && (x.logo.shape = shape)))}
                    options={LOGO_SHAPES.map((s) => ({ value: s, label: t.editor.logoShapes[s] }))}
                  />
                </div>
              </>
            )}
          </>
        )}
      </Accordion>
    </div>
  );
}

function FillEditor({ fill, onChange, layout }: { fill: QRFill; onChange: (f: QRFill) => void; layout: "row" | "stacked" }) {
  const { t } = useI18n();
  const e = t.editor.design;
  const stops = fill.type === "solid" ? [{ offset: 0, color: fill.color }] : fill.stops;

  const setType = (type: QRFill["type"]) => {
    if (type === fill.type) return;
    if (type === "solid") return onChange({ type, color: stops[0].color });
    const base = fill.type === "solid" ? [{ offset: 0, color: fill.color }, { offset: 1, color: "#E8503A" }] : fill.stops;
    onChange({ type, rotation: fill.type === "solid" ? 45 : fill.rotation, stops: base });
  };
  /** Keeps stops evenly spread whenever one is added or removed. */
  const spread = (colors: string[]) => colors.map((color, i) => ({ offset: colors.length === 1 ? 0 : i / (colors.length - 1), color }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-2">{e.fill}</span>
        <Segmented
          variant="track"
          label={e.fill}
          value={fill.type}
          onChange={setType}
          options={[
            { value: "solid", label: e.solid },
            { value: "linear", label: e.linear },
            { value: "radial", label: e.radial },
          ]}
        />
      </div>
      {fill.type === "solid" ? (
        <ColorField label={e.color} layout={layout} value={fill.color} onChange={(color) => onChange({ type: "solid", color })} />
      ) : (
        <>
          {fill.stops.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1">
                <ColorField
                  label={e.stop(i + 1)}
                  layout={layout}
                  value={s.color}
                  onChange={(color) => onChange({ ...fill, stops: fill.stops.map((x, j) => (j === i ? { ...x, color } : x)) })}
                />
              </div>
              {fill.stops.length > 2 && (
                <button
                  type="button"
                  aria-label={e.removeStop(i + 1)}
                  onClick={() => onChange({ ...fill, stops: spread(fill.stops.filter((_, j) => j !== i).map((x) => x.color)) })}
                  className="rounded-md p-1 text-muted transition-colors hover:bg-surface-raised hover:text-fg"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          ))}
          {fill.stops.length < 4 && (
            <button
              type="button"
              onClick={() => onChange({ ...fill, stops: spread([...fill.stops.map((x) => x.color), fill.stops[fill.stops.length - 1].color]) })}
              className="inline-flex items-center gap-1.5 self-start text-xs font-semibold text-muted transition-colors hover:text-fg"
            >
              <Plus className="size-3.5" aria-hidden />
              {e.addStop}
            </button>
          )}
          {fill.type === "linear" && (
            <Slider label={e.angle} min={0} max={360} step={5} value={fill.rotation} format={(v) => `${v}°`} onChange={(rotation) => onChange({ ...fill, rotation })} />
          )}
        </>
      )}
    </div>
  );
}

function SettingsTab({ ctrl }: { ctrl: QRDraftController }) {
  const { t } = useI18n();
  const s = t.editor.settings;
  const d = ctrl.draft.design;
  const set = produce(ctrl.updateDesign);
  const options: { value: ErrorCorrectionSetting; label: string }[] = [
    { value: "auto", label: s.auto },
    ...ERROR_CORRECTION_LEVELS.map((l) => ({ value: l, label: l })),
  ];
  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-2">
        <ControlLabel>{s.errorCorrection}</ControlLabel>
        <Segmented variant="track" label={s.errorCorrection} value={d.errorCorrection} onChange={(v) => set((x) => void (x.errorCorrection = v))} options={options} />
        <p className="text-[11px] leading-relaxed text-subtle">
          {d.errorCorrection === "auto" ? s.autoResolved(s.levels[ctrl.geometry.errorCorrection]) : s.levels[d.errorCorrection]}
          {" · "}
          {s.errorCorrectionHint}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Slider label={s.margin} min={MIN_MARGIN} max={MAX_MARGIN} value={d.margin} format={s.modules} onChange={(v) => set((x) => void (x.margin = v))} />
        <p className="text-[11px] leading-relaxed text-subtle">{s.marginHint}</p>
      </div>
    </div>
  );
}
