"use client";

import type { ComponentType } from "react";
import { PasswordInput } from "@/components/auth/password-input";
import { Field, Input, Select } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n/provider";
import type { FieldErrors } from "@/lib/qr/types";
import { WIFI_SECURITY, type QRContentOf, type QRContentType } from "@/types";

/**
 * One form per content type. Register a new type's form in CONTENT_FORMS; the
 * editor picks it from the registry, nothing else changes.
 */
export interface ContentFormProps<T extends QRContentType> {
  value: QRContentOf<T>;
  onChange: (value: QRContentOf<T>) => void;
  /** Errors to display (already filtered to touched state by the caller). */
  errors: FieldErrors;
  onBlur: () => void;
}

const labelCls = "text-xs font-normal text-muted-2";

function TextField({
  label,
  value,
  error,
  onChange,
  onBlur,
  type = "text",
  placeholder,
  autoComplete = "off",
  maxLength,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  type?: "text" | "url" | "email" | "tel";
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
}) {
  return (
    <Field label={label} error={error} labelClassName={labelCls}>
      {(id, describedBy) => (
        <Input
          id={id}
          density="sm"
          type={type}
          inputMode={type === "tel" ? "tel" : type === "url" ? "url" : type === "email" ? "email" : undefined}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
      )}
    </Field>
  );
}

function TextArea({ label, value, onChange, onBlur, maxLength }: { label: string; value: string; onChange: (v: string) => void; onBlur: () => void; maxLength: number }) {
  return (
    <Field label={label} labelClassName={labelCls}>
      {(id) => (
        <textarea
          id={id}
          rows={3}
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="w-full min-w-0 resize-y rounded-lg border border-line bg-surface px-2.5 py-2 text-[13px] text-fg outline-none transition-[border-color] placeholder:text-faint hover:border-line-strong focus:border-fg-strong"
        />
      )}
    </Field>
  );
}

function UrlForm({ value, onChange, errors, onBlur }: ContentFormProps<"url">) {
  const { t } = useI18n();
  return (
    <TextField
      label={t.editor.contentTypes.url.field}
      type="url"
      placeholder="https://example.com"
      value={value.url}
      error={errors.url}
      onChange={(url) => onChange({ ...value, url })}
      onBlur={onBlur}
      maxLength={2048}
    />
  );
}

function WifiForm({ value, onChange, errors, onBlur }: ContentFormProps<"wifi">) {
  const { t } = useI18n();
  const m = t.editor.contentTypes.wifi;
  return (
    <>
      <TextField label={m.ssid} placeholder="Bistro-Guests" value={value.ssid} error={errors.ssid} onChange={(ssid) => onChange({ ...value, ssid })} onBlur={onBlur} maxLength={32} />
      <Field label={m.security} labelClassName={labelCls}>
        {(id) => (
          <Select
            id={id}
            size="sm"
            className="w-full"
            value={value.security}
            onChange={(e) => onChange({ ...value, security: e.target.value as typeof value.security })}
            options={WIFI_SECURITY.map((s) => ({ value: s, label: m.securityOptions[s] }))}
          />
        )}
      </Field>
      {value.security !== "nopass" && (
        <Field label={m.password} error={errors.password} hint={errors.password ? undefined : m.passwordNote} labelClassName={labelCls}>
          {(id, describedBy) => (
            <PasswordInput
              id={id}
              autoComplete="off"
              value={value.password}
              maxLength={63}
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={describedBy}
              onChange={(e) => onChange({ ...value, password: e.target.value })}
              onBlur={onBlur}
              className="h-[38px] rounded-lg px-2.5 text-[13px]"
            />
          )}
        </Field>
      )}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-2">{m.hidden}</span>
        <Switch size="sm" label={m.hidden} checked={value.hidden} onCheckedChange={(hidden) => onChange({ ...value, hidden })} />
      </div>
    </>
  );
}

function VCardForm({ value, onChange, errors, onBlur }: ContentFormProps<"vcard">) {
  const { t } = useI18n();
  const m = t.editor.contentTypes.vcard;
  const field = (key: Exclude<keyof typeof value, "type">, type: "text" | "email" | "tel" | "url" = "text", autoComplete = "off") => (
    <TextField
      key={key}
      label={m[key]}
      type={type}
      value={value[key]}
      error={errors[key]}
      autoComplete={autoComplete}
      onChange={(v) => onChange({ ...value, [key]: v })}
      onBlur={onBlur}
      maxLength={160}
    />
  );
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {field("firstName", "text", "given-name")}
        {field("lastName", "text", "family-name")}
      </div>
      {field("organization", "text", "organization")}
      {field("jobTitle", "text", "organization-title")}
      {field("phone", "tel", "tel")}
      {field("email", "email", "email")}
      {field("website", "url", "url")}
      {field("street", "text", "street-address")}
      <div className="grid grid-cols-2 gap-3">
        {field("postalCode", "text", "postal-code")}
        {field("city", "text", "address-level2")}
      </div>
      {field("country", "text", "country-name")}
    </>
  );
}

function EmailForm({ value, onChange, errors, onBlur }: ContentFormProps<"email">) {
  const { t } = useI18n();
  const m = t.editor.contentTypes.email;
  return (
    <>
      <TextField label={m.to} type="email" placeholder="hello@example.com" value={value.to} error={errors.to} onChange={(to) => onChange({ ...value, to })} onBlur={onBlur} maxLength={254} />
      <TextField label={m.subject} value={value.subject} onChange={(subject) => onChange({ ...value, subject })} onBlur={onBlur} maxLength={200} />
      <TextArea label={m.body} value={value.body} onChange={(body) => onChange({ ...value, body })} onBlur={onBlur} maxLength={1500} />
    </>
  );
}

function SmsForm({ value, onChange, errors, onBlur }: ContentFormProps<"sms">) {
  const { t } = useI18n();
  const m = t.editor.contentTypes.sms;
  return (
    <>
      <TextField label={m.phone} type="tel" placeholder="+33 6 12 34 56 78" value={value.phone} error={errors.phone} onChange={(phone) => onChange({ ...value, phone })} onBlur={onBlur} maxLength={32} />
      <TextArea label={m.message} value={value.message} onChange={(message) => onChange({ ...value, message })} onBlur={onBlur} maxLength={500} />
    </>
  );
}

function PhoneForm({ value, onChange, errors, onBlur }: ContentFormProps<"phone">) {
  const { t } = useI18n();
  return (
    <TextField
      label={t.editor.contentTypes.phone.phone}
      type="tel"
      placeholder="+33 6 12 34 56 78"
      value={value.phone}
      error={errors.phone}
      onChange={(phone) => onChange({ ...value, phone })}
      onBlur={onBlur}
      maxLength={32}
    />
  );
}

export const CONTENT_FORMS: { [T in QRContentType]: ComponentType<ContentFormProps<T>> } = {
  url: UrlForm,
  wifi: WifiForm,
  vcard: VCardForm,
  email: EmailForm,
  sms: SmsForm,
  phone: PhoneForm,
};
