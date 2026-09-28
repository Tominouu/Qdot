import Image from "next/image";
import { Logo } from "@/components/layout/logo";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { Sidebar } from "@/components/layout/sidebar";
import { getCurrentUser } from "@/lib/api/settings";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-dvh">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between px-4 pt-4 sm:px-6 lg:hidden">
          <Logo href="/qr-codes" />
          <Image src={user.avatarUrl} alt={user.name} width={36} height={36} className="size-9 rounded-full" />
        </header>
        <main id="main" className="flex-1 px-4 pt-6 pb-32 sm:px-6 lg:px-10 lg:pt-10 lg:pb-16">
          <div className="mx-auto w-full max-w-[1120px]">{children}</div>
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
