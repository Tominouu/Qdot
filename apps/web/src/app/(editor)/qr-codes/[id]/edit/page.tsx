import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { EditQREditor } from "@/components/qr/editor/edit-qr-editor";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.editQr };
}

export default async function EditQRCodePage(props: PageProps<"/qr-codes/[id]/edit">) {
  const { id } = await props.params;
  return <EditQREditor id={id} />;
}
