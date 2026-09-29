import type { Locale } from "@/lib/i18n/config";
import { legalEn } from "./content-en";
import { legalFr } from "./content-fr";
import type { LegalDocs } from "./types";

export { LEGAL_ENTITY } from "./entity";
export { LEGAL_DOCS, type LegalBlock, type LegalDoc, type LegalDocId } from "./types";

export const LEGAL_CONTENT: Record<Locale, LegalDocs> = { en: legalEn, fr: legalFr };

export const legalHref = (doc: "notice" | "privacy" | "terms" | "cookies") => `/legal/${doc}`;
