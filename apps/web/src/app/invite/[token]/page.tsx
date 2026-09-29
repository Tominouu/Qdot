import type { Metadata } from "next";
import { InvitationView } from "@/components/workspace/invitation-view";

export const metadata: Metadata = { title: "Invitation", robots: { index: false } };

export default async function InvitePage(props: PageProps<"/invite/[token]">) {
  const { token } = await props.params;
  return <InvitationView token={token} />;
}
