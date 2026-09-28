import type { Metadata } from "next";
import { SignUpView } from "@/components/auth/account-views";

export const metadata: Metadata = { title: "Create your account" };

export default function AccountStepPage() {
  return <SignUpView />;
}
