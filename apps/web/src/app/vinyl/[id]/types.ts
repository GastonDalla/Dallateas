import type { AppRouter } from "@dallateas/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";

type Outputs = inferRouterOutputs<AppRouter>;

export type Vinyl = Outputs["vinylGet"];
export type Track = Vinyl["tracks"][number];
export type BpmLookup = Outputs["vinylLookupBpm"];
