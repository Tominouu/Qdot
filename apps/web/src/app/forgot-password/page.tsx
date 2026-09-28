import type { Metadata } from "next";
import { ForgotPasswordView } from "@/components/auth/account-views";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
