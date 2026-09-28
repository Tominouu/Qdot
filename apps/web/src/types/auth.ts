import type { CreateQRCodeInput, QRCategory, QRContentType, QRStyle, User } from "@qdot/types";

export type AuthProvider = "password" | "google";

export interface AuthSession {
  user: User;
  provider: AuthProvider;
  createdAt: string;
}

export interface Credentials {
  email: string;
  password: string;
}

/**
 * A QR code configured during onboarding but not saved yet (the user has no
 * account). Kept client-side until sign-up / sign-in completes.
 */
export interface PendingQRCode {
  /** Editor fields, restored verbatim when the user goes back to the editor. */
  draft: {
    /** Placeholder code for the live preview; the real code is assigned by the API on save. */
    previewCode: string;
    name: string;
    type: QRContentType;
    category: QRCategory;
    campaignId: string | null;
    input: string;
    style: QRStyle;
  };
  /** Payload sent to `createQRCode` once the user is authenticated. */
  create: CreateQRCodeInput;
  savedAt: string;
}
