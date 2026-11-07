import "server-only";

import { createContext } from "@dallateas/api/context";
import { t } from "@dallateas/api/index";
import { appRouter } from "@dallateas/api/routers/index";
import { headers } from "next/headers";
import { cache } from "react";

const createCaller = t.createCallerFactory(appRouter);

/** tRPC caller for Server Components, built once per request. */
export const getServerCaller = cache(async () => createCaller(await createContext({ headers: await headers() })));
