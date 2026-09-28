"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ApiError, isUnauthenticated } from "@/lib/api/client";
import { createQRCode, updateQRCode } from "@/lib/api/qr";
import { clearSession, getSession } from "@/lib/auth/session";
import { savePendingQR } from "@/lib/onboarding/pending-qr";
import { DestinationPanel, StylePanels, TypePanel } from "./editor-panels";
import { QRPreviewCard } from "./qr-preview-card";
import { useQRDraft, type QRDraft } from "./use-qr-draft";

interface QREditorProps {
  initial: QRDraft;
  /** Present when editing an existing code. */
  existingId?: string;
}

export function QREditor({ initial, existingId }: QREditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const ctrl = useQRDraft(initial);
  const { draft, destination, inputError, payload, payloadIsFinal, scannability } = ctrl;
  const [phoneMockup, setPhoneMockup] = useState(false);
  const [pending, setPending] = useState<"create" | "draft" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editing = Boolean(existingId);

  const baseInput = () => ({
    name: draft.name,
    category: draft.category,
    campaignId: draft.campaignId,
    style: draft.style,
  });

  /** No account yet (onboarding) or session expired: keep everything and go to the Account step. */
  const continueToAccount = (destinationUrl: string, status: "active" | "draft") => {
    savePendingQR({
      draft: {
        previewCode: draft.previewCode,
        name: draft.name,
        type: draft.type,
        category: draft.category,
        campaignId: draft.campaignId,
        input: draft.input,
        style: draft.style,
      },
      create: { ...baseInput(), type: "url", destinationUrl, status },
    });
    router.push("/onboarding/account");
  };

  const fail = (err: unknown, fallback: string) => {
    toast(err instanceof ApiError && err.status !== 500 ? err.message : fallback, "warning");
    setPending(null);
  };

  const submit = async () => {
    ctrl.touch();
    if (inputError || !destination) {
      toast(inputError ?? "Add a destination first", "warning");
      inputRef.current?.focus();
      return;
    }
    if (!editing && !getSession()) return continueToAccount(destination, "active");
    setPending("create");
    try {
      if (existingId) {
        await updateQRCode(existingId, { ...baseInput(), destinationUrl: destination });
        toast("Changes saved — printed codes now resolve to the new destination", "info");
        router.push(`/qr-codes/${existingId}`);
      } else {
        const qr = await createQRCode({ ...baseInput(), type: "url", destinationUrl: destination, status: "active" });
        router.push(`/qr-codes/${qr.id}/success`);
      }
    } catch (err) {
      if (isUnauthenticated(err)) {
        clearSession();
        if (!editing) return continueToAccount(destination, "active");
        router.push(`/sign-in?next=${encodeURIComponent(`/qr-codes/${existingId}/edit`)}`);
        return;
      }
      fail(err, "Something went wrong. Please try again.");
    }
  };

  const saveDraft = async () => {
    if (!destination) {
      ctrl.touch();
      toast("Add a valid destination to save a draft", "warning");
      inputRef.current?.focus();
      return;
    }
    if (!getSession()) return continueToAccount(destination, "draft");
    setPending("draft");
    try {
      await createQRCode({ ...baseInput(), type: "url", destinationUrl: destination, status: "draft" });
      toast("Draft saved", "info");
      router.push("/qr-codes");
    } catch (err) {
      if (isUnauthenticated(err)) {
        clearSession();
        return continueToAccount(destination, "draft");
      }
      fail(err, "Could not save draft");
    }
  };

  const primaryLabel = editing ? "Save changes" : "Create QR code";
  const busyLabel = editing ? "Saving…" : "Creating…";
  const title = editing ? draft.name || "Edit QR code" : "New QR Code";

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Desktop / tablet top bar */}
      <header className="sticky top-0 z-20 hidden items-center justify-between gap-4 border-b border-line bg-bg/95 px-6 py-4 backdrop-blur md:flex">
        <Breadcrumb
          items={[
            { label: "QR Codes", href: "/qr-codes" },
            ...(editing ? [{ label: draft.name || "QR code", href: `/qr-codes/${existingId}` }, { label: "Edit" }] : [{ label: title }]),
          ]}
          className="[&_a]:text-faint"
        />
        <div className="flex items-center gap-3">
          {editing ? (
            <Button variant="neutral" className="h-[42px]" onClick={() => router.push(`/qr-codes/${existingId}`)} disabled={pending !== null}>
              Cancel
            </Button>
          ) : (
            <Button variant="neutral" className="h-[42px]" onClick={saveDraft} disabled={pending !== null}>
              {pending === "draft" ? "Saving…" : "Save draft"}
            </Button>
          )}
          <Button className="h-[42px]" onClick={submit} disabled={pending !== null}>
            {pending === "create" ? busyLabel : primaryLabel}
          </Button>
        </div>
      </header>

      {/* Mobile top bar (mobile-qr-creator frame) */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-sidebar/95 px-4 py-3.5 backdrop-blur md:hidden">
        <Link href={editing ? `/qr-codes/${existingId}` : "/qr-codes"} aria-label="Back" className="-ml-1 rounded-md p-1 text-fg">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-display text-xl font-extrabold text-fg">{editing ? "Edit QR code" : "Create QR code"}</h1>
        {!editing && (
          <button type="button" onClick={saveDraft} disabled={pending !== null} className="ml-auto text-[13px] font-semibold text-muted hover:text-fg">
            Save draft
          </button>
        )}
      </header>

      <div className="grid flex-1 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
        <aside className="order-2 border-line bg-bg md:grid md:grid-cols-2 md:border-t lg:order-1 lg:block lg:self-start lg:border-t-0 lg:border-r lg:bg-[#18181b]">
          <DestinationPanel ctrl={ctrl} inputRef={inputRef} />
          <TypePanel ctrl={ctrl} />
        </aside>

        <section
          aria-label="Live preview"
          className="order-1 flex justify-center bg-sidebar px-4 py-8 md:bg-bg md:py-10 lg:order-2 lg:items-start lg:pt-10"
        >
          <div className="md:hidden">
            <QRPreviewCard
              compact
              payload={payload}
              payloadIsFinal={payloadIsFinal}
              style={draft.style}
              scannability={scannability}
              destination={destination}
              phoneMockup={false}
              onPhoneMockupChange={setPhoneMockup}
            />
          </div>
          <div className="hidden w-full justify-center md:flex lg:sticky lg:top-24">
            <QRPreviewCard
              payload={payload}
              payloadIsFinal={payloadIsFinal}
              style={draft.style}
              scannability={scannability}
              destination={destination}
              phoneMockup={phoneMockup}
              onPhoneMockupChange={setPhoneMockup}
            />
          </div>
        </section>

        <aside className="order-3 border-line bg-bg pb-28 md:grid md:grid-cols-2 md:pb-0 lg:block lg:self-start lg:border-l lg:bg-[#18181b]">
          <StylePanels ctrl={ctrl} />
        </aside>
      </div>

      {/* Mobile pinned action */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-sidebar/95 p-4 pb-[max(16px,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        <Button variant="inverse" size="lg" className="w-full" onClick={submit} disabled={pending !== null}>
          {pending === "create" ? busyLabel : primaryLabel}
        </Button>
      </div>
    </div>
  );
}
