"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/client";
import { createCampaign, deleteCampaign, updateCampaign } from "@/lib/api/campaigns";
import type { Campaign } from "@/types";

interface CampaignModalProps {
  /** Omit to create a new campaign. */
  campaign?: Campaign;
  open: boolean;
  onClose: () => void;
  onSaved: (c: Campaign) => void;
  onDeleted?: () => void;
}

export function EditCampaignModal({ open, onClose, campaign, ...rest }: CampaignModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={campaign ? "Edit Campaign" : "New Campaign"}>
      {/* Modal only renders children while open, so the form state starts fresh each time. */}
      <CampaignForm campaign={campaign} onClose={onClose} {...rest} />
    </Modal>
  );
}

function CampaignForm({ campaign, onClose, onSaved, onDeleted }: Omit<CampaignModalProps, "open">) {
  const [name, setName] = useState(campaign?.name ?? "");
  const [description, setDescription] = useState(campaign?.description ?? "");
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { toast } = useToast();

  const fail = (err: unknown) => {
    toast(err instanceof ApiError ? err.message : "Something went wrong", "warning");
    setBusy(null);
  };

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setBusy("save");
        try {
          const input = { name: name.trim(), description: description.trim() };
          const saved = campaign ? await updateCampaign(campaign.id, input) : await createCampaign(input);
          onSaved(saved);
          toast(campaign ? "Campaign updated" : "Campaign created");
          onClose();
        } catch (err) {
          fail(err);
        }
      }}
    >
      <Field label="Campaign name" error={name.trim() ? undefined : "Name is required"}>
        {(id, d) => <Input id={id} aria-describedby={d} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />}
      </Field>
      <Field label="Description">{(id) => <Input id={id} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={280} />}</Field>
      <div className="flex items-center justify-between gap-3">
        {campaign && onDeleted ? (
          <Button
            variant="ghost-danger"
            size="sm"
            disabled={busy !== null}
            leadingIcon={<Trash2 className="size-3.5" />}
            onClick={async () => {
              if (!confirmDelete) return setConfirmDelete(true);
              setBusy("delete");
              try {
                await deleteCampaign(campaign.id);
                toast("Campaign deleted — its QR codes were kept", "info");
                onDeleted();
              } catch (err) {
                fail(err);
              }
            }}
          >
            {confirmDelete ? "Click again to delete" : "Delete"}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={busy !== null || !name.trim()}>
            {busy === "save" ? "Saving…" : campaign ? "Save changes" : "Create campaign"}
          </Button>
        </div>
      </div>
    </form>
  );
}
