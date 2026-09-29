import type { Metadata, Viewport } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import { RouteTransitions } from "@/components/layout/route-transition";
import { ToastProvider } from "@/components/ui/toast";
import { I18nProvider } from "@/lib/i18n/provider";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { IOS_SPLASH_SCREENS, PWA_COLORS, splashPath } from "@/lib/pwa/assets";
import { PwaProvider } from "@/lib/pwa/provider";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: {
      default: t.meta.title,
      template: "%s · Qdot",
    },
    description: t.meta.description,
    applicationName: "Qdot",
    // iOS / iPadOS home-screen app. The manifest (app/manifest.ts) covers Chrome, Edge and Android.
    appleWebApp: {
      capable: true,
      title: "Qdot",
      // Opaque bar above the content: no layout work needed around the notch / Dynamic Island.
      statusBarStyle: "black",
      startupImage: IOS_SPLASH_SCREENS.map((s) => ({
        url: splashPath(s),
        media: `screen and (device-width: ${s.width}px) and (device-height: ${s.height}px) and (-webkit-device-pixel-ratio: ${s.ratio}) and (orientation: portrait)`,
      })),
    },
    icons: {
      // favicon.ico comes from the app/favicon.ico file convention.
      icon: [{ url: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" }],
      apple: [{ url: "/pwa/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    // Phone numbers in QR content previews must not turn into iOS call links.
    formatDetection: { telephone: false, email: false, address: false },
    other: {
      // Pre-manifest iOS versions (≤ 16) still read this one.
      "apple-mobile-web-app-capable": "yes",
    },
  };
}

export const viewport: Viewport = {
  themeColor: PWA_COLORS.background,
  colorScheme: "dark",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${archivo.variable} ${geist.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <I18nProvider locale={locale}>
          <ToastProvider>
            <PwaProvider>
              <RouteTransitions>{children}</RouteTransitions>
            </PwaProvider>
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
