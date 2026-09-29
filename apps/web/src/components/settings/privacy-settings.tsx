"use client";

import { Shield } from "lucide-react";
import type { ReactNode } from "react";
import { Pill } from "@/components/ui/badge";
import { Select } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { getPrivacySettings, updatePrivacySettings } from "@/lib/api/settings";
import { useResource } from "@/lib/hooks/use-resource";
import { useI18n } from "@/lib/i18n/provider";
import type { PrivacySettings as Settings } from "@/types";

function SettingRow({ title, description, control, id }: { title: string; description: ReactNode; control: ReactNode; id: string }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-line pb-5">
      <div className="flex min-w-0 flex-col gap-1">
        <p id={id} className="font-display text-base font-bold text-fg">
          {title}
        </p>
        <p className="text-sm text-muted">{description}</p>
      </div>
      {control}
    </div>
  );
}

export function PrivacySettings() {
  const { data, setData } = useResource(getPrivacySettings, []);
  const { toast } = useToast();
  const { t } = useI18n();
  const p = t.settings.privacy;

  const save = async (patch: Partial<Settings>) => {
    if (!data) return;
    setData({ ...data, ...patch }); // optimistic
    try {
      setData(await updatePrivacySettings(patch));
      toast(p.saved, "info");
    } catch {
      setData(data);
      toast(p.failed, "warning");
    }
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[28px] leading-tight font-black text-fg md:text-[32px]">{p.title}</h1>
        <p className="text-[15px] text-muted">{p.description}</p>
      </div>

      {data ? (
        <div className="flex flex-col gap-6">
          <SettingRow
            id="track-scans"
            title={p.trackScans}
            description={p.trackScansHint}
            control={<Switch label={p.trackScans} checked={data.trackScans} onCheckedChange={(v) => save({ trackScans: v })} />}
          />
          <SettingRow
            id="store-ip"
            title={p.storeIp}
            description={p.storeIpHint}
            control={<Switch label={p.storeIp} checked={data.storeIpAddresses} onCheckedChange={(v) => save({ storeIpAddresses: v })} />}
          />
          <SettingRow
            id="geo"
            title={p.geo}
            description={p.geoHint}
            control={
              <Select
                size="sm"
                aria-labelledby="geo"
                value={data.geolocationPrecision}
                onChange={(e) => save({ geolocationPrecision: e.target.value as Settings["geolocationPrecision"] })}
                options={[
                  { value: "country", label: p.geoCountry },
                  { value: "region", label: p.geoRegion },
                  { value: "city", label: p.geoCity },
                ]}
              />
            }
          />
          <SettingRow
            id="retention"
            title={p.retention}
            description={p.retentionHint}
            control={
              <Select
                size="sm"
                aria-labelledby="retention"
                value={String(data.dataRetentionDays)}
                onChange={(e) => save({ dataRetentionDays: Number(e.target.value) as Settings["dataRetentionDays"] })}
                options={[
                  { value: "30", label: p.days(30) },
                  { value: "90", label: p.days(90) },
                  { value: "365", label: p.year },
                ]}
              />
            }
          />
          <SettingRow
            id="cookies"
            title={p.cookies}
            description={
              <>
                {p.cookiesHint} <span className="text-cyan">{p.cookiesNote}</span>
              </>
            }
            control={<Switch label={p.cookies} checked={data.cookieConsent} onCheckedChange={(v) => save({ cookieConsent: v })} />}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6" aria-busy>
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-[62px] w-full" />
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 rounded-2xl border border-line bg-bg p-6">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface" aria-hidden>
          <Shield className="size-5 fill-fg-strong text-fg-strong" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-display text-base font-bold text-fg">{p.byDesign}</p>
          <p className="text-sm text-muted">{p.byDesignText}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Pill>{p.gdpr}</Pill>
        <Pill>{p.ccpa}</Pill>
        <Pill tone="muted">{p.noCookies}</Pill>
      </div>
    </div>
  );
}
