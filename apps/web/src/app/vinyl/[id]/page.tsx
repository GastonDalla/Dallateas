import type { Metadata } from "next";

import { requireSession } from "@/server/session";
import { HydrateClient, prefetch, serverTrpc } from "@/server/trpc";

import VinylDetail from "./vinyl-detail";

export const metadata: Metadata = {
  title: "Detalle de vinilo",
  robots: { index: false, follow: false },
};

export default async function VinylPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;

  await prefetch(serverTrpc.vinylGet.queryOptions({ id }));

  return (
    <HydrateClient>
      <VinylDetail id={id} />
    </HydrateClient>
  );
}
