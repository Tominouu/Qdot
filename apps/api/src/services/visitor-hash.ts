import { createHash, randomBytes } from "node:crypto";

/**
 * Privacy-preserving approximation of unique visitors (same approach as
 * Plausible): hash(daily salt + IP + User-Agent). The salt is random, kept
 * only in memory and replaced every UTC day, so hashes can't be reversed to
 * an IP or linked across days. Raw IPs are never stored.
 *
 * Caveat: a restart generates a new salt, so a visitor scanning before and
 * after a restart on the same day counts twice. Counts are therefore
 * "approximate unique daily visitors".
 */
let current: { day: string; salt: Buffer } | null = null;

function saltFor(now: Date): Buffer {
  const day = now.toISOString().slice(0, 10);
  if (current?.day !== day) current = { day, salt: randomBytes(32) };
  return current.salt;
}

export function visitorHash(ip: string, userAgent: string, now = new Date()): string {
  return createHash("sha256").update(saltFor(now)).update(ip).update("\0").update(userAgent).digest("hex").slice(0, 32);
}
