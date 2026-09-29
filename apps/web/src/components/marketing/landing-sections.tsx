import { Activity, ChartBar, Globe, Link2, Printer, Shield, Smartphone, SquarePen, type LucideIcon } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { StyledQR } from "@/components/qr/styled-qr";
import { ButtonLink } from "@/components/ui/button";
import { REPO_LABEL, REPO_URL } from "@/lib/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { DEFAULT_QR_STYLE, SHOWCASE_PRESETS } from "@/lib/qr/presets";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";

const DEMO_URL = "https://qr.example.com/qdot";

function Section({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={cn("scroll-mt-20 px-4 md:px-10 xl:px-20", className)}>
      <div className="mx-auto max-w-[1280px]">{children}</div>
    </section>
  );
}

const h2 = "font-display text-[32px] leading-[1.1] font-extrabold text-fg-strong md:text-[48px]";
const lead = "text-base leading-[1.6] text-muted-2 md:text-lg";

function FloatingStat({ label, icon: Icon, children, className }: { label: string; icon: LucideIcon; children: ReactNode; className?: string }) {
  return (
    <div className={cn("absolute flex w-[150px] flex-col gap-2 rounded-xl border border-surface-raised bg-bg/80 p-4 backdrop-blur-[10px] sm:w-40", className)}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium text-faint uppercase">{label}</p>
        <Icon className="size-3.5 text-muted" aria-hidden />
      </div>
      <div className="flex items-baseline gap-2 whitespace-nowrap">{children}</div>
    </div>
  );
}

export async function HeroSection() {
  const { hero } = (await getDictionary()).marketing;
  return (
    <Section className="py-12 md:py-20 xl:py-[120px]">
      <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-20">
        <div className="flex flex-1 animate-fade-up flex-col items-start gap-6">
          <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-white">
            {hero.badge}
          </span>
          <h1 className="font-display text-[48px] leading-none font-black text-[#fafafa] sm:text-[60px] xl:text-[72px]">
            {hero.title}
          </h1>
          <p className="max-w-[560px] text-lg leading-[1.6] text-muted-2 md:text-xl">
            {hero.lead}
          </p>
          <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
            <ButtonLink href="/onboarding" size="xl" className="w-full text-white shadow-accent sm:w-auto">
              {hero.cta}
            </ButtonLink>
            <ButtonLink href="#open-source" variant="secondary" size="xl" className="w-full border-line font-medium text-muted-2 sm:w-auto">
              {hero.explore}
            </ButtonLink>
          </div>
        </div>

        <div className="flex flex-1 justify-center">
          <div className="relative size-[340px] sm:size-[400px]">
            <div
              className="absolute top-1/2 left-1/2 size-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.04)_45%,rgba(255,255,255,0)_70%)]"
              aria-hidden
            />
            <div className="absolute top-1/2 left-1/2 w-[180px] -translate-x-1/2 -translate-y-1/2 animate-pop sm:w-[200px]">
              <StyledQR value={DEMO_URL} style={DEFAULT_QR_STYLE} title={hero.qrTitle} />
            </div>
            <FloatingStat label={hero.liveScans} icon={ChartBar} className="top-[30px] left-0 animate-fade-up [animation-delay:200ms] sm:top-10 sm:left-5">
              <span className="font-display text-xl font-bold text-[#fafafa]">1,284</span>
              <span className="text-[11px] font-medium text-[#fafaf9]">↑ 18.4%</span>
            </FloatingStat>
            <FloatingStat label={hero.topRegion} icon={Globe} className="top-[56px] right-0 animate-fade-up [animation-delay:320ms] sm:top-[60px]">
              <span className="font-display text-xl font-bold text-[#fafafa]">{hero.topRegionValue}</span>
            </FloatingStat>
            <FloatingStat label={hero.primaryDevice} icon={Smartphone} className="bottom-[14px] left-[16px] animate-fade-up [animation-delay:440ms] sm:bottom-[40px] sm:left-[30px]">
              <span className="font-display text-xl font-bold text-[#fafafa]">{hero.primaryDeviceValue}</span>
            </FloatingStat>
          </div>
        </div>
      </div>
    </Section>
  );
}

export async function DynamicSection() {
  const { dynamic } = (await getDictionary()).marketing;
  return (
    <Section id="features" className="bg-surface py-16 md:py-28">
      <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-20">
        <div className="flex flex-1 flex-col items-center gap-6 sm:flex-row sm:gap-4" aria-hidden>
          <div className="w-[140px] shrink-0 sm:w-40">
            <StyledQR value={`${DEMO_URL}/release`} style={{ ...DEFAULT_QR_STYLE, textured: false, eyeShape: "classic", pattern: "squares" }} />
          </div>
          <div className="flex shrink-0 flex-col items-center gap-2 text-[10px] font-medium text-faint uppercase sm:w-[60px]">
            <span className="h-8 w-px bg-muted-2 sm:h-px sm:w-[60px]" />
            {dynamic.label}
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-lg border border-white bg-surface-raised p-3 text-[13px] text-fg">
              <Link2 className="size-3.5 text-muted" /> https://yourbrand.com/new-release
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface-raised p-3 text-[13px] text-muted line-through decoration-muted/40 opacity-50">
              <Link2 className="size-3.5" /> https://yourbrand.com/old-destination
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-6">
          <h2 className={h2}>{dynamic.title}</h2>
          <p className={lead}>{dynamic.lead}</p>
        </div>
      </div>
    </Section>
  );
}

export async function CustomizationSection() {
  const { customization } = (await getDictionary()).marketing;
  return (
    <Section className="py-16 md:py-[100px]">
      <div className="flex flex-col items-center gap-12 md:gap-16">
        <div className="flex max-w-[800px] flex-col items-center gap-4 text-center">
          <h2 className={h2}>{customization.title}</h2>
          <p className={cn(lead, "max-w-[600px]")}>{customization.lead}</p>
        </div>
        <ul className="flex w-full flex-wrap justify-center gap-4 md:gap-6">
          {SHOWCASE_PRESETS.map((p) => (
            <li
              key={p.name}
              className="flex w-[calc(50%-8px)] max-w-[188px] flex-col items-center gap-6 rounded-2xl border border-line bg-surface p-6 transition-[transform,border-color] duration-200 hover:-translate-y-1 hover:border-line-strong sm:w-[188px]"
            >
              <div className="w-full max-w-[140px]">
                <StyledQR value={`${DEMO_URL}/${p.name.toLowerCase().replace(/\s+/g, "-")}`} style={p.style} title={customization.example(p.name)} />
              </div>
              <p className="text-[13px] font-semibold text-fg">{p.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

const STAGE_ICONS = [SquarePen, Printer, Activity];

export async function FlowSection() {
  const { flow } = (await getDictionary()).marketing;
  const stages = flow.stages.map((s, i) => ({ ...s, icon: STAGE_ICONS[i] }));
  return (
    <Section id="flow" className="bg-surface py-16 md:py-[100px]">
      <div className="flex flex-col gap-12 md:gap-20">
        <h2 className="text-center font-display text-[32px] font-extrabold text-fg-strong md:text-[40px]">{flow.title}</h2>
        <ol className="flex flex-col items-center gap-10 md:flex-row md:items-start md:justify-between md:gap-4">
          {stages.map((s, i) => (
            <li key={s.title} className="contents">
              <div className="flex w-full max-w-[280px] flex-col items-center gap-4 text-center">
                <span className="flex size-16 items-center justify-center rounded-full bg-surface-raised text-fg">
                  <s.icon className="size-6" aria-hidden />
                </span>
                <p className="font-display text-xl font-bold text-fg-strong">{s.title}</p>
                <p className="text-sm text-muted-2">{s.text}</p>
              </div>
              {i < stages.length - 1 && <span className="hidden h-0.5 w-20 shrink-0 self-center bg-line/60 md:mt-[-60px] md:block" aria-hidden />}
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

const BARS = [40, 60, 25, 80, 95, 45, 70, 96, 85, 96, 65, 90];
const HOT = new Set([3, 4, 7, 8, 9, 11]);

export async function AnalyticsSection() {
  const { analytics } = (await getDictionary()).marketing;
  return (
    <Section className="py-16 md:py-[120px]">
      <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-20">
        <div className="flex flex-1 flex-col gap-6">
          <h2 className={h2}>{analytics.title}</h2>
          <p className={lead}>{analytics.lead}</p>
        </div>
        <div className="flex w-full flex-1 flex-col gap-5 rounded-2xl border border-line bg-surface p-6">
          <div className="flex items-center justify-between">
            <p className="font-display text-base font-bold text-fg">{analytics.scanActivity}</p>
            <span className="rounded-md bg-surface-raised px-2.5 py-1 text-xs text-[#b4b4b4]">{analytics.live}</span>
          </div>
          <div className="flex h-[100px] items-end gap-2" role="img" aria-label={analytics.chartLabel}>
            {BARS.map((h, i) => (
              <div
                key={i}
                className={cn("flex-1 origin-bottom animate-[grow-y_700ms_cubic-bezier(0.2,0.8,0.2,1)_both] rounded-[3px]", HOT.has(i) ? "bg-accent" : "bg-line")}
                style={{ height: h, animationDelay: `${i * 45}ms` }}
              />
            ))}
          </div>
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-[11px] text-faint">{analytics.totalVolume}</p>
              <p className="font-display text-xl font-bold text-fg-strong">14,839</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[11px] text-faint">{analytics.conversion}</p>
              <p className="font-display text-xl font-bold text-fg-strong">8.4%</p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

export async function PrivacySection() {
  const { privacy } = (await getDictionary()).marketing;
  return (
    <Section className="bg-surface py-16 md:py-[100px]">
      <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-20">
        <div className="flex flex-1 justify-center">
          <span className="flex size-[120px] items-center justify-center rounded-full border-2 border-line bg-bg" aria-hidden>
            <Shield className="size-12 text-fg-strong" strokeWidth={1.5} />
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-6">
          <h2 className={h2}>{privacy.title}</h2>
          <p className={lead}>{privacy.lead}</p>
        </div>
      </div>
    </Section>
  );
}

/** Live stargazer count (cached for an hour); null if GitHub is unreachable or rate-limited. */
async function repoStars(): Promise<number | null> {
  try {
    const res = await fetch(REPO_URL.replace("github.com", "api.github.com/repos"), {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const { stargazers_count } = (await res.json()) as { stargazers_count?: number };
    return typeof stargazers_count === "number" ? stargazers_count : null;
  } catch {
    return null;
  }
}

export async function OpenSourceSection() {
  const [{ openSource }, locale, stars] = await Promise.all([getDictionary().then((t) => t.marketing), getLocale(), repoStars()]);
  return (
    <Section id="open-source" className="py-16 md:py-[120px]">
      <div className="flex flex-col items-center gap-8 text-center md:gap-10">
        <a
          href={REPO_URL}
          className="flex items-center gap-2.5 rounded-full border border-line bg-surface px-4 py-2 text-[13px] text-fg transition-colors hover:border-line-strong"
        >
          <Image src="/icons/github.svg" alt="" width={16} height={16} />
          {REPO_LABEL}
          {stars !== null && ` · ${openSource.stars(formatNumber(stars, locale), stars)}`}
        </a>
        <h2 className={cn(h2, "max-w-[800px]")}>{openSource.title}</h2>
        <p className="max-w-[600px] text-base text-muted-2 md:text-lg">{openSource.lead}</p>
      </div>
    </Section>
  );
}

export async function FinalCtaSection() {
  const { finalCta } = (await getDictionary()).marketing;
  return (
    <section className="flex flex-col items-center justify-center gap-8 bg-gradient-to-b from-surface to-bg px-4 py-16 text-center md:py-[120px]">
      <h2 className="font-display text-[34px] leading-tight font-black text-fg-strong md:text-[56px]">{finalCta.title}</h2>
      <ButtonLink href="/onboarding" size="lg" className="h-[52px] px-8 text-base font-bold text-white shadow-accent-lg">
        {finalCta.cta}
      </ButtonLink>
    </section>
  );
}
