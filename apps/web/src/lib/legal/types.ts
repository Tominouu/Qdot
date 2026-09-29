export const LEGAL_DOCS = ["notice", "privacy", "terms", "cookies"] as const;
export type LegalDocId = (typeof LEGAL_DOCS)[number];

/** A paragraph, or a bulleted list. */
export type LegalBlock = string | { list: string[] };

export interface LegalDoc {
  title: string;
  intro: string;
  sections: { id: string; heading: string; body: LegalBlock[] }[];
}

export type LegalDocs = Record<LegalDocId, LegalDoc>;
