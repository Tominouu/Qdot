import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { QRSuccess } from "@/components/qr/qr-success";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.qrReady };
}

export default async function QRSuccessPage(props: PageProps<"/qr-codes/[id]/success">) {
  const { id } = await props.params;
  return <QRSuccess id={id} />;
}
