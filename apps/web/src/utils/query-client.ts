import { QueryCache, QueryClient } from "@tanstack/react-query";
import superjson from "superjson";

type ErrorHandler = (error: Error) => void;

export function makeQueryClient(onError?: ErrorHandler) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: { retry: false },
      dehydrate: { serializeData: superjson.serialize },
      hydrate: { deserializeData: superjson.deserialize },
    },
    queryCache: new QueryCache({ onError }),
  });
}
