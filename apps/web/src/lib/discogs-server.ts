import "server-only";

import { auth } from "@dallateas/auth";
import { clientIp } from "@dallateas/api/context";
import { consumeRateLimit } from "@dallateas/api/rate-limit";
import { env } from "@dallateas/env/server";
import { NextResponse, type NextRequest } from "next/server";

const DISCOGS_BASE_URL = "https://api.discogs.com";
const WINDOW_MS = 60_000;

type DiscogsRequest = { path: string; params?: Record<string, string>; revalidate?: number };

export function discogsFetch({ path, params, revalidate = 3600 }: DiscogsRequest) {
  const url = new URL(path, DISCOGS_BASE_URL);
  for (const [key, value] of Object.entries(params ?? {})) url.searchParams.set(key, value);

  const authorization =
    env.DISCOGS_KEY && env.DISCOGS_SECRET
      ? { Authorization: `Discogs key=${env.DISCOGS_KEY}, secret=${env.DISCOGS_SECRET}` }
      : undefined;

  return fetch(url, {
    headers: { "User-Agent": "Dallateas/1.0", Accept: "application/json", ...authorization },
    next: { revalidate },
  });
}

/**
 * Every Discogs route spends one quota shared by all users, so callers are limited across instances.
 * Returns a response when the request must stop here.
 */
export async function guardDiscogsRequest(req: NextRequest, { requireSession }: { requireSession: boolean }) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (requireSession && !session) {
    return NextResponse.json({ error: "Necesitás iniciar sesión" }, { status: 401 });
  }

  const key = session ? `discogs:user:${session.user.id}` : `discogs:ip:${clientIp(req.headers)}`;
  const allowed = await consumeRateLimit(key, { limit: session ? 40 : 15, windowMs: WINDOW_MS });

  return allowed ? null : NextResponse.json({ error: "Demasiadas búsquedas. Esperá un momento." }, { status: 429 });
}
