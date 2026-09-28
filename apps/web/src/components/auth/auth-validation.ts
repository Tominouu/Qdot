export const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Enter your email address";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? null : "Enter a valid email address";
}

export function validatePassword(password: string, mode: "sign-up" | "sign-in"): string | null {
  if (!password) return "Enter your password";
  if (mode === "sign-up" && password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters`;
  return null;
}
