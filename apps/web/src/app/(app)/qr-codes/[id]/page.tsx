import type { Metadata } from "next";
import { QRDetail } from "@/components/qr/qr-detail";

export const metadata: Metadata = { title: "QR code" };

export default async function QRDetailPage(props: PageProps<"/qr-codes/[id]">) {
  const { id } = await props.params;
  return <QRDetail id={id} />;
}
