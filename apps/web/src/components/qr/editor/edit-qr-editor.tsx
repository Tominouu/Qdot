"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ButtonLink } from "@/components/ui/button";
import { getQRCode } from "@/lib/api/qr";
import { useResource } from "@/lib/hooks/use-resource";
import { QREditor } from "./qr-editor";
import { initialDraft } from "./use-qr-draft";

export function EditQREditor({ id }: { id: string }) {
  const { data, error } = useResource(() => getQRCode(id), [id]);
  if (error)
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
        <p className="text-muted">QR code not found.</p>
        <ButtonLink href="/qr-codes" variant="neutral">
          Back to QR codes
        </ButtonLink>
      </div>
    );
  if (!data)
    return (
      <div className="flex min-h-dvh items-center justify-center" aria-busy>
        <Skeleton className="size-[384px] rounded-3xl" />
      </div>
    );
  return <QREditor key={data.id} existingId={data.id} initial={initialDraft({ slug: data.slug, existing: data })} />;
}
