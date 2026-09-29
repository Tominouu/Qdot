import { Settings } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrivacySettings } from "@/components/settings/privacy-settings";
import { WorkspaceSettings } from "@/components/settings/workspace-settings";
import { SETTINGS_SECTIONS } from "@/components/settings/sections";
import { SettingsNav } from "@/components/settings/settings-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(props: PageProps<"/settings/[section]">): Promise<Metadata> {
  const { section } = await props.params;
  const t = await getDictionary();
  const current = SETTINGS_SECTIONS.find((s) => s === section);
  return { title: current ? t.settings.sections[current] : t.meta.settings };
}

export default async function SettingsSectionPage(props: PageProps<"/settings/[section]">) {
  const { section } = await props.params;
  const current = SETTINGS_SECTIONS.find((s) => s === section);
  if (!current) notFound();
  const t = await getDictionary();
  const label = t.settings.sections[current];

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
      <SettingsNav />
      {current === "privacy" ? (
        <PrivacySettings />
      ) : current === "workspace" || current === "team" ? (
        <WorkspaceSettings membersOnly={current === "team"} />
      ) : (
        // Only "Privacy & Data" is designed; other sections share a neutral placeholder.
        <EmptyState
          className="flex-1 lg:items-start lg:py-0 lg:text-left"
          visual={
            <span className="flex size-12 items-center justify-center rounded-full bg-surface text-muted">
              <Settings className="size-5" aria-hidden />
            </span>
          }
          title={label}
          description={t.settings.unavailable(label)}
        />
      )}
    </div>
  );
}
