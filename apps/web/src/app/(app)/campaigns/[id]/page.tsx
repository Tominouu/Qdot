import type { Metadata } from "next";
import { CampaignView } from "@/components/campaigns/campaign-view";

export const metadata: Metadata = { title: "Campaign" };

export default async function CampaignPage(props: PageProps<"/campaigns/[id]">) {
  const { id } = await props.params;
  return <CampaignView id={id} />;
}
