import type { Metadata } from "next";

import { requireSession } from "@/server/session";
import { HydrateClient, prefetch, serverTrpc } from "@/server/trpc";

import { FoldersView } from "./folders-view";

export const metadata: Metadata = {
  title: "Carpetas",
  robots: { index: false, follow: false },
};

export default async function FoldersPage() {
  await requireSession();

  await prefetch(serverTrpc.foldersList.queryOptions(), serverTrpc.myCollaborations.queryOptions());

  return (
    <HydrateClient>
      <FoldersView />
    </HydrateClient>
  );
}
