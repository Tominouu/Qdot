"use client";

import { useMemo, useReducer } from "react";
import { shortUrlFor } from "@/lib/config";
import { contentTypeConfig } from "@/lib/qr/content-types";
import { DEFAULT_QR_STYLE } from "@/lib/qr/presets";
import { checkScannability } from "@/lib/qr/scannability";
import type { QRCategory, QRCode, QRContentType, QRStyle } from "@/types";

export interface QRDraft {
  slug: string;
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

export function initialDraft(opts: { slug: string; category?: QRCategory; campaignId?: string; existing?: QRCode }): QRDraft {
  const { existing } = opts;
  if (existing) {
    return {
      slug: existing.slug,
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
    slug: opts.slug,
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

  const derived = useMemo(() => {
    const inputError = config.validate(draft.input);
    return {
      payload: shortUrlFor(draft.slug),
      destination: inputError ? null : config.toDestination(draft.input),
      inputError,
      scannability: checkScannability(draft.style),
    };
  }, [config, draft.input, draft.slug, draft.style]);

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
