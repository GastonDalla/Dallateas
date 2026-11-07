import "server-only";

import { createContext } from "@dallateas/api/context";
import { t } from "@dallateas/api/index";
import { appRouter } from "@dallateas/api/routers/index";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createTRPCOptionsProxy, type TRPCQueryOptions } from "@trpc/tanstack-react-query";
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

/** Starts queries for the client components below, without blocking the render. */
export function prefetch(...queries: ReturnType<TRPCQueryOptions<never>>[]) {
  const queryClient = getServerQueryClient();
  for (const query of queries) void queryClient.prefetchQuery(query);
}

export function HydrateClient({ children }: { children: ReactNode }) {
  return <HydrationBoundary state={dehydrate(getServerQueryClient())}>{children}</HydrationBoundary>;
}
