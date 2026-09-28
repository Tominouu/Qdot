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

  const save = async (patch: Partial<Settings>) => {
    if (!data) return;
    setData({ ...data, ...patch }); // optimistic
    try {
      setData(await updatePrivacySettings(patch));
      toast("Privacy settings saved", "info");
    } catch {
      setData(data);
      toast("Could not save settings", "warning");
    }
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[28px] leading-tight font-black text-fg md:text-[32px]">Privacy &amp; Data</h1>
        <p className="text-[15px] text-muted">Control how scan data is collected and stored</p>
      </div>

      {data ? (
        <div className="flex flex-col gap-6">
          <SettingRow
            id="track-scans"
            title="Track scans"
            description="Record scan events for analytics"
            control={<Switch label="Track scans" checked={data.trackScans} onCheckedChange={(v) => save({ trackScans: v })} />}
          />
          <SettingRow
            id="store-ip"
            title="Store IP addresses"
            description="Save visitor IP addresses with scan data"
            control={<Switch label="Store IP addresses" checked={data.storeIpAddresses} onCheckedChange={(v) => save({ storeIpAddresses: v })} />}
          />
          <SettingRow
            id="geo"
            title="Geolocation precision"
            description="Limit the granularity of visitor location mapping"
            control={
              <Select
                size="sm"
                aria-labelledby="geo"
                value={data.geolocationPrecision}
                onChange={(e) => save({ geolocationPrecision: e.target.value as Settings["geolocationPrecision"] })}
                options={[
                  { value: "country", label: "Country-level" },
                  { value: "region", label: "Region-level" },
                  { value: "city", label: "City-level" },
                ]}
              />
            }
          />
          <SettingRow
            id="retention"
            title="Data retention"
            description="Automatically purge scan history logs after duration"
            control={
              <Select
                size="sm"
                aria-labelledby="retention"
                value={String(data.dataRetentionDays)}
                onChange={(e) => save({ dataRetentionDays: Number(e.target.value) as Settings["dataRetentionDays"] })}
                options={[
                  { value: "30", label: "30 days" },
                  { value: "90", label: "90 days" },
                  { value: "365", label: "1 year" },
                ]}
              />
            }
          />
          <SettingRow
            id="cookies"
            title="Cookie consent"
            description={
              <>
                Require cookie consent banner. <span className="text-cyan">Not required — Qdot works without cookies</span>
              </>
            }
            control={<Switch label="Cookie consent" checked={data.cookieConsent} onCheckedChange={(v) => save({ cookieConsent: v })} />}
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
          <p className="font-display text-base font-bold text-fg">Privacy by design</p>
          <p className="text-sm text-muted">
            Qdot is designed to respect user privacy. No personal data is collected by default. Self-host for complete data sovereignty.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Pill>GDPR Compliant</Pill>
        <Pill>CCPA Compliant</Pill>
        <Pill tone="muted">No-Cookies tracking</Pill>
      </div>
    </div>
  );
}
