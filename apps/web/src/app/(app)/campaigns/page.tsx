import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { CampaignList } from "@/components/campaigns/campaign-list";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.campaigns };
}

export default function CampaignsPage() {
  return <CampaignList />;
}
