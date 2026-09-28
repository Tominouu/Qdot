import { redirect } from "next/navigation";
import { connection } from "next/server";
import { listCampaigns } from "@/lib/api/campaigns";

// The design only covers a campaign's detail view; open the most recent campaign.
export default async function CampaignsPage() {
  await connection(); // resolve per request, never at build time against the API
  const [first] = await listCampaigns();
  redirect(first ? `/campaigns/${first.id}` : "/qr-codes");
}
