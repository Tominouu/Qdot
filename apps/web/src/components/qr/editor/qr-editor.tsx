"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { isUnauthenticated } from "@/lib/api/client";
import { createQRCode, updateQRCode } from "@/lib/api/qr";
import { clearSession, getSession } from "@/lib/auth/session";
import { errorMessage } from "@/lib/i18n/errors";
import { useI18n } from "@/lib/i18n/provider";
import { savePendingQR } from "@/lib/onboarding/pending-qr";
import { ContentPanel } from "./content-panel";
import { DesignPanel } from "./design-panel";
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
  const { t } = useI18n();
  const e = t.editor;
  const ctrl = useQRDraft(initial);
  const { draft, content, mode, valid, errors, destination, payload, payloadIsFinal, report } = ctrl;
  const [phoneMockup, setPhoneMockup] = useState(false);
  const [pending, setPending] = useState<"create" | "draft" | null>(null);
  const editing = Boolean(existingId);

  const fields = () => ({ name: draft.name, category: draft.category, campaignId: draft.campaignId, content, design: draft.design });

  /** No account yet (onboarding) or session expired: keep everything and go to the Account step. */
  const continueToAccount = (status: "active" | "draft") => {
    savePendingQR({
      draft: {
        previewCode: draft.previewCode,
        name: draft.name,
        category: draft.category,
        campaignId: draft.campaignId,
        mode,
        type: draft.type,
        contents: draft.contents,
        design: draft.design,
      },
      create: { ...fields(), mode, status },
    });
    router.push("/onboarding/account");
  };

  const fail = (err: unknown, fallback: string) => {
    toast(errorMessage(err, t, fallback), "warning");
    setPending(null);
  };

  /** First invalid field of the content form gets focus, like a native form. */
  const focusFirstError = () => {
    const first = Object.values(errors)[0];
    toast(first ?? e.addDestination, "warning");
    requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-label="' + e.sections.content + '"] [aria-invalid="true"]')?.focus());
  };

  const submit = async () => {
    ctrl.touch();
    if (!valid) return focusFirstError();
    if (!editing && !getSession()) return continueToAccount("active");
    setPending("create");
    try {
      if (existingId) {
        await updateQRCode(existingId, fields());
        toast(mode === "dynamic" ? e.changesSavedDynamic : e.changesSaved, "info");
        router.push(`/qr-codes/${existingId}`);
      } else {
        const qr = await createQRCode({ ...fields(), mode, status: "active" });
        router.push(`/qr-codes/${qr.id}/success`);
      }
    } catch (err) {
      if (isUnauthenticated(err)) {
        clearSession();
        if (!editing) return continueToAccount("active");
        router.push(`/sign-in?next=${encodeURIComponent(`/qr-codes/${existingId}/edit`)}`);
        return;
      }
      fail(err, t.common.somethingWrong);
    }
  };

  const saveDraft = async () => {
    ctrl.touch();
    if (!valid) {
      toast(e.addValidDestination, "warning");
      return;
    }
    if (!getSession()) return continueToAccount("draft");
    setPending("draft");
    try {
      await createQRCode({ ...fields(), mode, status: "draft" });
      toast(e.draftSaved, "info");
      router.push("/qr-codes");
    } catch (err) {
      if (isUnauthenticated(err)) {
        clearSession();
        return continueToAccount("draft");
      }
      fail(err, e.couldNotSaveDraft);
    }
  };

  const primaryLabel = editing ? t.common.saveChanges : e.create;
  const busyLabel = editing ? t.common.saving : e.creating;
  const title = editing ? draft.name || e.editTitle : e.newTitle;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Desktop / tablet top bar */}
      <header className="sticky top-0 z-20 hidden items-center justify-between gap-4 border-b border-line bg-bg/95 px-6 py-4 backdrop-blur md:flex">
        <Breadcrumb
          items={[
            { label: t.nav.qrCodes, href: "/qr-codes" },
            ...(editing ? [{ label: draft.name || e.qrCode, href: `/qr-codes/${existingId}` }, { label: t.common.edit }] : [{ label: title }]),
          ]}
          className="[&_a]:text-faint"
        />
        <div className="flex items-center gap-3">
          {editing ? (
            <Button variant="neutral" className="h-[42px]" onClick={() => router.push(`/qr-codes/${existingId}`)} disabled={pending !== null}>
              {t.common.cancel}
            </Button>
          ) : (
            <Button variant="neutral" className="h-[42px]" onClick={saveDraft} disabled={pending !== null}>
              {pending === "draft" ? t.common.saving : e.saveDraft}
            </Button>
          )}
          <Button className="h-[42px]" onClick={submit} disabled={pending !== null}>
            {pending === "create" ? busyLabel : primaryLabel}
          </Button>
        </div>
      </header>

      {/* Mobile top bar (mobile-qr-creator frame) */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-sidebar/95 px-4 py-3.5 backdrop-blur md:hidden">
        <Link href={editing ? `/qr-codes/${existingId}` : "/qr-codes"} aria-label={t.common.back} className="-ml-1 rounded-md p-1 text-fg">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-display text-xl font-extrabold text-fg">{editing ? e.editTitle : e.createTitle}</h1>
        {!editing && (
          <button type="button" onClick={saveDraft} disabled={pending !== null} className="ml-auto text-[13px] font-semibold text-muted hover:text-fg">
            {e.saveDraft}
          </button>
        )}
      </header>

      <div className="grid flex-1 lg:grid-cols-[300px_minmax(0,1fr)_320px]">
        <aside className="order-2 border-line bg-bg md:border-t lg:order-1 lg:self-start lg:border-t-0 lg:border-r lg:bg-[#18181b]">
          <ContentPanel ctrl={ctrl} />
        </aside>

        <section
          aria-label={e.livePreview}
          className="order-1 flex justify-center bg-sidebar px-4 py-8 md:bg-bg md:py-10 lg:order-2 lg:items-start lg:pt-10"
        >
          <div className="md:hidden">
            <QRPreviewCard
              compact
              payload={payload}
              payloadIsFinal={payloadIsFinal}
              mode={mode}
              design={draft.design}
              report={report}
              destination={destination}
              phoneMockup={false}
              onPhoneMockupChange={setPhoneMockup}
            />
          </div>
          <div className="hidden w-full justify-center md:flex lg:sticky lg:top-24">
            <QRPreviewCard
              payload={payload}
              payloadIsFinal={payloadIsFinal}
              mode={mode}
              design={draft.design}
              report={report}
              destination={destination}
              phoneMockup={phoneMockup}
              onPhoneMockupChange={setPhoneMockup}
            />
          </div>
        </section>

        <aside className="order-3 border-line bg-bg pb-28 md:border-t md:pb-0 lg:self-start lg:border-t-0 lg:border-l lg:bg-[#18181b]">
          <DesignPanel ctrl={ctrl} />
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
