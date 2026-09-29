"use client";

import { LayoutGrid, List, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { listQRCodes } from "@/lib/api/qr";
import { useResource } from "@/lib/hooks/use-resource";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils/cn";
import type { QRStatus } from "@/types";
import { CsvImportButton } from "./csv-import-button";
import { EmptyQRVisual } from "./empty-qr-visual";
import { QRCard, QRCardSkeleton, QRRow } from "./qr-card";

type Filter = "all" | Exclude<QRStatus, "draft">;
type View = "grid" | "list";

export function QRLibrary() {
  const { data: codes, loading, reload } = useResource(() => listQRCodes(), []);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("grid");
  const { t } = useI18n();
  const l = t.library;

  const counts = useMemo(() => {
    const all = codes ?? [];
    return {
      all: all.length,
      active: all.filter((c) => c.status === "active").length,
      paused: all.filter((c) => c.status === "paused").length,
      archived: all.filter((c) => c.status === "archived").length,
    };
  }, [codes]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (codes ?? [])
      .filter((c) => filter === "all" || c.status === filter)
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.destinationUrl.toLowerCase().includes(q));
  }, [codes, filter, query]);

  if (!loading && codes && codes.length === 0) {
    return (
      <EmptyState
        className="min-h-[70dvh]"
        visual={<EmptyQRVisual />}
        title={l.emptyTitle}
        description={l.emptyDescription}
        actions={
          <>
            <ButtonLink href="/onboarding" variant="inverse" className="h-[42px] min-w-[153px]">
              {l.create}
            </ButtonLink>
            <CsvImportButton onImported={reload} />
          </>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={l.title}
        description={l.description}
        actions={
          <>
            <div className="w-full md:w-[260px]">
              <Input
                type="search"
                aria-label={l.search}
                placeholder={l.searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                icon={<Search className="size-3.5" />}
                className="h-[38px] rounded-lg text-[13px]"
              />
            </div>
            <ButtonLink href="/onboarding" className="hidden md:inline-flex">
              {l.create}
            </ButtonLink>
          </>
        }
      />

      <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
          <Segmented
            label={l.filter}
            size="md"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: `${l.all} (${counts.all})` },
              { value: "active", label: `${t.status.active} (${counts.active})` },
              { value: "paused", label: `${t.status.paused} (${counts.paused})` },
              { value: "archived", label: `${t.status.archived} (${counts.archived})` },
            ]}
          />
        </div>
        <div className="hidden gap-2 sm:flex" role="group" aria-label={l.view}>
          {(
            [
              ["grid", LayoutGrid, l.grid],
              ["list", List, l.list],
            ] as const
          ).map(([v, Icon, label]) => (
            <button
              key={v}
              type="button"
              aria-label={label}
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn(
                "rounded-md border p-2 transition-colors",
                view === v ? "border-line bg-surface text-fg-strong" : "border-transparent text-muted-2 hover:text-fg",
              )}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <QRCardSkeleton key={i} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">{l.noMatch}</p>
      ) : (
        <>
          <ul className={cn("gap-6", view === "grid" ? "hidden sm:grid sm:grid-cols-2 xl:grid-cols-3" : "hidden sm:flex sm:flex-col sm:gap-3")}>
            {visible.map((qr, i) => (
              <li key={qr.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                {view === "grid" ? <QRCard qr={qr} /> : <QRRow qr={qr} />}
              </li>
            ))}
          </ul>
          <ul className="flex flex-col gap-3 sm:hidden">
            {visible.map((qr) => (
              <li key={qr.id}>
                <QRRow qr={qr} />
              </li>
            ))}
          </ul>
        </>
      )}

      <ButtonLink
        href="/onboarding"
        className="fixed right-4 bottom-24 z-30 hidden h-auto rounded-full p-4 font-bold shadow-[0_8px_12px_rgba(232,80,58,0.45)] sm:flex lg:hidden"
        leadingIcon={<Plus className="size-[18px]" />}
      >
        {l.create}
      </ButtonLink>
    </div>
  );
}
