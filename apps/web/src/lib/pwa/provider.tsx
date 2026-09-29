"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { IosInstallSheet } from "@/components/pwa/ios-install-sheet";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n/provider";

/** Chromium's install event (Chrome, Edge, Samsung Internet, Opera on desktop and Android). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PwaApi {
  /** Running as an installed app (home screen / app window). */
  standalone: boolean;
  /** An install path exists right now: the browser prompt (Chromium) or the Share-sheet steps (iOS). */
  canInstall: boolean;
  install: () => void;
  online: boolean;
}

const PwaContext = createContext<PwaApi | null>(null);

/** iPhone, iPod, and iPads (which report a desktop Mac UA since iPadOS 13). */
const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.matchMedia("(display-mode: minimal-ui)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

function subscribeDisplayMode(onChange: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function subscribeConnectivity(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

const noSubscription = () => () => {};

export function PwaProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { toast } = useToast();
  // Browser-only facts; the server render assumes a regular, online browser tab.
  const standalone = useSyncExternalStore(subscribeDisplayMode, isStandalone, () => false);
  const online = useSyncExternalStore(subscribeConnectivity, () => navigator.onLine, () => true);
  const ios = useSyncExternalStore(noSubscription, isIOS, () => false);
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosSheet, setIosSheet] = useState(false);
  // Latest strings/toast for listeners registered once.
  const latest = useRef({ t, toast });
  useEffect(() => {
    latest.current = { t, toast };
  });

  // Install events, and a notice when the connection comes back.
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // keep it for our own button instead of the mini-infobar
      setPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setPrompt(null);
      latest.current.toast(latest.current.t.pwa.installed, "success");
    };
    const onOnline = () => latest.current.toast(latest.current.t.pwa.backOnline, "info");

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  // Service worker: production only (dev relies on hot reload, which a cache would fight).
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      return;
    }
    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    const offerUpdate = (worker: ServiceWorker) => {
      const { t: dict, toast: show } = latest.current;
      show(dict.pwa.updateReady, "info", { duration: null, action: { label: dict.pwa.reload, onClick: () => worker.postMessage({ type: "SKIP_WAITING" }) } });
    };

    navigator.serviceWorker
      .register(`/sw.js?v=${encodeURIComponent(process.env.NEXT_PUBLIC_APP_VERSION ?? "0")}`, { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        // A worker already waiting (e.g. update downloaded during a previous visit).
        if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const next = reg.installing;
          next?.addEventListener("statechange", () => {
            // With no controller this is the first install: nothing to refresh.
            if (next.state === "installed" && navigator.serviceWorker.controller) offerUpdate(next);
          });
        });
        // Installed apps can stay open for days: look for new versions when they come back to the foreground.
        const check = () => document.visibilityState === "visible" && reg.update().catch(() => undefined);
        document.addEventListener("visibilitychange", check);
      })
      .catch(() => undefined);
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  const install = useCallback(async () => {
    if (prompt) {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") setPrompt(null);
      return;
    }
    if (ios) setIosSheet(true);
  }, [prompt, ios]);

  const api = useMemo<PwaApi>(
    () => ({ standalone, canInstall: !standalone && (prompt !== null || ios), install, online }),
    [standalone, prompt, ios, install, online],
  );

  return (
    <PwaContext.Provider value={api}>
      {!online && <OfflineBanner />}
      {children}
      <IosInstallSheet open={iosSheet} onClose={() => setIosSheet(false)} />
    </PwaContext.Provider>
  );
}

export function usePwa(): PwaApi {
  const ctx = useContext(PwaContext);
  if (!ctx) throw new Error("usePwa must be used within <PwaProvider>");
  return ctx;
}
