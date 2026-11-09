import type { Metadata } from "next";

import { socialCard } from "@/app/batea/seo";
import { HydrateClient, prefetch, serverTrpc } from "@/server/trpc";

import BateasBrowser from "./bateas-browser";
import { cratesInput } from "./crates-query";

const DESCRIPTION = "Bateas públicas de DJs que tocan con vinilos, con el BPM de cada disco en la tapa.";

export const metadata: Metadata = {
  title: "Explorar bateas",
  description: DESCRIPTION,
  alternates: { canonical: "/bateas" },
  ...socialCard({ title: "Explorar bateas", description: DESCRIPTION }),
};

export default async function BateasPage() {
  await prefetch(serverTrpc.publicFolders.queryOptions(cratesInput({})), serverTrpc.publicGenres.queryOptions());

  return (
    <HydrateClient>
      <BateasBrowser />
    </HydrateClient>
  );
}
