import type { Metadata } from "next";
import { SignInView } from "@/components/auth/account-views";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return <SignInView />;
}
