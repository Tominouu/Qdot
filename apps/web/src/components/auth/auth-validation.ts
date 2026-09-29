import type { Dictionary } from "@/lib/i18n/dictionaries";

export const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(email: string, t: Dictionary): string | null {
  if (!email.trim()) return t.auth.validation.emailRequired;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? null : t.auth.validation.emailInvalid;
}

export function validatePassword(password: string, mode: "sign-up" | "sign-in", t: Dictionary): string | null {
  if (!password) return t.auth.validation.passwordRequired;
  if (mode === "sign-up" && password.length < MIN_PASSWORD_LENGTH) return t.auth.validation.passwordShort(MIN_PASSWORD_LENGTH);
  return null;
}
