import type { Metadata } from "next";
import { EditQREditor } from "@/components/qr/editor/edit-qr-editor";

export const metadata: Metadata = { title: "Edit QR code" };

export default async function EditQRCodePage(props: PageProps<"/qr-codes/[id]/edit">) {
  const { id } = await props.params;
  return <EditQREditor id={id} />;
}
