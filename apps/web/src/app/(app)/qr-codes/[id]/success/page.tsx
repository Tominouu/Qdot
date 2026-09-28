import type { Metadata } from "next";
import { QRSuccess } from "@/components/qr/qr-success";

export const metadata: Metadata = { title: "QR code ready" };

export default async function QRSuccessPage(props: PageProps<"/qr-codes/[id]/success">) {
  const { id } = await props.params;
  return <QRSuccess id={id} />;
}
