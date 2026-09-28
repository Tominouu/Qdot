"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { updateCampaign } from "@/lib/api/campaigns";
import type { Campaign } from "@/types";

interface EditCampaignModalProps {
  campaign: Campaign;
  open: boolean;
  onClose: () => void;
  onSaved: (c: Campaign) => void;
}

export function EditCampaignModal({ open, onClose, ...rest }: EditCampaignModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Edit Campaign">
      {/* Modal only renders children while open, so the form state starts fresh each time. */}
      <EditCampaignForm onClose={onClose} {...rest} />
    </Modal>
  );
}

function EditCampaignForm({ campaign, onClose, onSaved }: Omit<EditCampaignModalProps, "open">) {
  const [name, setName] = useState(campaign.name);
  const [description, setDescription] = useState(campaign.description);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setBusy(true);
        const updated = await updateCampaign(campaign.id, { name: name.trim(), description: description.trim() });
        setBusy(false);
        onSaved(updated);
        toast("Campaign updated");
        onClose();
      }}
    >
      <Field label="Campaign name" error={name.trim() ? undefined : "Name is required"}>
        {(id, d) => <Input id={id} aria-describedby={d} value={name} onChange={(e) => setName(e.target.value)} required />}
      </Field>
      <Field label="Description">{(id) => <Input id={id} value={description} onChange={(e) => setDescription(e.target.value)} />}</Field>
      <div className="flex justify-end gap-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={busy || !name.trim()}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
