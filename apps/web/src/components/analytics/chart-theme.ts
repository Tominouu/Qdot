/** Chart colors from the Figma charts. */
export const CHART = {
  grid: "#3f3f46",
  axis: "#71717a",
  cursor: "#22c55e",
  activeDot: "#fafafa",
  surface: "#27272a",
} as const;

/** Decorative segment colors of the single-series "Scans over time" line (Figma order). */
export const SEGMENT_COLORS = ["#e8503a", "#3b82f6", "#22c55e", "#f59e0b"];

/**
 * Categorical order for multi-series identity. Same four Figma hues, reordered so
 * adjacent series stay distinguishable under color-vision deficiency (validated;
 * the WARN band is covered by the legend + tooltip secondary encoding).
 */
export const SERIES_COLORS = ["#e8503a", "#22c55e", "#3b82f6", "#f59e0b"];
