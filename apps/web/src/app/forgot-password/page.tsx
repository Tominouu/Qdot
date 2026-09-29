import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { ForgotPasswordView } from "@/components/auth/account-views";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.resetPassword };
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
