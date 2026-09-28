"use client";

import { useCallback, useEffect, useEffectEvent, useState } from "react";

export interface Resource<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
  reload: () => void;
  /** Replace data locally after a mutation (avoids a refetch). */
  setData: (next: T) => void;
}

interface State<T> {
  key: string;
  data?: T;
  error?: Error;
}

/**
 * Minimal async-resource hook for API-layer calls. Keeps components free of
 * fetch logic; can be swapped for a data library later without touching views.
 * `deps` must be serializable (ids, ranges, filters).
 */
export function useResource<T>(load: () => Promise<T>, deps: readonly unknown[]): Resource<T> {
  const [nonce, setNonce] = useState(0);
  const key = `${JSON.stringify(deps)}#${nonce}`;
  const [state, setState] = useState<State<T>>({ key: "" });
  const runLoad = useEffectEvent(load);

  useEffect(() => {
    let cancelled = false;
    runLoad().then(
      (data) => !cancelled && setState({ key, data }),
      (err: unknown) => !cancelled && setState({ key, error: err instanceof Error ? err : new Error(String(err)) }),
    );
    return () => {
      cancelled = true;
    };
  }, [key]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback((data: T) => setState({ key, data }), [key]);

  const settled = state.key === key;
  return {
    data: settled ? state.data : undefined,
    error: settled ? state.error : undefined,
    loading: !settled,
    reload,
    setData,
  };
}
