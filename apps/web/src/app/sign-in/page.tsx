import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { SignInView } from "@/components/auth/account-views";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.signIn };
}

export default function SignInPage() {
  return <SignInView />;
}
