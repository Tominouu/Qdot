import type { Metadata } from "next";
import { NewQREditor } from "@/components/qr/editor/new-qr-editor";
import { generateSlug } from "@/lib/qr/slug";
import type { QRCategory } from "@/types";

export const metadata: Metadata = { title: "New QR code" };

const CATEGORIES: QRCategory[] = ["website", "menu", "event", "social", "app", "custom"];

export default async function NewQRCodePage(props: PageProps<"/qr-codes/new">) {
  const { category, campaign, resume } = await props.searchParams;
  const c = typeof category === "string" && CATEGORIES.includes(category as QRCategory) ? (category as QRCategory) : undefined;
  return (
    <NewQREditor
      previewCode={generateSlug(8)}
      category={c}
      campaignId={typeof campaign === "string" ? campaign : undefined}
      resume={resume === "1"}
    />
  );
}
