import { DEFAULT_PITCH_RANGE } from "@dallateas/dj/tempo";
import type { Metadata } from "next";

import { requireSession } from "@/server/session";
import { HydrateClient, prefetch, serverTrpc } from "@/server/trpc";

import FolderDetail from "./folder-detail";

import "./set-bag.css";

export const metadata: Metadata = {
  title: "Carpeta",
  robots: { index: false, follow: false },
};

export default async function FolderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;

  // The folder's type is unknown until it loads, and waiting for it would run these two reads one after the other.
  await prefetch(
    serverTrpc.folderGet.queryOptions({ id }),
    serverTrpc.folderSetFlow.queryOptions({ folderId: id, pitchRange: DEFAULT_PITCH_RANGE }),
  );

  return (
    <HydrateClient>
      <FolderDetail id={id} />
    </HydrateClient>
  );
}
