import type { ApiErrorBody, ErrorCode } from "@qdot/types";
import { API_URL } from "@/lib/config";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: ErrorCode | "NETWORK_ERROR" | "NOT_IMPLEMENTED" = "INTERNAL_ERROR",
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const isUnauthenticated = (err: unknown) => err instanceof ApiError && err.status === 401;

/**
 * Single entry point for HTTP calls to the Qdot API. Resource modules
 * (`qr.ts`, `analytics.ts`, …) use this instead of calling fetch directly.
 * The session travels in an HTTP-only cookie, hence `credentials: "include"`.
 */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new ApiError("NEXT_PUBLIC_API_URL is not configured", 0, "NETWORK_ERROR");
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError("Can't reach the Qdot API. Check your connection and try again.", 0, "NETWORK_ERROR");
  }
  if (!res.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      // Non-JSON error body (proxy error page…).
    }
    throw new ApiError(body?.error.message ?? res.statusText, res.status, body?.error.code, body?.error.fields);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export function toQuery(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** Browser time zone, sent with analytics requests so buckets match the user's clock. */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
