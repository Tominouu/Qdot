import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <h1 className="font-display text-3xl font-black text-fg">Page not found</h1>
      <p className="text-muted">The page you are looking for doesn&apos;t exist or has moved.</p>
      <ButtonLink href="/qr-codes" variant="neutral">
        Go to your QR codes
      </ButtonLink>
    </main>
  );
}
