import { Logo } from "@/components/layout/logo";

const COLUMNS = [
  { title: "Product", links: [["Features", "#features"], ["Customization", "#features"], ["Analytics", "#flow"]] },
  { title: "Developers", links: [["GitHub", "https://github.com"], ["Documentation", "#flow"], ["Self-hosting", "#open-source"]] },
  { title: "Resources", links: [["Privacy", "#open-source"], ["Changelog", "#open-source"], ["Contact", "mailto:hello@qdot.io"]] },
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t border-line px-4 pt-14 pb-10 md:px-10 md:pt-20 xl:px-20">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-10">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="flex w-60 flex-col gap-4">
            <Logo />
            <p className="text-[13px] text-faint">Beautiful, open-source infrastructure for physical-to-digital interactions.</p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:gap-16">
            {COLUMNS.map((c) => (
              <nav key={c.title} aria-label={c.title} className="flex flex-col gap-3">
                <p className="text-xs font-bold text-fg uppercase">{c.title}</p>
                {c.links.map(([label, href]) => (
                  <a key={label} href={href} className="text-[13px] text-muted transition-colors hover:text-fg">
                    {label}
                  </a>
                ))}
              </nav>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 text-[13px] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-faint">© 2026 Qdot Technologies, Inc. MIT License.</p>
          <p className="text-muted">
            Built with <span className="text-accent" aria-label="love">♥</span> and open source
          </p>
        </div>
      </div>
    </footer>
  );
}
