import { CAMPAIGNS, type MockCampaign } from "@/data/campaigns";
import { QR_CODES, upgradeMockQR } from "@/data/qr-codes";
import { PRIVACY_SETTINGS } from "@/data/user";
import { INVITATIONS, MEMBERS, PERSONAL_WORKSPACE_ID, WORKSPACES, type MockWorkspace } from "@/data/workspaces";
import { getActiveWorkspaceId } from "@/lib/workspace/store";
import type { Invitation, PrivacySettings, QRCode, WorkspaceMember } from "@/types";

/**
 * In-memory stand-in for the backend while NEXT_PUBLIC_API_URL is unset.
 * Seeded from `src/data`, persisted to localStorage in the browser so that
 * codes created in the editor survive navigation and reloads.
 */

interface MockState {
  qrCodes: QRCode[];
  campaigns: MockCampaign[];
  privacy: PrivacySettings;
  workspaces: MockWorkspace[];
  members: Record<string, WorkspaceMember[]>;
  invitations: Record<string, Invitation[]>;
}

const STORAGE_KEY = "qdot.mock.v2";
const LATENCY_MS = 280;

let state: MockState | null = null;

function seed(): MockState {
  return {
    qrCodes: structuredClone(QR_CODES),
    campaigns: structuredClone(CAMPAIGNS),
    privacy: { ...PRIVACY_SETTINGS },
    workspaces: structuredClone(WORKSPACES),
    members: structuredClone(MEMBERS),
    invitations: structuredClone(INVITATIONS),
  };
}

function load(): MockState {
  if (state) return state;
  state = seed();
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<MockState>;
        state = {
          ...state,
          ...saved,
          qrCodes: (saved.qrCodes ?? state.qrCodes).map(upgradeMockQR),
          // Stores saved before workspaces: everything belonged to the personal space.
          campaigns: (saved.campaigns ?? state.campaigns).map((c) => ({ ...c, workspaceId: c.workspaceId ?? PERSONAL_WORKSPACE_ID })),
        };
      }
    } catch {
      // Corrupt or unavailable storage: fall back to seed data.
    }
  }
  return state;
}

function persist() {
  if (typeof window === "undefined" || !state) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or disabled; the session still works in memory.
  }
}

/** Simulated network latency so loading states are exercised. */
export function delay<T>(value: T): Promise<T> {
  const ms = typeof window === "undefined" ? 0 : LATENCY_MS;
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));
}

export function readStore(): MockState {
  return load();
}

export function writeStore(mutate: (draft: MockState) => void): void {
  mutate(load());
  persist();
}

/** Mock equivalent of the API's workspace scoping: the selected workspace, else the personal one. */
export function mockWorkspaceId(): string {
  const id = getActiveWorkspaceId();
  return id && load().workspaces.some((w) => w.id === id) ? id : PERSONAL_WORKSPACE_ID;
}

export function resetMockStore(): void {
  state = seed();
  persist();
}
