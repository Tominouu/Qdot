export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Preference cookie (strictly necessary: it only remembers the language the visitor picked). */
export const LOCALE_COOKIE = "qdot-locale";

/** BCP 47 tags for Intl formatting. */
export const INTL_LOCALE: Record<Locale, string> = { en: "en-US", fr: "fr-FR" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** First supported language in an Accept-Language header ("fr-FR,fr;q=0.9,en;q=0.8"). */
export function localeFromAcceptLanguage(header: string | null): Locale {
  const tags = (header ?? "")
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.slice(0, 2).toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  return tags.find((t) => isLocale(t.lang))?.lang as Locale | undefined ?? DEFAULT_LOCALE;
}
