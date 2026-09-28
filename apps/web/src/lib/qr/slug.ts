const ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789";

/** Short, unambiguous code for the redirect URL (no 0/o/1/l). */
export function generateSlug(length = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}
