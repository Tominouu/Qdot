import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.createQr };
}

export default function OnboardingPage() {
  return <OnboardingFlow />;
}
