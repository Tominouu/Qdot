import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/**
 * Encryption at rest for secrets stored inside QR content (Wi-Fi passwords).
 * AES-256-GCM, random 96-bit IV per value, format `v1.<iv>.<tag>.<ciphertext>` (base64url).
 *
 * The key comes from DATA_ENCRYPTION_KEY, or is derived from SESSION_SECRET
 * with HKDF when that variable is unset. Rotating the key source makes existing
 * secrets unreadable (they then decrypt to "" and must be re-entered).
 */
export interface SecretBox {
  seal(plain: string): string;
  /** Returns null when the value can't be authenticated (wrong key, tampered data). */
  open(sealed: string): string | null;
}

const VERSION = "v1";

export function createSecretBox(keyMaterial: string, salt = "qdot-content-secrets"): SecretBox {
  const key = Buffer.from(hkdfSync("sha256", keyMaterial, salt, "aes-256-gcm", 32));
  return {
    seal(plain) {
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", key, iv);
      const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
      return [VERSION, iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ct.toString("base64url")].join(".");
    },
    open(sealed) {
      const [version, iv, tag, ct] = sealed.split(".");
      if (version !== VERSION || !iv || !tag || ct === undefined) return null;
      try {
        const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
        decipher.setAuthTag(Buffer.from(tag, "base64url"));
        return Buffer.concat([decipher.update(Buffer.from(ct, "base64url")), decipher.final()]).toString("utf8");
      } catch {
        return null;
      }
    },
  };
}
