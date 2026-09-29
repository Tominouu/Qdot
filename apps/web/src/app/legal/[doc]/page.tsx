import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { LEGAL_CONTENT, LEGAL_DOCS, LEGAL_ENTITY, legalHref, type LegalBlock, type LegalDocId } from "@/lib/legal";

const isDoc = (doc: string): doc is LegalDocId => (LEGAL_DOCS as readonly string[]).includes(doc);

export async function generateMetadata(props: PageProps<"/legal/[doc]">): Promise<Metadata> {
  const { doc } = await props.params;
  if (!isDoc(doc)) return {};
  return { title: LEGAL_CONTENT[await getLocale()][doc].title };
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === "string") return <p>{block}</p>;
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-faint">
      {block.list.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default async function LegalPage(props: PageProps<"/legal/[doc]">) {
  const { doc } = await props.params;
  if (!isDoc(doc)) notFound();
  const locale = await getLocale();
  const t = await getDictionary();
  const content = LEGAL_CONTENT[locale][doc];
  const updated = new Intl.DateTimeFormat(INTL_LOCALE[locale], { dateStyle: "long" }).format(new Date(LEGAL_ENTITY.lastUpdated));

  return (
    <>
      <MarketingHeader />
      <main className="px-4 py-12 md:px-10 md:py-20 xl:px-20">
        <div className="mx-auto flex max-w-[1080px] flex-col gap-12 lg:flex-row lg:gap-16">
          <aside className="flex shrink-0 flex-col gap-6 lg:sticky lg:top-28 lg:w-56 lg:self-start">
            <nav aria-label={t.legal.otherDocuments} className="flex flex-col gap-1">
              <p className="mb-2 text-xs font-bold text-fg uppercase">{t.marketing.footer.legal}</p>
              {LEGAL_DOCS.map((d) => (
                <Link
                  key={d}
                  href={legalHref(d)}
                  aria-current={d === doc ? "page" : undefined}
                  className={
                    d === doc
                      ? "rounded-lg bg-surface px-3 py-2 text-sm font-semibold text-fg-strong"
                      : "rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface/60 hover:text-fg"
                  }
                >
                  {t.legal[d]}
                </Link>
              ))}
            </nav>
            <nav aria-label={t.legal.onThisPage} className="hidden flex-col gap-2 border-t border-line pt-6 lg:flex">
              <p className="text-xs font-bold text-fg uppercase">{t.legal.onThisPage}</p>
              {content.sections.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="text-[13px] text-muted transition-colors hover:text-fg">
                  {s.heading}
                </a>
              ))}
            </nav>
          </aside>

          <article className="flex min-w-0 max-w-[720px] flex-1 animate-fade-up flex-col gap-10">
            <header className="flex flex-col gap-4">
              <h1 className="font-display text-[36px] leading-tight font-black text-fg-strong md:text-[48px]">{content.title}</h1>
              <p className="text-sm text-subtle">{t.legal.lastUpdated(updated)}</p>
              {t.legal.frenchPrevails && <p className="text-sm text-subtle italic">{t.legal.frenchPrevails}</p>}
              <p className="text-base leading-[1.7] text-muted-2">{content.intro}</p>
            </header>
            {content.sections.map((s) => (
              <section key={s.id} id={s.id} className="flex scroll-mt-28 flex-col gap-4">
                <h2 className="font-display text-xl font-extrabold text-fg">{s.heading}</h2>
                <div className="flex flex-col gap-4 text-[15px] leading-[1.7] text-muted-2">
                  {s.body.map((b, i) => (
                    <Block key={i} block={b} />
                  ))}
                </div>
              </section>
            ))}
          </article>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
