import type { Metadata } from "next";
import { AnalyticsOverview } from "@/components/analytics/analytics-overview";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return <AnalyticsOverview />;
}
