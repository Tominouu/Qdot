/**
 * The workspace the user is working in, for this browser. Sent with every API
 * call (X-Qdot-Workspace); the API checks the membership behind it each time,
 * so this is a preference, never a permission.
 */
const STORAGE_KEY = "qdot.workspace";

let active: string | null = null;

export function getActiveWorkspaceId(): string | null {
  if (active) return active;
  if (typeof window === "undefined") return null;
  try {
    active = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode): keep it in memory only.
  }
  return active;
}

export function setActiveWorkspaceId(id: string | null) {
  active = id;
  if (typeof window === "undefined") return;
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore: the in-memory value still applies to this tab.
  }
}
