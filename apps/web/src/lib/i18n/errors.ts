import { ApiError } from "@/lib/api/client";
import type { Dictionary } from "./dictionaries";

/** User-facing message for a failed request, in the current language (the API answers in English). */
export function errorMessage(err: unknown, t: Dictionary, fallback = t.common.somethingWrong): string {
  if (err instanceof ApiError) {
    if (err.code === "NOT_IMPLEMENTED" && err.status === 501) {
      if (err.message.startsWith("Google")) return t.errors.googleUnavailable;
      if (err.message.startsWith("Password reset")) return t.errors.resetUnavailable;
    }
    // A 500 carries no actionable detail; keep the caller's context-specific fallback.
    if (err.status === 500) return fallback;
    return t.errors[err.code] ?? fallback;
  }
  return fallback;
}
