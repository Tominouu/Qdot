import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { AnalyticsOverview } from "@/components/analytics/analytics-overview";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.analytics };
}

export default function AnalyticsPage() {
  return <AnalyticsOverview />;
}
