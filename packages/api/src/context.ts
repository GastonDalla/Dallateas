import { auth } from "@dallateas/auth";

export async function createContext(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  return {
    session,
    ip,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
