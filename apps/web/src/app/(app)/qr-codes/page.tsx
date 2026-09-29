import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { QRLibrary } from "@/components/qr/qr-library";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.qrCodes };
}

export default function QRCodesPage() {
  return <QRLibrary />;
}
