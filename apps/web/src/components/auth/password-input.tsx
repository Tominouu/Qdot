"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";

/** Existing `Input` with a show/hide toggle. */
export function PasswordInput(props: Omit<ComponentProps<typeof Input>, "type" | "trailing">) {
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();
  return (
    <Input
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t.auth.hidePassword : t.auth.showPassword}
          aria-pressed={visible}
          className="rounded-md p-1.5 text-muted transition-colors hover:text-fg"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
    />
  );
}
