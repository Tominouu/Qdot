"use client";

import { createStorageStore } from "@/lib/utils/storage-store";
import type { AuthSession } from "@/types";

/**
 * Client-side mock session. When real auth lands, replace this module's
 * internals (e.g. read an httpOnly-cookie-backed `/me`) — callers only use
 * `useSession`, `setSession` and `clearSession`.
 */
const store = createStorageStore<AuthSession>("local", "qdot.session.v1");

export const getSession = store.get;
export const setSession = store.set;
export const clearSession = store.clear;
/** `undefined` while hydrating, `null` when signed out. */
export const useSession = store.useValue;
