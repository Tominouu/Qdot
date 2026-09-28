"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getMe } from "@/lib/api/auth";
import { clearSession, getSession, setSession } from "@/lib/auth/session";
import { useResource } from "@/lib/hooks/use-resource";
import { Logo } from "./logo";
import { MobileTabBar } from "./mobile-tab-bar";
import { Sidebar } from "./sidebar";

/**
 * Authenticated app frame. Verifies the session with the API (/auth/me) and
 * sends signed-out visitors to /sign-in, returning them here afterwards.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, error, loading } = useResource(getMe, []);

  useEffect(() => {
    if (loading) return;
    if (user) {
      if (getSession()?.user.id !== user.id) setSession({ user, provider: "password", createdAt: new Date().toISOString() });
    } else if (!error) {
      clearSession();
      router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
    }
  }, [user, error, loading, pathname, router]);

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <Logo />
        <p className="mt-4 font-display text-xl font-bold text-fg">Can&apos;t reach Qdot</p>
        <p className="max-w-sm text-sm text-muted">{error.message}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-dvh" aria-busy>
        <div className="hidden w-60 shrink-0 border-r border-line bg-sidebar lg:block" />
        <div className="flex-1 p-10">
          <Skeleton className="h-10 w-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between px-4 pt-4 sm:px-6 lg:hidden">
          <Logo href="/qr-codes" />
          <Link href="/settings" aria-label="Account and settings" className="rounded-full">
            <Avatar user={user} />
          </Link>
        </header>
        <main id="main" className="flex-1 px-4 pt-6 pb-32 sm:px-6 lg:px-10 lg:pt-10 lg:pb-16">
          <div className="mx-auto w-full max-w-[1120px]">{children}</div>
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
