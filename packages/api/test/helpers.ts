import prisma from "@dallateas/db";

import { t } from "../src/index";
import { appRouter } from "../src/routers/index";

export const hasDatabase = Boolean(process.env.TEST_DATABASE_URL);

const createCaller = t.createCallerFactory(appRouter);

type TestUser = { id: string; role?: string };

let sequence = 0;

/** Better Auth issues 32-character ids, so test users must too. */
function betterAuthId() {
  sequence += 1;
  return `${sequence}`.padStart(32, "u");
}

export async function resetDatabase() {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "user", "session", "account", "verification", "rateLimit", "Vinyl", "Folder", "Tag", "DjProfile" CASCADE`,
  );
}

export async function createUser(overrides: { username?: string; role?: string; email?: string } = {}) {
  const id = betterAuthId();
  return prisma.user.create({
    data: {
      id,
      name: `User ${id.slice(-3)}`,
      email: overrides.email ?? `${id}@example.com`,
      emailVerified: true,
      role: overrides.role ?? "user",
      username: overrides.username,
    },
  });
}

function buildCaller(
  user: TestUser | undefined,
  cookies: Record<string, string>,
  setCookies: string[],
  ip = `10.0.0.${(sequence % 250) + 1}`,
) {
  return createCaller({
    session: user ? ({ user: { id: user.id, role: user.role ?? "user" } } as never) : null,
    ip,
    cookies,
    setCookie: (value: string) => setCookies.push(value),
  } as never);
}

export function callerFor(user?: TestUser, cookies: Record<string, string> = {}) {
  return buildCaller(user, cookies, []);
}

/** A caller that also exposes the cookies the server asked the browser to store. */
export function visitor(ip?: string) {
  const setCookies: string[] = [];
  return { caller: buildCaller(undefined, {}, setCookies, ip), setCookies };
}

export function cookiePair(setCookie: string) {
  const [name, value] = setCookie.split(";")[0]!.split("=");
  return { [name!]: value! };
}

export async function createFolder(
  userId: string,
  data: { visibility?: "PUBLIC" | "ACCOUNT" | "PRIVATE"; password?: string | null; type?: "GENRE" | "SET" | "OTHER" } = {},
) {
  const folder = await callerFor({ id: userId }).folderCreate({
    name: "Crate",
    type: data.type ?? "OTHER",
    visibility: data.visibility ?? "PUBLIC",
    password: data.password ?? undefined,
  });
  return folder;
}

export async function createVinyl(userId: string, folderIds: string[] = [], extra: Record<string, unknown> = {}) {
  return callerFor({ id: userId }).vinylCreate({
    title: "Minus",
    artist: "Robert Hood",
    notes: "private note",
    mixNotes: "private mix note",
    pricePaid: 42,
    folderIds,
    ...extra,
  });
}

export async function expectTrpcError(promise: Promise<unknown>, code: string) {
  let error: unknown;
  try {
    await promise;
  } catch (caught) {
    error = caught;
  }
  if (!(error instanceof Error) || (error as { code?: string }).code !== code) {
    throw new Error(`Expected tRPC error ${code}, got: ${String(error)}`);
  }
}
