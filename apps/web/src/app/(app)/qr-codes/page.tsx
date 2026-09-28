import type { Metadata } from "next";
import { QRLibrary } from "@/components/qr/qr-library";

export const metadata: Metadata = { title: "QR codes" };

export default function QRCodesPage() {
  return <QRLibrary />;
}
