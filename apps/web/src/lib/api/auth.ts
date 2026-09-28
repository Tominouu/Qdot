import { CURRENT_USER } from "@/data/user";
import { USE_MOCK_API } from "@/lib/config";
import type { AuthProvider, AuthSession, Credentials, User } from "@/types";
import { ApiError, apiRequest, isUnauthenticated } from "./client";

/**
 * Authentication. With the API, the session lives in an HTTP-only cookie set
 * by /auth/register and /auth/login; the returned user is only cached for UI.
 * Mock mode simulates latency and accepts any valid input.
 */

const MOCK_LATENCY_MS = 900;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toSession = (user: User, provider: AuthProvider): AuthSession => ({ user, provider, createdAt: new Date().toISOString() });

function mockUser(email: string): User {
  const local = email.split("@")[0] ?? "";
  const name = local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(" ");
  return { ...CURRENT_USER, id: `usr_${crypto.randomUUID().slice(0, 8)}`, name: name || "Qdot user", email };
}

export async function signUp(credentials: Credentials): Promise<AuthSession> {
  if (!USE_MOCK_API) {
    const { user } = await apiRequest<{ user: User }>("/auth/register", { method: "POST", body: JSON.stringify(credentials) });
    return toSession(user, "password");
  }
  await wait(MOCK_LATENCY_MS);
  return toSession(mockUser(credentials.email.trim()), "password");
}

export async function signIn(credentials: Credentials): Promise<AuthSession> {
  if (!USE_MOCK_API) {
    const { user } = await apiRequest<{ user: User }>("/auth/login", { method: "POST", body: JSON.stringify(credentials) });
    return toSession(user, "password");
  }
  await wait(MOCK_LATENCY_MS);
  return toSession(mockUser(credentials.email.trim()), "password");
}

export async function signOut(): Promise<void> {
  if (!USE_MOCK_API) return apiRequest<void>("/auth/logout", { method: "POST" });
}

/** Current user from the session cookie, or null when signed out. */
export async function getMe(): Promise<User | null> {
  if (USE_MOCK_API) return CURRENT_USER;
  try {
    return (await apiRequest<{ user: User }>("/auth/me")).user;
  } catch (err) {
    if (isUnauthenticated(err)) return null;
    throw err;
  }
}

export async function signInWithGoogle(): Promise<AuthSession> {
  if (!USE_MOCK_API) throw new ApiError("Google sign-in isn't available yet. Use your email and a password.", 501, "NOT_IMPLEMENTED");
  await wait(MOCK_LATENCY_MS + 400);
  return toSession(CURRENT_USER, "google");
}

export async function requestPasswordReset(email: string): Promise<void> {
  if (!USE_MOCK_API) {
    void email;
    throw new ApiError("Password reset emails aren't set up yet. Contact your Qdot administrator.", 501, "NOT_IMPLEMENTED");
  }
  await wait(MOCK_LATENCY_MS);
}
