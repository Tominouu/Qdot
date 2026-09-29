"use client";

import { useMemo, useReducer } from "react";
import { previewShortUrl } from "@/lib/config";
import { useI18n } from "@/lib/i18n/provider";
import { contentTypeConfig } from "@/lib/qr/content-types";
import { DEFAULT_QR_STYLE } from "@/lib/qr/presets";
import { checkScannability } from "@/lib/qr/scannability";
import type { PendingQRCode, QRCategory, QRCode, QRContentType, QRStyle } from "@/types";

export interface QRDraft {
  /** Placeholder code for new codes; the API assigns the real one on save. */
  previewCode: string;
  /** Real redirect URL when editing a saved code (never changes). */
  shortUrl: string | null;
  name: string;
  type: QRContentType;
  category: QRCategory;
  campaignId: string | null;
  /** Raw value of the primary field (URL, email, phone…). */
  input: string;
  style: QRStyle;
  /** Show validation errors only after the user interacted or tried to submit. */
  touched: boolean;
}

type Action =
  | { type: "set"; patch: Partial<Omit<QRDraft, "style">> }
  | { type: "style"; patch: Partial<QRStyle> }
  | { type: "touch" };

function reducer(state: QRDraft, action: Action): QRDraft {
  switch (action.type) {
    case "set":
      return { ...state, ...action.patch };
    case "style":
      return { ...state, style: { ...state.style, ...action.patch } };
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
  const { existing } = opts;
  if (opts.pending) return { ...opts.pending, shortUrl: null, touched: false };
  if (existing) {
    return {
      previewCode: existing.code,
      shortUrl: existing.shortUrl,
      name: existing.name,
      type: existing.type,
      category: existing.category,
      campaignId: existing.campaignId,
      input: contentTypeConfig(existing.type).fromDestination(existing.destinationUrl),
      style: existing.style,
      touched: false,
    };
  }
  return {
    previewCode: opts.previewCode,
    shortUrl: null,
    name: "",
    type: "url",
    category: opts.category ?? "website",
    campaignId: opts.campaignId ?? null,
    input: "",
    style: DEFAULT_QR_STYLE,
    touched: false,
  };
}

/** All editor state + derived values. UI components stay presentational. */
export function useQRDraft(initial: QRDraft) {
  const [draft, dispatch] = useReducer(reducer, initial);
  const config = contentTypeConfig(draft.type);
  const { t } = useI18n();

  const derived = useMemo(() => {
    const inputError = config.validate(draft.input, t);
    return {
      payload: draft.shortUrl ?? previewShortUrl(draft.previewCode),
      /** False until the API has assigned the code (new QR codes). */
      payloadIsFinal: draft.shortUrl !== null,
      destination: inputError ? null : config.toDestination(draft.input),
      inputError,
      scannability: checkScannability(draft.style),
    };
  }, [config, t, draft.input, draft.previewCode, draft.shortUrl, draft.style]);

  return {
    draft,
    config,
    ...derived,
    set: (patch: Partial<Omit<QRDraft, "style">>) => dispatch({ type: "set", patch }),
    setStyle: (patch: Partial<QRStyle>) => dispatch({ type: "style", patch }),
    touch: () => dispatch({ type: "touch" }),
  };
}

export type QRDraftController = ReturnType<typeof useQRDraft>;
