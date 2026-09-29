import type { QREyeShape, QRPattern, QRStyle } from "@/types";

/** The Qdot v2 signature style: light tiles on zinc with coral eye centers. */
export const DEFAULT_QR_STYLE: QRStyle = {
  pattern: "rounded",
  eyeShape: "rounded",
  foreground: "#FAFAFA",
  background: "#27272A",
  eyeColor: "#E8503A",
  textured: true,
  logo: null,
};

/** Labels live in the `editor.patterns` / `editor.eyes` dictionaries. */
export const PATTERN_OPTIONS: QRPattern[] = ["squares", "dots", "rounded", "diamond"];

export const EYE_OPTIONS: QREyeShape[] = ["classic", "rounded", "leaf", "innerDot"];

/** Style presets shown in the landing "Beautiful customization" section. */
export const SHOWCASE_PRESETS: { name: string; style: QRStyle }[] = [
  { name: "Gradient Tech", style: DEFAULT_QR_STYLE },
  { name: "Amber Circles", style: { ...DEFAULT_QR_STYLE, pattern: "dots", eyeShape: "innerDot" } },
  { name: "Classic Tech", style: { ...DEFAULT_QR_STYLE, pattern: "squares", eyeShape: "classic" } },
];
