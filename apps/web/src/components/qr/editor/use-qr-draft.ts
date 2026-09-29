"use client";

import { useMemo, useReducer } from "react";
import { previewShortUrl } from "@/lib/config";
import { useI18n } from "@/lib/i18n/provider";
import { DEFAULT_QR_DESIGN } from "@/lib/qr/presets";
import { buildQRGeometry } from "@/lib/qr/render/geometry";
import { analyzeDesign } from "@/lib/qr/scannability";
import { contentPayload, defaultContent, QR_TYPES, validateContent } from "@/lib/qr/types";
import type { PendingQRCode, QRCategory, QRCode, QRContent, QRContentType, QRDesign, QRMode } from "@/types";

export interface QRDraft {
  /** Placeholder code for new codes; the API assigns the real one on save. */
  previewCode: string;
  /** Real redirect URL when editing a saved code (never changes). */
  shortUrl: string | null;
  name: string;
  category: QRCategory;
  campaignId: string | null;
  mode: QRMode;
  /** True when editing: the mode is fixed once a code exists. */
  modeLocked: boolean;
  type: QRContentType;
  contents: Partial<Record<QRContentType, QRContent>>;
  design: QRDesign;
  /** Show validation errors only after the user interacted or tried to submit. */
  touched: boolean;
}

type Action =
  | { type: "set"; patch: Partial<Pick<QRDraft, "name" | "category" | "campaignId" | "mode" | "touched">> }
  | { type: "contentType"; value: QRContentType }
  | { type: "content"; value: QRContent }
  | { type: "design"; update: (d: QRDesign) => QRDesign }
  | { type: "touch" };

function reducer(state: QRDraft, action: Action): QRDraft {
  switch (action.type) {
    case "set":
      return { ...state, ...action.patch };
    case "contentType": {
      const dynamicOk = QR_TYPES[action.value].dynamic;
      return {
        ...state,
        type: action.value,
        // Static-only types force static; switching back to URL restores dynamic for new codes.
        mode: state.modeLocked ? state.mode : dynamicOk ? (state.type === action.value ? state.mode : "dynamic") : "static",
        touched: false,
      };
    }
    case "content":
      return { ...state, contents: { ...state.contents, [action.value.type]: action.value } };
    case "design":
      return { ...state, design: action.update(state.design) };
    case "touch":
      return { ...state, touched: true };
  }
}

export function initialDraft(opts: {
  previewCode: string;
  category?: QRCategory;
  campaignId?: string;
  existing?: QRCode;
  /** Draft saved before the onboarding Account step. */
  pending?: PendingQRCode["draft"];
}): QRDraft {
  const { existing, pending } = opts;
  if (pending) return { ...pending, shortUrl: null, modeLocked: false, touched: false };
  if (existing) {
    return {
      previewCode: existing.code,
      shortUrl: existing.shortUrl,
      name: existing.name,
      category: existing.category,
      campaignId: existing.campaignId,
      mode: existing.mode,
      modeLocked: true,
      type: existing.type,
      contents: { [existing.type]: existing.content },
      design: existing.design,
      touched: false,
    };
  }
  return {
    previewCode: opts.previewCode,
    shortUrl: null,
    name: "",
    category: opts.category ?? "website",
    campaignId: opts.campaignId ?? null,
    mode: "dynamic",
    modeLocked: false,
    type: "url",
    contents: {},
    design: structuredClone(DEFAULT_QR_DESIGN),
    touched: false,
  };
}

/** All editor state + derived values. UI components stay presentational. */
export function useQRDraft(initial: QRDraft) {
  const [draft, dispatch] = useReducer(reducer, initial);
  const { t } = useI18n();
  const content = draft.contents[draft.type] ?? defaultContent(draft.type);
  const dynamicCapable = QR_TYPES[draft.type].dynamic;
  const mode: QRMode = dynamicCapable ? draft.mode : "static";

  const derived = useMemo(() => {
    const errors = validateContent(content, t);
    const valid = Object.keys(errors).length === 0;
    const payload = mode === "dynamic" ? (draft.shortUrl ?? previewShortUrl(draft.previewCode)) : contentPayload(content);
    const geometry = buildQRGeometry(payload, draft.design);
    return {
      errors,
      valid,
      payload,
      /** False until the API has assigned the code (new dynamic codes). */
      payloadIsFinal: mode === "static" || draft.shortUrl !== null,
      /** Where a dynamic code redirects, once the content is valid. */
      destination: mode === "dynamic" && valid && content.type === "url" ? content.url.trim() : null,
      report: analyzeDesign(draft.design, geometry),
      geometry,
    };
  }, [content, mode, t, draft.design, draft.previewCode, draft.shortUrl]);

  return {
    draft,
    content,
    mode,
    dynamicCapable,
    ...derived,
    set: (patch: Extract<Action, { type: "set" }>["patch"]) => dispatch({ type: "set", patch }),
    setType: (value: QRContentType) => dispatch({ type: "contentType", value }),
    setContent: (value: QRContent) => dispatch({ type: "content", value }),
    updateDesign: (update: (d: QRDesign) => QRDesign) => dispatch({ type: "design", update }),
    touch: () => dispatch({ type: "touch" }),
  };
}

export type QRDraftController = ReturnType<typeof useQRDraft>;
