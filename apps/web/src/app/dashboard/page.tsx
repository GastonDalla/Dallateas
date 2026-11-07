import type { Metadata } from "next";

import { requireSession } from "@/server/session";
import { HydrateClient, prefetch, serverTrpc } from "@/server/trpc";

import Dashboard from "./dashboard";
import { paramsFromPage, parseFilters, toVinylsListInput } from "./filters";

export const metadata: Metadata = {
  title: "Mi colección",
  robots: { index: false, follow: false },
};

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  await requireSession();
  const filters = parseFilters(paramsFromPage(await searchParams));

  await prefetch(
    serverTrpc.vinylsList.queryOptions(toVinylsListInput(filters)),
    serverTrpc.foldersList.queryOptions(),
    serverTrpc.collectionStats.queryOptions(),
    serverTrpc.userGenres.queryOptions(),
    serverTrpc.userStyles.queryOptions(),
    serverTrpc.tagsList.queryOptions(),
  );

  return (
    <HydrateClient>
      <Dashboard />
    </HydrateClient>
  );
}
