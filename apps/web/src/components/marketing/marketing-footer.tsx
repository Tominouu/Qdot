import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { getDictionary } from "@/lib/i18n/server";
import { LEGAL_DOCS, LEGAL_ENTITY, legalHref } from "@/lib/legal";

export async function MarketingFooter() {
  const t = await getDictionary();
  const f = t.marketing.footer;
  const columns = [
    { title: f.product, links: [[f.features, "/#features"], [f.customization, "/#features"], [f.analytics, "/#flow"]] },
    { title: f.developers, links: [["GitHub", "https://github.com"], [f.documentation, "/#flow"], [f.selfHosting, "/#open-source"]] },
    { title: f.resources, links: [[f.changelog, "/#open-source"], [f.contact, `mailto:${LEGAL_ENTITY.email}`]] },
    { title: f.legal, links: LEGAL_DOCS.map((d) => [t.legal[d], legalHref(d)]) },
  ];

  return (
    <footer className="border-t border-line px-4 pt-14 pb-10 md:px-10 md:pt-20 xl:px-20">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-10">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="flex w-60 flex-col gap-4">
            <Logo />
            <p className="text-[13px] text-faint">{f.tagline}</p>
            <LanguageSwitcher className="self-start" />
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 md:gap-12">
            {columns.map((c) => (
              <nav key={c.title} aria-label={c.title} className="flex flex-col gap-3">
                <p className="text-xs font-bold text-fg uppercase">{c.title}</p>
                {c.links.map(([label, href]) =>
                  href.startsWith("/") ? (
                    <Link key={label} href={href} className="text-[13px] text-muted transition-colors hover:text-fg">
                      {label}
                    </Link>
                  ) : (
                    <a key={label} href={href} className="text-[13px] text-muted transition-colors hover:text-fg">
                      {label}
                    </a>
                  ),
                )}
              </nav>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 text-[13px] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-faint">
            © {new Date().getFullYear()} {LEGAL_ENTITY.name}. {f.license}
          </p>
          <p className="text-muted">
            {f.builtWith} <span className="text-accent" aria-label={f.love}>♥</span> {f.andOpenSource}
          </p>
        </div>
      </div>
    </footer>
  );
}
