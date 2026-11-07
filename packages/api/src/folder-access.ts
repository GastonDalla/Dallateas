import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import prisma from "@dallateas/db";
import { env } from "@dallateas/env/server";

import type { Context } from "./context";

const scryptAsync = promisify(scrypt) as (password: string, salt: string, keyLength: number) => Promise<Buffer>;

const KEY_LENGTH = 64;
const UNLOCK_TTL_SECONDS = 60 * 60 * 24;

export async function hashFolderPassword(plain: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scryptAsync(plain, salt, KEY_LENGTH);
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyFolderPassword(plain: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = await scryptAsync(plain, salt, KEY_LENGTH);
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

function unlockCookieName(folderId: string) {
  return `dallateas_unlock_${folderId}`;
}

// Signing the stored hash means changing the password invalidates every earlier unlock.
function unlockSignature(folderId: string, passwordHash: string, expiresAt: number) {
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`${folderId}.${expiresAt}.${passwordHash}`)
    .digest("base64url");
}

export function buildUnlockCookie(folderId: string, passwordHash: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + UNLOCK_TTL_SECONDS;
  const value = `${expiresAt}.${unlockSignature(folderId, passwordHash, expiresAt)}`;
  const secure = env.NODE_ENV === "production" ? "; Secure" : "";
  return `${unlockCookieName(folderId)}=${value}; Path=/; Max-Age=${UNLOCK_TTL_SECONDS}; HttpOnly; SameSite=Lax${secure}`;
}

function hasValidUnlock(folderId: string, passwordHash: string, cookies: Context["cookies"]) {
  const [expiresAt, signature] = cookies[unlockCookieName(folderId)]?.split(".") ?? [];
  if (!expiresAt || !signature) return false;

  const expiry = Number(expiresAt);
  if (!Number.isInteger(expiry) || expiry < Date.now() / 1000) return false;

  const expected = Buffer.from(unlockSignature(folderId, passwordHash, expiry));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

type GuardedFolder = {
  id: string;
  userId: string;
  visibility: "PUBLIC" | "ACCOUNT" | "PRIVATE";
  password: string | null;
};

export type FolderAccess = {
  /** The viewer may know the folder exists. */
  visible: boolean;
  /** Its contents stay hidden until the password is given. */
  locked: boolean;
  /** Owner, admin or collaborator. */
  member: boolean;
};

/** The single answer to "who sees what" for a folder, shared by every public read. */
export async function resolveFolderAccess(
  folder: GuardedFolder,
  ctx: Pick<Context, "session" | "cookies">,
): Promise<FolderAccess> {
  const viewerId = ctx.session?.user.id;
  const isOwner = viewerId === folder.userId;
  const isAdmin = ctx.session?.user.role === "admin";

  let member = isOwner || isAdmin;
  if (!member && viewerId) {
    const collaborator = await prisma.folderCollaborator.findUnique({
      where: { folderId_userId: { folderId: folder.id, userId: viewerId } },
      select: { id: true },
    });
    member = Boolean(collaborator);
  }

  const visible =
    member || folder.visibility === "PUBLIC" || (folder.visibility === "ACCOUNT" && Boolean(ctx.session));

  const locked =
    !member && folder.password !== null && !hasValidUnlock(folder.id, folder.password, ctx.cookies);

  return { visible, locked, member };
}

/** Listing filter matching `resolveFolderAccess` for people who are not members. */
export function listableVisibility(signedIn: boolean) {
  return signedIn ? { in: ["PUBLIC" as const, "ACCOUNT" as const] } : ("PUBLIC" as const);
}

/** Removes the password hash from a folder before it reaches a client. */
export function toClientFolder<T extends { password: string | null }>(folder: T) {
  const { password, ...rest } = folder;
  return { ...rest, hasPassword: password !== null };
}
