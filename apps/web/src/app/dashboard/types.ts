import type { AppRouter } from "@dallateas/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";

type Outputs = inferRouterOutputs<AppRouter>;

export type ListedVinyl = Outputs["vinylsList"]["items"][number];
export type Folder = Outputs["foldersList"][number];
