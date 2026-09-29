import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { SignUpView } from "@/components/auth/account-views";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.createAccount };
}

export default function AccountStepPage() {
  return <SignUpView />;
}
