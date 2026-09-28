"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny JSON store over localStorage/sessionStorage with React subscription.
 * `useValue` returns `undefined` during SSR/hydration, `null` when empty.
 */
export function createStorageStore<T>(kind: "local" | "session", key: string) {
  const listeners = new Set<() => void>();
  let cachedRaw: string | null = null;
  let cachedValue: T | null = null;

  const storage = () => (kind === "local" ? window.localStorage : window.sessionStorage);

  function readRaw(): string | null {
    try {
      return storage().getItem(key);
    } catch {
      return null;
    }
  }

  function get(): T | null {
    const raw = readRaw();
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      try {
        cachedValue = raw ? (JSON.parse(raw) as T) : null;
      } catch {
        cachedValue = null;
      }
    }
    return cachedValue;
  }

  function emit() {
    for (const l of listeners) l();
  }

  function set(value: T) {
    try {
      storage().setItem(key, JSON.stringify(value));
    } catch {
      // Quota exceeded or storage disabled: the flow still works within this page.
    }
    emit();
  }

  function clear() {
    try {
      storage().removeItem(key);
    } catch {
      // Ignore unavailable storage.
    }
    emit();
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => e.key === key && listener();
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  function useValue(): T | null | undefined {
    return useSyncExternalStore(subscribe, get, () => undefined);
  }

  return { get, set, clear, subscribe, useValue };
}
