/**
 * Identity of the site publisher, used by the legal pages (mentions légales,
 * privacy policy, terms). Replace every bracketed placeholder before going live:
 * French law (LCEN art. 6 / loi 2004-575 art. 1-1) requires these details.
 *
 * - Company: legal name, legal form + share capital, head office, RCS/SIREN, VAT number.
 * - Individual publishing non-professionally: you may keep your identity private and
 *   list only the host, provided the host has your details (LCEN art. 1-1, III, 2).
 */
export const LEGAL_ENTITY = {
  /** Company name, or first and last name for an individual. */
  name: "Tom Leclercq",
  /** e.g. "SAS au capital de 1 000 €" (leave empty for an individual). */
  legalForm: "Open Source",
  address: "Non applicable",
  /** e.g. "RCS Paris 123 456 789". */
  registration: "Non applicable",
  vatNumber: "Non applicable",
  /** Person legally responsible for the published content. */
  publicationDirector: "Tom Leclercq",
  email: "tom.leclercq@mmibordeaux.com",
  phone: "0763872695",
  /** Contact for personal-data requests (DPO if one is appointed). */
  privacyEmail: "tom.leclercq@mmibordeaux.com",
  /** Single point of contact for authorities and reports of illegal content (DSA art. 11–12, LCEN). */
  abuseEmail: "tom.leclercq@mmibordeaux.com",
  websiteUrl: "https://app.tom-leclercq.fr/",
  /** Serves the website pages only (static front end + CDN): sees visitors' connection data, not account or scan data. */
  host: {
    name: "Netlify, Inc.",
    address: "44 Montgomery Street, Suite 300, San Francisco, California 94104, USA",
    phone: "+1 415 691 1573",
    location: { fr: "États-Unis", en: "United States" },
  },
  /** Runs the API (QR redirects, accounts) and the PostgreSQL database: holds all personal data. */
  apiHost: {
    name: "Oracle Cloud Infrastructure (Oracle Corporation)",
    address: "2300 Oracle Way, Austin, TX 78741, USA",
    phone: "+1 737 867 1000",
    /** Where the database and its backups live (drives the "transfers outside the EU" section). */
    location: { fr: "France (région Paris)", en: "France (Paris region)" },
  },
  /** ISO date shown as "last updated" on every legal page. */
  lastUpdated: "2026-09-29",
} as const;
