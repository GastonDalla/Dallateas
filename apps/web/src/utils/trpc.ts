import { isServer, type QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@dallateas/api/routers/index";
import superjson from "superjson";
import { toast } from "sonner";

import { makeQueryClient } from "./query-client";

let browserQueryClient: QueryClient | undefined;

/**
 * One client per browser tab, and a new one per render on the server,
 * so a request can never read another visitor's cached data.
 */
export function getQueryClient() {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient((error) => toast.error(error.message));
  return browserQueryClient;
}

const trpcClient = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: "/api/trpc", transformer: superjson, maxItems: 20 })],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient: getQueryClient,
});
