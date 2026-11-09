import { auth } from "@dallateas/auth";

function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").flatMap((part) => {
      const separator = part.indexOf("=");
      if (separator === -1) return [];
      return [[part.slice(0, separator).trim(), part.slice(separator + 1).trim()]];
    }),
  );
}

/** On Vercel these headers are set by the platform. Behind another proxy, make it overwrite them too. */
export function clientIp(headers: Headers) {
  return (
    headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function createContext({ headers, resHeaders }: { headers: Headers; resHeaders?: Headers }) {
  const session = await auth.api.getSession({ headers });
  return {
    session,
    ip: clientIp(headers),
    cookies: parseCookies(headers.get("cookie")),
    setCookie: (value: string) => {
      resHeaders?.append("Set-Cookie", value);
    },
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
