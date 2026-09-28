import { redirect } from "next/navigation";

// No dashboard screen exists in the design yet; the QR library is the app home.
export default function DashboardPage() {
  redirect("/qr-codes");
}
