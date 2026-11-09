import "server-only";

import { createContext } from "@dallateas/api/context";
import { t } from "@dallateas/api/index";
import { appRouter } from "@dallateas/api/routers/index";
import { dehydrate, HydrationBoundary, type FetchQueryOptions } from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { headers } from "next/headers";
import { cache, type ReactNode } from "react";

import { makeQueryClient } from "@/utils/query-client";

const createCaller = t.createCallerFactory(appRouter);

const getContext = cache(async () => createContext({ headers: await headers() }));

/** tRPC caller for Server Components, built once per request. */
export const getServerCaller = cache(async () => createCaller(await getContext()));

const getServerQueryClient = cache(() => makeQueryClient());

/** Query options that run on the server, for prefetching what a client component reads. */
export const serverTrpc = createTRPCOptionsProxy({
  ctx: getContext,
  router: appRouter,
  queryClient: getServerQueryClient,
});

/**
 * Loads what the client components below read, before they render. Waiting here means the
 * server and the browser render the same data, which `useQuery` needs to hydrate cleanly.
 */
export async function prefetch(...queries: { queryKey: readonly unknown[] }[]) {
  const queryClient = getServerQueryClient();
  await Promise.all(queries.map((query) => queryClient.prefetchQuery(query as FetchQueryOptions)));
}

export function HydrateClient({ children }: { children: ReactNode }) {
  return <HydrationBoundary state={dehydrate(getServerQueryClient())}>{children}</HydrationBoundary>;
}
