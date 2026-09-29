"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/client";
import { errorMessage } from "@/lib/i18n/errors";
import { useI18n } from "@/lib/i18n/provider";
import type { CreateWorkspaceInput, Workspace } from "@/types";

export function CreateWorkspaceModal({
  open,
  onClose,
  create,
}: {
  open: boolean;
  onClose: () => void;
  create: (input: CreateWorkspaceInput) => Promise<Workspace>;
}) {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={t.workspace.create.title}>
      {/* Modal renders children only while open: the form starts fresh each time. */}
      <CreateWorkspaceForm onDone={onClose} create={create} />
    </Modal>
  );
}

function CreateWorkspaceForm({ onDone, create }: { onDone: () => void; create: (input: CreateWorkspaceInput) => Promise<Workspace> }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const c = t.workspace.create;
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setBusy(true);
        setErrors({});
        try {
          const ws = await create({ name: name.trim(), ...(slug.trim() ? { slug: slug.trim().toLowerCase() } : {}) });
          toast(c.created(ws.name));
          onDone();
        } catch (err) {
          if (err instanceof ApiError && err.fields) setErrors(err.code === "SLUG_TAKEN" ? { slug: errorMessage(err, t) } : err.fields);
          else toast(errorMessage(err, t), "warning");
          setBusy(false);
        }
      }}
    >
      <Field label={c.name} error={errors.name}>
        {(id, d) => <Input id={id} aria-describedby={d} autoFocus value={name} maxLength={60} placeholder={c.namePlaceholder} onChange={(e) => setName(e.target.value)} />}
      </Field>
      <Field label={c.slug} hint={errors.slug ? undefined : c.slugHint} error={errors.slug}>
        {(id, d) => (
          <Input id={id} aria-describedby={d} value={slug} maxLength={48} placeholder="restaurant-dupont" onChange={(e) => setSlug(e.target.value.toLowerCase())} />
        )}
      </Field>
      <div className="flex justify-end gap-3">
        <Button variant="ghost" size="sm" onClick={onDone}>
          {t.common.cancel}
        </Button>
        <Button type="submit" size="sm" disabled={busy || !name.trim()}>
          {busy ? c.creating : c.submit}
        </Button>
      </div>
    </form>
  );
}
