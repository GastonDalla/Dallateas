import prisma, { type Prisma } from "@dallateas/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { consumeRateLimit } from "../rate-limit";
import { recordId, tagName, trackInput, vinylInput } from "../schemas";

const folderSummary = {
  select: { folder: { select: { id: true, name: true, type: true, color: true } } },
} satisfies Prisma.Vinyl$foldersArgs;

const relations = {
  folderIds: z.array(recordId).max(50).optional(),
  tagNames: z.array(tagName).max(20).optional(),
  tracks: z.array(trackInput).max(200).optional(),
};

async function assertOwnsFolders(userId: string, folderIds: string[] | undefined) {
  if (!folderIds?.length) return;
  const owned = await prisma.folder.count({ where: { id: { in: folderIds }, userId } });
  if (owned !== new Set(folderIds).size) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No podés agregar vinilos a carpetas que no son tuyas" });
  }
}

/** Adds a record at the end of each folder, keeping the order the DJ already set. */
async function appendToFolders(tx: Prisma.TransactionClient, vinylId: string, folderIds: string[]) {
  for (const folderId of folderIds) {
    const { _max } = await tx.folderVinyl.aggregate({ where: { folderId }, _max: { position: true } });
    await tx.folderVinyl.create({ data: { folderId, vinylId, position: (_max.position ?? -1) + 1 } });
  }
}

async function syncFolders(tx: Prisma.TransactionClient, vinylId: string, folderIds: string[]) {
  const wanted = [...new Set(folderIds)];
  const current = await tx.folderVinyl.findMany({ where: { vinylId }, select: { folderId: true } });
  const existing = new Set(current.map(({ folderId }) => folderId));

  await tx.folderVinyl.deleteMany({ where: { vinylId, folderId: { notIn: wanted } } });
  await appendToFolders(
    tx,
    vinylId,
    wanted.filter((folderId) => !existing.has(folderId)),
  );
}

async function attachTags(tx: Prisma.TransactionClient, vinylId: string, userId: string, names: string[]) {
  for (const name of new Set(names)) {
    const tag = await tx.tag.upsert({
      where: { name_userId: { name, userId } },
      create: { name, userId },
      update: {},
    });
    await tx.vinylTag.create({ data: { vinylId, tagId: tag.id } });
  }
}

export const vinylRouter = router({
  vinylGet: protectedProcedure.input(z.object({ id: recordId })).query(async ({ ctx, input }) => {
    const vinyl = await prisma.vinyl.findFirst({
      where: { id: input.id, userId: ctx.session.user.id },
      include: {
        folders: folderSummary,
        tags: { include: { tag: true } },
        tracks: { orderBy: { position: "asc" } },
      },
    });
    if (!vinyl) throw new TRPCError({ code: "NOT_FOUND", message: "Vinilo no encontrado" });
    return vinyl;
  }),

  vinylsList: protectedProcedure
    .input(
      z
        .object({
          search: z.string().trim().max(200).optional(),
          barcode: z.string().trim().max(50).optional(),
          folderId: recordId.optional(),
          genre: z.string().max(100).optional(),
          genres: z.array(z.string().max(100)).max(20).optional(),
          style: z.string().max(100).optional(),
          styles: z.array(z.string().max(100)).max(20).optional(),
          tagId: recordId.optional(),
          tagIds: z.array(recordId).max(20).optional(),
          limit: z.number().int().min(1).max(200).default(100),
          cursor: recordId.optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 100;
      const where: Prisma.VinylWhereInput = { userId: ctx.session.user.id };

      if (input?.search) {
        where.OR = [
          { title: { contains: input.search, mode: "insensitive" } },
          { artist: { contains: input.search, mode: "insensitive" } },
          { label: { contains: input.search, mode: "insensitive" } },
        ];
      }
      if (input?.folderId) where.folders = { some: { folderId: input.folderId } };

      if (input?.genres?.length) where.genre = { in: input.genres };
      else if (input?.genre) where.genre = input.genre;

      if (input?.styles?.length) where.AND = input.styles.map((style) => ({ style: { contains: style } }));
      else if (input?.style) where.style = { contains: input.style };

      if (input?.tagIds?.length) where.tags = { some: { tagId: { in: input.tagIds } } };
      else if (input?.tagId) where.tags = { some: { tagId: input.tagId } };

      if (input?.barcode) where.barcode = input.barcode;

      const vinyls = await prisma.vinyl.findMany({
        where,
        take: limit + 1,
        ...(input?.cursor && { cursor: { id: input.cursor }, skip: 1 }),
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: {
          folders: folderSummary,
          tags: { include: { tag: true } },
        },
      });

      const hasMore = vinyls.length > limit;
      const items = hasMore ? vinyls.slice(0, limit) : vinyls;
      return { items, nextCursor: hasMore ? items.at(-1)?.id : undefined };
    }),

  vinylCheckDuplicate: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().max(500),
        artist: z.string().trim().max(500),
        discogsId: z.string().max(50).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const conditions: Prisma.VinylWhereInput[] = [];
      if (input.title && input.artist) conditions.push({ title: input.title, artist: input.artist, userId });
      if (input.discogsId) conditions.push({ discogsId: input.discogsId, userId });
      if (conditions.length === 0) return [];

      return prisma.vinyl.findMany({
        where: { OR: conditions },
        select: { id: true, title: true, artist: true, coverUrl: true },
        take: 5,
      });
    }),

  vinylCreate: protectedProcedure
    .input(vinylInput.extend(relations))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { folderIds, tagNames, tracks, ...data } = input;
      await assertOwnsFolders(userId, folderIds);

      return prisma.$transaction(async (tx) => {
        const vinyl = await tx.vinyl.create({ data: { ...data, userId } });
        if (folderIds?.length) await appendToFolders(tx, vinyl.id, [...new Set(folderIds)]);
        if (tagNames?.length) await attachTags(tx, vinyl.id, userId, tagNames);
        if (tracks?.length) {
          await tx.vinylTrack.createMany({ data: tracks.map((track) => ({ ...track, vinylId: vinyl.id })) });
        }
        return vinyl;
      });
    }),

  vinylUpdate: protectedProcedure
    .input(vinylInput.extend({ id: recordId, ...relations }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id, folderIds, tagNames, tracks, ...data } = input;

      const vinyl = await prisma.vinyl.findFirst({ where: { id, userId }, select: { id: true } });
      if (!vinyl) throw new TRPCError({ code: "NOT_FOUND", message: "Vinilo no encontrado" });
      await assertOwnsFolders(userId, folderIds);

      return prisma.$transaction(async (tx) => {
        const updated = await tx.vinyl.update({ where: { id }, data });
        if (folderIds) await syncFolders(tx, id, folderIds);
        if (tagNames) {
          await tx.vinylTag.deleteMany({ where: { vinylId: id } });
          await attachTags(tx, id, userId, tagNames);
        }
        if (tracks) {
          await tx.vinylTrack.deleteMany({ where: { vinylId: id } });
          if (tracks.length > 0) {
            await tx.vinylTrack.createMany({ data: tracks.map((track) => ({ ...track, vinylId: id })) });
          }
        }
        return updated;
      });
    }),

  vinylDelete: protectedProcedure.input(z.object({ id: recordId })).mutation(async ({ ctx, input }) => {
    const { count } = await prisma.vinyl.deleteMany({ where: { id: input.id, userId: ctx.session.user.id } });
    if (count === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Vinilo no encontrado" });
    return { success: true };
  }),

  vinylBulkCreate: protectedProcedure
    .input(z.object({ vinyls: z.array(vinylInput).min(1).max(500), folderId: recordId.optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      await assertOwnsFolders(userId, input.folderId ? [input.folderId] : undefined);

      const allowed = await consumeRateLimit(`bulk:${userId}`, { limit: 30, windowMs: 60 * 60 * 1000 });
      if (!allowed) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Demasiadas importaciones. Probá de nuevo en un rato." });
      }

      return prisma.$transaction(async (tx) => {
        const created = await tx.vinyl.createManyAndReturn({
          data: input.vinyls.map((vinyl) => ({ ...vinyl, userId })),
          select: { id: true },
        });

        if (input.folderId) {
          const { folderId } = input;
          const { _max } = await tx.folderVinyl.aggregate({ where: { folderId }, _max: { position: true } });
          const start = (_max.position ?? -1) + 1;
          await tx.folderVinyl.createMany({
            data: created.map(({ id }, index) => ({ folderId, vinylId: id, position: start + index })),
          });
        }

        return { count: created.length };
      });
    }),
});
