import prisma, { type Prisma } from "@dallateas/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  buildUnlockCookie,
  listableVisibility,
  resolveFolderAccess,
  verifyFolderPassword,
} from "../folder-access";
import { publicProcedure, router } from "../index";
import { consumeRateLimit } from "../rate-limit";
import { recordId } from "../schemas";

const UNLOCK_WINDOW_MS = 15 * 60 * 1000;
const VIEW_WINDOW_MS = 60 * 60 * 1000;

const previewFolderInclude = {
  user: { select: { id: true, name: true, image: true } },
  vinyls: {
    select: {
      vinyl: {
        select: { id: true, title: true, artist: true, genre: true, style: true, coverUrl: true, year: true },
      },
    },
    orderBy: { position: "asc" },
    take: 4,
  },
  _count: { select: { vinyls: true } },
} satisfies Prisma.FolderInclude;

type PreviewFolder = Prisma.FolderGetPayload<{ include: typeof previewFolderInclude }>;

function toPublicPreview(folder: PreviewFolder) {
  const hasPassword = folder.password !== null;
  return {
    id: folder.id,
    name: folder.name,
    description: folder.description,
    type: folder.type,
    color: folder.color,
    updatedAt: folder.updatedAt,
    viewCount: folder.viewCount,
    hasPassword,
    owner: folder.user,
    vinylCount: folder._count.vinyls,
    // A locked folder may be listed, but its records are what the password protects.
    vinyls: hasPassword ? [] : folder.vinyls.map(({ vinyl }) => vinyl),
  };
}

const publicVinylSelect = {
  id: true,
  title: true,
  artist: true,
  label: true,
  genre: true,
  style: true,
  bpm: true,
  year: true,
  discogsId: true,
  coverUrl: true,
  notes: true,
  tracks: {
    select: { id: true, side: true, position: true, title: true, duration: true },
    orderBy: { position: "asc" },
  },
} satisfies Prisma.VinylSelect;

export const publicRouter = router({
  healthCheck: publicProcedure.query(() => "OK"),

  publicGenres: publicProcedure.query(async () => {
    const vinyls = await prisma.vinyl.findMany({
      where: { folders: { some: { folder: { visibility: "PUBLIC", password: null } } } },
      select: { genre: true },
      distinct: ["genre"],
    });
    return vinyls.flatMap(({ genre }) => (genre ? [genre] : [])).sort();
  }),

  publicStats: publicProcedure.query(async () => {
    const [totalVinyls, totalPublicFolders, totalUsers] = await Promise.all([
      prisma.vinyl.count(),
      prisma.folder.count({ where: { visibility: "PUBLIC" } }),
      prisma.user.count(),
    ]);
    return { totalVinyls, totalPublicFolders, totalUsers };
  }),

  publicFolders: publicProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(50).default(20),
          cursor: recordId.optional(),
          search: z.string().trim().max(200).optional(),
          type: z.enum(["GENRE", "SET", "OTHER"]).optional(),
          genre: z.string().max(100).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const where: Prisma.FolderWhereInput = { visibility: listableVisibility(Boolean(ctx.session)) };

      if (input?.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { description: { contains: input.search, mode: "insensitive" } },
        ];
      }
      if (input?.type) where.type = input.type;
      if (input?.genre) where.vinyls = { some: { vinyl: { genre: input.genre } } };

      const folders = await prisma.folder.findMany({
        where,
        take: limit + 1,
        ...(input?.cursor && { cursor: { id: input.cursor }, skip: 1 }),
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        include: previewFolderInclude,
      });

      const hasMore = folders.length > limit;
      const items = hasMore ? folders.slice(0, limit) : folders;

      return {
        items: items.map(toPublicPreview),
        nextCursor: hasMore ? items.at(-1)?.id : undefined,
      };
    }),

  publicFoldersPopular: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(10).default(6) }).optional())
    .query(async ({ ctx, input }) => {
      const folders = await prisma.folder.findMany({
        where: { visibility: listableVisibility(Boolean(ctx.session)), viewCount: { gt: 0 } },
        take: input?.limit ?? 6,
        orderBy: { viewCount: "desc" },
        include: previewFolderInclude,
      });
      return folders.map(toPublicPreview);
    }),

  publicFolderDetail: publicProcedure.input(z.object({ id: recordId })).query(async ({ ctx, input }) => {
    const folder = await prisma.folder.findUnique({
      where: { id: input.id },
      include: {
        user: { select: { id: true, name: true, image: true } },
        vinyls: {
          select: {
            vinyl: {
              select: {
                id: true,
                title: true,
                artist: true,
                genre: true,
                style: true,
                coverUrl: true,
                year: true,
                label: true,
                bpm: true,
              },
            },
          },
          orderBy: { position: "asc" },
        },
      },
    });

    if (!folder) throw new TRPCError({ code: "NOT_FOUND", message: "Batea no encontrada" });

    const access = await resolveFolderAccess(folder, ctx);

    if (!access.visible) {
      if (folder.visibility === "ACCOUNT") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Necesitás una cuenta para ver esta batea" });
      }
      throw new TRPCError({ code: "NOT_FOUND", message: "Batea no encontrada" });
    }

    return {
      id: folder.id,
      name: folder.name,
      description: folder.description,
      type: folder.type,
      color: folder.color,
      visibility: folder.visibility,
      viewCount: folder.viewCount,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      user: folder.user,
      hasPassword: folder.password !== null,
      locked: access.locked,
      vinyls: access.locked ? [] : folder.vinyls.map(({ vinyl }) => vinyl),
    };
  }),

  folderUnlock: publicProcedure
    .input(z.object({ id: recordId, password: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const folder = await prisma.folder.findUnique({
        where: { id: input.id },
        select: { id: true, userId: true, visibility: true, password: true },
      });

      const access = folder ? await resolveFolderAccess(folder, ctx) : null;
      if (!folder?.password || !access?.visible) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Batea no encontrada" });
      }

      const [perVisitor, perFolder] = await Promise.all([
        consumeRateLimit(`unlock:${folder.id}:${ctx.ip}`, { limit: 10, windowMs: UNLOCK_WINDOW_MS }),
        consumeRateLimit(`unlock:${folder.id}`, { limit: 100, windowMs: UNLOCK_WINDOW_MS }),
      ]);
      if (!perVisitor || !perFolder) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Demasiados intentos. Probá de nuevo más tarde." });
      }

      if (!(await verifyFolderPassword(input.password, folder.password))) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Contraseña incorrecta" });
      }

      ctx.setCookie(buildUnlockCookie(folder.id, folder.password));
      return { success: true };
    }),

  folderRecordView: publicProcedure.input(z.object({ id: recordId })).mutation(async ({ ctx, input }) => {
    const fresh = await consumeRateLimit(`view:folder:${input.id}:${ctx.ip}`, { limit: 1, windowMs: VIEW_WINDOW_MS });
    if (fresh) {
      // Raw on purpose: a Prisma update would touch `updatedAt`, which orders the public listing.
      await prisma.$executeRaw`UPDATE "Folder" SET "viewCount" = "viewCount" + 1 WHERE "id" = ${input.id} AND "visibility" <> 'PRIVATE'`;
    }
    return { success: true };
  }),

  publicVinylGet: publicProcedure
    .input(z.object({ id: recordId, folderId: recordId }))
    .query(async ({ ctx, input }) => {
      const entry = await prisma.folderVinyl.findUnique({
        where: { folderId_vinylId: { folderId: input.folderId, vinylId: input.id } },
        select: {
          vinyl: { select: publicVinylSelect },
          folder: { select: { id: true, name: true, color: true, userId: true, visibility: true, password: true } },
        },
      });

      const access = entry ? await resolveFolderAccess(entry.folder, ctx) : null;
      if (!entry || !access?.visible || access.locked) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Vinilo no encontrado" });
      }

      const { id, name, color } = entry.folder;
      return { ...entry.vinyl, folder: { id, name, color } };
    }),
});
