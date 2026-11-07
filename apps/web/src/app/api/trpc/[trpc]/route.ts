import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createContext } from "@dallateas/api/context";
import { appRouter } from "@dallateas/api/routers/index";
import { NextRequest } from "next/server";

function handler(req: NextRequest) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: ({ resHeaders }) => createContext({ headers: req.headers, resHeaders }),
  });
}
export { handler as GET, handler as POST };
