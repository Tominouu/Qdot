import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge the custom font-family token so it doesn't treat `font-display` as a weight.
const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-family": ["font-display"] } },
});

/** Merge class names; later utilities override earlier conflicting ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
