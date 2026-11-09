import type { Metadata } from "next";

import { requireSession } from "@/server/session";
import { HydrateClient, prefetch, serverTrpc } from "@/server/trpc";

import StatsPage from "./stats-page";

export const metadata: Metadata = {
  title: "Estadísticas",
  robots: { index: false, follow: false },
};

export default async function Stats() {
  await requireSession();

  await prefetch(
    serverTrpc.collectionStats.queryOptions(),
    serverTrpc.trackStats.queryOptions(),
    serverTrpc.vinylsMissingBpm.queryOptions(),
  );

  return (
    <HydrateClient>
      <StatsPage />
    </HydrateClient>
  );
}
