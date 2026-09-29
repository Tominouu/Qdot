/**
 * Which way a navigation "moves", so page transitions can mirror native apps:
 * deeper = push from the right, shallower = pop back, the editor = modal
 * sheet from the bottom, sibling tabs = crossfade.
 */
export type NavDirection = "forward" | "back" | "up" | "down" | "fade" | "none";

/** Full-screen editor routes: presented like a modal over the app. */
export const isEditorRoute = (path: string) => path === "/qr-codes/new" || /^\/qr-codes\/[^/]+\/edit$/.test(path);

const SHELL_ROOTS = ["/dashboard", "/qr-codes", "/analytics", "/campaigns", "/settings"];

/** Routes rendered inside the app shell (sidebar / bottom tab bar), which stays in place between them. */
export const isShellRoute = (path: string) =>
  !isEditorRoute(path) && SHELL_ROOTS.some((root) => path === root || path.startsWith(`${root}/`));

const segments = (path: string) => path.split("/").filter(Boolean);

export function navDirection(from: string, to: string): NavDirection {
  if (from === to) return "none";
  const fromEditor = isEditorRoute(from);
  const toEditor = isEditorRoute(to);
  if (toEditor && !fromEditor) return "up";
  if (fromEditor && !toEditor) return "down";

  const depthFrom = segments(from).length;
  const depthTo = segments(to).length;
  // Sibling screens (tab bar, settings sections): same level, different branch.
  if (depthFrom === depthTo) return "fade";
  return depthTo > depthFrom ? "forward" : "back";
}
