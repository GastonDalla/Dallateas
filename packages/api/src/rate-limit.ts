import { randomUUID } from "node:crypto";

import prisma from "@dallateas/db";

type Limit = { limit: number; windowMs: number };

const CLEANUP_PROBABILITY = 0.01;
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * Counts one attempt against a limit shared by every server instance.
 * Use it where a limit must really hold (password guesses, quotas), since each call is a database write.
 */
export async function consumeRateLimit(key: string, { limit, windowMs }: Limit): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - windowMs;

  const [row] = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "rateLimit" ("id", "key", "count", "lastRequest")
    VALUES (${randomUUID()}, ${key}, 1, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "rateLimit"."lastRequest" < ${windowStart} THEN 1 ELSE "rateLimit"."count" + 1 END,
      "lastRequest" = CASE WHEN "rateLimit"."lastRequest" < ${windowStart} THEN ${now} ELSE "rateLimit"."lastRequest" END
    RETURNING "count"
  `;

  if (Math.random() < CLEANUP_PROBABILITY) {
    await prisma.rateLimit.deleteMany({ where: { lastRequest: { lt: now - STALE_AFTER_MS } } });
  }

  return (row?.count ?? 0) <= limit;
}

/** Reads a limit without counting an attempt, for limits that only failures should spend. */
export async function isRateLimited(key: string, { limit, windowMs }: Limit): Promise<boolean> {
  const row = await prisma.rateLimit.findUnique({ where: { key }, select: { count: true, lastRequest: true } });
  return row !== null && Number(row.lastRequest) >= Date.now() - windowMs && row.count >= limit;
}

const memoryHits = new Map<string, { count: number; resetAt: number }>();

/**
 * Cheap per-instance throttle for ordinary traffic. Serverless instances do not share it,
 * so it only blunts bursts. Anything that must hold uses `consumeRateLimit`.
 */
export function consumeMemoryLimit(key: string, { limit, windowMs }: Limit): boolean {
  const now = Date.now();
  const entry = memoryHits.get(key);

  if (entry && entry.resetAt > now) {
    entry.count += 1;
    return entry.count <= limit;
  }

  memoryHits.set(key, { count: 1, resetAt: now + windowMs });

  if (memoryHits.size > 10_000) {
    for (const [storedKey, value] of memoryHits) {
      if (value.resetAt <= now) memoryHits.delete(storedKey);
    }
  }

  return true;
}
