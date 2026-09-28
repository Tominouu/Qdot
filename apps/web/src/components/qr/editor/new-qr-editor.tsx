"use client";

import { useState } from "react";
import type { QRCategory } from "@/types";
import { QREditor } from "./qr-editor";
import { initialDraft } from "./use-qr-draft";

/** `slug` is reserved server-side so the preview is exactly what gets printed. */
export function NewQREditor({ slug, category, campaignId }: { slug: string; category?: QRCategory; campaignId?: string }) {
  const [initial] = useState(() => initialDraft({ slug, category, campaignId }));
  return <QREditor initial={initial} />;
}
