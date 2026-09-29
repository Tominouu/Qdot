import type { MetadataRoute } from "next";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { PWA_COLORS } from "@/lib/pwa/assets";

/**
 * Web app manifest (/manifest.webmanifest): makes Qdot installable on desktop
 * (Chrome, Edge), Android and iOS/iPadOS. Localized like the rest of the site.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  return {
    id: "/",
    name: t.pwa.name,
    short_name: "Qdot",
    description: t.pwa.description,
    lang: locale,
    dir: "ltr",
    // The app home; signed-out users are sent to sign-in and come back here.
    start_url: "/qr-codes?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: PWA_COLORS.background,
    theme_color: PWA_COLORS.background,
    categories: ["productivity", "business", "utilities"],
    prefer_related_applications: false,
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/pwa/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/pwa/icon-monochrome-512.png", sizes: "512x512", type: "image/png", purpose: "monochrome" },
    ],
    shortcuts: [
      { name: t.pwa.shortcuts.newQr, url: "/qr-codes/new?source=pwa-shortcut", icons: [{ src: "/pwa/icon-192.png", sizes: "192x192" }] },
      { name: t.pwa.shortcuts.qrCodes, url: "/qr-codes?source=pwa-shortcut", icons: [{ src: "/pwa/icon-192.png", sizes: "192x192" }] },
      { name: t.pwa.shortcuts.analytics, url: "/analytics?source=pwa-shortcut", icons: [{ src: "/pwa/icon-192.png", sizes: "192x192" }] },
    ],
    screenshots: [
      { src: `/pwa/screenshots/${locale}/wide-library.png`, sizes: "1280x800", type: "image/png", form_factor: "wide", label: t.pwa.shortcuts.qrCodes },
      { src: `/pwa/screenshots/${locale}/wide-editor.png`, sizes: "1280x800", type: "image/png", form_factor: "wide", label: t.pwa.shortcuts.newQr },
      { src: `/pwa/screenshots/${locale}/narrow-library.png`, sizes: "390x844", type: "image/png", form_factor: "narrow", label: t.pwa.shortcuts.qrCodes },
      { src: `/pwa/screenshots/${locale}/narrow-editor.png`, sizes: "390x844", type: "image/png", form_factor: "narrow", label: t.pwa.shortcuts.newQr },
    ],
    launch_handler: { client_mode: ["navigate-existing", "auto"] },
  };
}
