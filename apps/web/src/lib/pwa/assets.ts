/**
 * Shared by the manifest, the root layout metadata and scripts/generate-pwa-assets.ts,
 * so generated files and the tags pointing at them can't drift apart.
 */

export const PWA_COLORS = {
  /** App background (--qd-bg): splash screens, maskable icons, manifest background_color. */
  background: "#18181b",
  mark: "#ffffff",
  markInner: "#18181b",
  markDot: "#f5f0eb",
} as const;

/** iOS launch screens, portrait. CSS size × pixel ratio = image size. */
export const IOS_SPLASH_SCREENS = [
  { device: "iPhone 16 Pro Max", width: 440, height: 956, ratio: 3 },
  { device: "iPhone 16 Pro", width: 402, height: 874, ratio: 3 },
  { device: "iPhone 16 Plus / 15 Pro Max / 15 Plus / 14 Pro Max", width: 430, height: 932, ratio: 3 },
  { device: "iPhone 16 / 15 / 15 Pro / 14 Pro", width: 393, height: 852, ratio: 3 },
  { device: "iPhone 14 Plus / 13 Pro Max / 12 Pro Max", width: 428, height: 926, ratio: 3 },
  { device: "iPhone 14 / 13 / 13 Pro / 12 / 12 Pro", width: 390, height: 844, ratio: 3 },
  { device: "iPhone 13 mini / 12 mini / 11 Pro / XS / X", width: 375, height: 812, ratio: 3 },
  { device: "iPhone 11 Pro Max / XS Max", width: 414, height: 896, ratio: 3 },
  { device: "iPhone 11 / XR", width: 414, height: 896, ratio: 2 },
  { device: "iPhone 8 Plus", width: 414, height: 736, ratio: 3 },
  { device: "iPhone SE / 8", width: 375, height: 667, ratio: 2 },
  { device: "iPad Pro 12.9″", width: 1024, height: 1366, ratio: 2 },
  { device: "iPad Pro 11″", width: 834, height: 1194, ratio: 2 },
  { device: "iPad Air", width: 820, height: 1180, ratio: 2 },
  { device: "iPad 10.2″", width: 810, height: 1080, ratio: 2 },
  { device: "iPad mini", width: 744, height: 1133, ratio: 2 },
] as const;

export const splashPath = (s: (typeof IOS_SPLASH_SCREENS)[number]) => `/pwa/splash/${s.width * s.ratio}x${s.height * s.ratio}.png`;
