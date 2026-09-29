import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { CampaignView } from "@/components/campaigns/campaign-view";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).meta.campaign };
}

export default async function CampaignPage(props: PageProps<"/campaigns/[id]">) {
  const { id } = await props.params;
  return <CampaignView id={id} />;
}
