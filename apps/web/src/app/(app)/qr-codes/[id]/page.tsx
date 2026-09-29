import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { QRDetail } from "@/components/qr/qr-detail";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.qrCode };
}

export default async function QRDetailPage(props: PageProps<"/qr-codes/[id]">) {
  const { id } = await props.params;
  return <QRDetail id={id} />;
}
