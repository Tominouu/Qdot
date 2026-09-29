import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { getDictionary } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getDictionary();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <h1 className="font-display text-3xl font-black text-fg">{t.pageNotFound.title}</h1>
      <p className="text-muted">{t.pageNotFound.description}</p>
      <ButtonLink href="/qr-codes" variant="neutral">
        {t.pageNotFound.cta}
      </ButtonLink>
    </main>
  );
}
