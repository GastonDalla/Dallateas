import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import prisma from "@dallateas/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";

function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(plain: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const buf = scryptSync(plain, salt, 64);
  return timingSafeEqual(buf, Buffer.from(hash, "hex"));
}

const cuid = z.string().min(1).max(30);

const vinylInput = z.object({
  title: z.string().min(1).max(500).trim(),
  artist: z.string().min(1).max(500).trim(),
  label: z.string().max(500).trim().optional(),
  genre: z.string().max(100).trim().optional(),
  style: z.string().max(200).trim().optional(),
  bpm: z.number().int().positive().max(999).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  discogsId: z.string().max(50).optional(),
  barcode: z.string().max(50).trim().optional(),
  coverUrl: z.string().url().max(2000).optional(),
  notes: z.string().max(5000).trim().optional(),
  mixNotes: z.string().max(5000).trim().optional(),
  pricePaid: z.number().min(0).max(999999).optional(),
});

const trackInput = z.object({
  side: z.string().min(1).max(10).trim(),
  position: z.number().int().min(0),
  title: z.string().min(1).max(500).trim(),
  duration: z.string().max(20).trim().optional(),
});

const folderInput = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
  type: z.enum(["GENRE", "SET", "OTHER"]),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  visibility: z.enum(["PUBLIC", "ACCOUNT", "PRIVATE"]).optional(),
  password: z.string().min(4).max(100).trim().optional().nullable(),
});

const publicFolderSelect = {
  user: { select: { id: true, name: true, image: true } },
  vinyls: {
    include: {
      vinyl: {
        select: { id: true, title: true, artist: true, genre: true, style: true, coverUrl: true, year: true },
      },
    },
    orderBy: { position: "asc" as const },
    take: 4,
  },
  _count: { select: { vinyls: true } },
};

function mapPublicFolder(folder: any) {
  return {
    id: folder.id,
    name: folder.name,
    description: folder.description,
    type: folder.type,
    color: folder.color,
    updatedAt: folder.updatedAt,
    viewCount: folder.viewCount,
    hasPassword: !!folder.password,
    owner: folder.user,
    vinylCount: folder._count.vinyls,
    vinyls: folder.vinyls.map((fv: any) => fv.vinyl),
  };
}

export const appRouter = router({
  healthCheck: publicProcedure.query(() => "OK"),

  publicGenres: publicProcedure.query(async () => {
    const vinyls = await prisma.vinyl.findMany({
      where: { folders: { some: { folder: { visibility: { not: "PRIVATE" } } } } },
      select: { genre: true },
      distinct: ["genre"],
    });
    return vinyls
      .map((v) => v.genre)
      .filter((g): g is string => !!g)
      .sort();
  }),

  publicStats: publicProcedure.query(async () => {
    const [totalVinyls, totalPublicFolders, totalUsers] = await Promise.all([
      prisma.vinyl.count(),
      prisma.folder.count({ where: { visibility: { not: "PRIVATE" } } }),
      prisma.user.count(),
    ]);
    return { totalVinyls, totalPublicFolders, totalUsers };
  }),

  publicFolders: publicProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(50).default(20),
          cursor: cuid.optional(),
          search: z.string().max(200).trim().optional(),
          type: z.enum(["GENRE", "SET", "OTHER"]).optional(),
          genre: z.string().max(100).optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const limit = input?.limit ?? 20;
      const where: Record<string, unknown> = { visibility: { not: "PRIVATE" } };

      if (input?.search) {
        where.OR = [
          { name: { contains: input.search } },
          { description: { contains: input.search } },
        ];
      }
      if (input?.type) {
        where.type = input.type;
      }
      if (input?.genre) {
        where.vinyls = { some: { vinyl: { genre: input.genre } } };
      }

      const folders = await prisma.folder.findMany({
        where,
        take: limit + 1,
        ...(input?.cursor && { cursor: { id: input.cursor }, skip: 1 }),
        orderBy: { updatedAt: "desc" },
        include: publicFolderSelect,
      });

      const hasMore = folders.length > limit;
      const items = hasMore ? folders.slice(0, limit) : folders;

      return {
        items: items.map(mapPublicFolder),
        nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
      };
    }),

  publicFoldersPopular: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(10).default(6) }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit ?? 6;
      const folders = await prisma.folder.findMany({
        where: { visibility: { not: "PRIVATE" }, viewCount: { gt: 0 } },
        take: limit,
        orderBy: { viewCount: "desc" },
        include: publicFolderSelect,
      });
      return folders.map(mapPublicFolder);
    }),

  publicFolderDetail: publicProcedure
    .input(z.object({ id: cuid, password: z.string().max(100).optional() }))
    .query(async ({ ctx, input }) => {
      const folder = await prisma.folder.findFirst({
        where: { id: input.id },
        include: {
          user: { select: { id: true, name: true, image: true } },
          vinyls: {
            include: {
              vinyl: {
                select: {
                  id: true, title: true, artist: true, genre: true, style: true,
                  coverUrl: true, year: true, label: true, bpm: true,
                },
              },
            },
            orderBy: { position: "asc" },
          },
        },
      });

      if (!folder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Batea no encontrada" });
      }

      const userId = ctx.session?.user?.id;
      const isOwner = userId === folder.userId;
      const isAdmin = ctx.session?.user?.role === "admin";

      let isCollaborator = false;
      if (userId && !isOwner && !isAdmin) {
        const collab = await prisma.folderCollaborator.findFirst({
          where: { folderId: folder.id, userId },
        });
        isCollaborator = !!collab;
      }

      const hasAccess = isOwner || isAdmin || isCollaborator;

      if (folder.visibility === "PRIVATE" && !hasAccess) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Batea no encontrada" });
      }
      if (folder.visibility === "ACCOUNT" && !ctx.session && !isAdmin) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Necesitas una cuenta para ver esta batea" });
      }

      const hasPassword = !!folder.password;
      const passwordCorrect = !hasPassword || hasAccess || (!!input.password && verifyPassword(input.password, folder.password!));

      prisma.folder
        .update({ where: { id: input.id }, data: { viewCount: { increment: 1 } } })
        .catch((err) => console.error("[viewCount]", err));

      return {
        ...folder,
        password: undefined,
        hasPassword,
        locked: hasPassword && !passwordCorrect,
        vinyls: passwordCorrect ? folder.vinyls.map((fv) => fv.vinyl) : [],
      };
    }),

  publicVinylGet: publicProcedure
    .input(z.object({ id: cuid, folderId: cuid }))
    .query(async ({ input }) => {
      const fv = await prisma.folderVinyl.findFirst({
        where: {
          vinylId: input.id,
          folderId: input.folderId,
          folder: { visibility: { not: "PRIVATE" } },
        },
        include: {
          vinyl: {
            include: {
              tracks: { orderBy: { position: "asc" as const } },
            },
          },
          folder: { select: { id: true, name: true, color: true } },
        },
      });
      if (!fv) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Vinilo no encontrado" });
      }
      return { ...fv.vinyl, folder: fv.folder };
    }),

  vinylGet: protectedProcedure
    .input(z.object({ id: cuid }))
    .query(async ({ ctx, input }) => {
      const vinyl = await prisma.vinyl.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: {
          folders: { include: { folder: true } },
          tags: { include: { tag: true } },
          tracks: { orderBy: { position: "asc" } },
        },
      });
      if (!vinyl) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Vinilo no encontrado" });
      }
      return vinyl;
    }),

  folderGet: protectedProcedure
    .input(z.object({ id: cuid }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const folder = await prisma.folder.findFirst({
        where: { id: input.id },
        include: {
          vinyls: { include: { vinyl: true }, orderBy: { position: "asc" } },
          _count: { select: { vinyls: true } },
          user: { select: { id: true, name: true } },
        },
      });
      if (!folder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Carpeta no encontrada" });
      }

      const isOwner = folder.userId === userId;
      const isAdmin = ctx.session.user.role === "admin";
      let collaboratorRole: string | null = null;

      if (!isOwner && !isAdmin) {
        const collab = await prisma.folderCollaborator.findFirst({
          where: { folderId: folder.id, userId },
        });
        if (!collab) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Carpeta no encontrada" });
        }
        collaboratorRole = collab.role;
      }

      return {
        ...folder,
        vinyls: folder.vinyls.map((fv) => fv.vinyl),
        isOwner,
        collaboratorRole,
        owner: folder.user,
      };
    }),

  vinylsList: protectedProcedure
    .input(
      z.object({
        search: z.string().max(200).trim().optional(),
        barcode: z.string().max(50).trim().optional(),
        folderId: cuid.optional(),
        genre: z.string().max(100).optional(),
        genres: z.array(z.string().max(100)).max(20).optional(),
        style: z.string().max(100).optional(),
        styles: z.array(z.string().max(100)).max(20).optional(),
        tagId: cuid.optional(),
        tagIds: z.array(cuid).max(20).optional(),
        limit: z.number().int().min(1).max(200).default(100),
        cursor: cuid.optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const limit = input?.limit ?? 100;
      const where: Record<string, unknown> = { userId };
      if (input?.search) {
        where.OR = [
          { title: { contains: input.search } },
          { artist: { contains: input.search } },
          { label: { contains: input.search } },
        ];
      }
      if (input?.folderId) {
        where.folders = { some: { folderId: input.folderId } };
      }
      if (input?.genres && input.genres.length > 0) {
        where.genre = { in: input.genres };
      } else if (input?.genre) {
        where.genre = input.genre;
      }
      if (input?.styles && input.styles.length > 0) {
        where.OR = [...((where.OR as any[]) ?? [])];
        where.AND = input.styles.map((s) => ({ style: { contains: s } }));
      } else if (input?.style) {
        where.style = { contains: input.style };
      }
      if (input?.tagIds && input.tagIds.length > 0) {
        where.tags = { some: { tagId: { in: input.tagIds } } };
      } else if (input?.tagId) {
        where.tags = { some: { tagId: input.tagId } };
      }
      if (input?.barcode) {
        where.barcode = input.barcode;
      }
      const vinyls = await prisma.vinyl.findMany({
        where,
        take: limit + 1,
        ...(input?.cursor && { cursor: { id: input.cursor }, skip: 1 }),
        orderBy: { createdAt: "desc" },
        include: {
          folders: { include: { folder: true } },
          tags: { include: { tag: true } },
        },
      });
      const hasMore = vinyls.length > limit;
      const items = hasMore ? vinyls.slice(0, limit) : vinyls;
      return {
        items,
        nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
      };
    }),

  vinylCheckDuplicate: protectedProcedure
    .input(z.object({
      title: z.string().max(500).trim(),
      artist: z.string().max(500).trim(),
      discogsId: z.string().max(50).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const conditions: Record<string, unknown>[] = [];
      if (input.title && input.artist) {
        conditions.push({ title: input.title, artist: input.artist, userId });
      }
      if (input.discogsId) {
        conditions.push({ discogsId: input.discogsId, userId });
      }
      if (conditions.length === 0) return [];
      const duplicates = await prisma.vinyl.findMany({
        where: { OR: conditions },
        select: { id: true, title: true, artist: true, coverUrl: true },
        take: 5,
      });
      return duplicates;
    }),

  vinylCreate: protectedProcedure
    .input(vinylInput.extend({
      folderIds: z.array(cuid).max(50).optional(),
      tagNames: z.array(z.string().min(1).max(50).trim()).max(20).optional(),
      tracks: z.array(trackInput).max(200).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { folderIds, tagNames, tracks, ...data } = input;
      if (folderIds && folderIds.length > 0) {
        const owned = await prisma.folder.count({ where: { id: { in: folderIds }, userId } });
        if (owned !== folderIds.length) {
          throw new TRPCError({ code: "FORBIDDEN", message: "No podes agregar vinilos a carpetas que no son tuyas" });
        }
      }
      return prisma.$transaction(async (tx) => {
        const vinyl = await tx.vinyl.create({
          data: {
            ...data,
            userId,
            folders: folderIds && folderIds.length > 0
              ? { create: folderIds.map((folderId, i) => ({ folderId, position: i })) }
              : undefined,
          },
        });
        if (tagNames && tagNames.length > 0) {
          for (const name of tagNames) {
            const tag = await tx.tag.upsert({
              where: { name_userId: { name, userId } },
              create: { name, userId },
              update: {},
            });
            await tx.vinylTag.create({ data: { vinylId: vinyl.id, tagId: tag.id } });
          }
        }
        if (tracks && tracks.length > 0) {
          await tx.vinylTrack.createMany({
            data: tracks.map((t) => ({ ...t, vinylId: vinyl.id })),
          });
        }
        return vinyl;
      });
    }),

  vinylUpdate: protectedProcedure
    .input(vinylInput.extend({
      id: cuid,
      folderIds: z.array(cuid).max(50).optional(),
      tagNames: z.array(z.string().min(1).max(50).trim()).max(20).optional(),
      tracks: z.array(trackInput).max(200).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id, folderIds, tagNames, tracks, ...data } = input;
      const vinyl = await prisma.vinyl.findFirst({ where: { id, userId } });
      if (!vinyl) throw new TRPCError({ code: "NOT_FOUND", message: "Vinilo no encontrado" });
      if (folderIds && folderIds.length > 0) {
        const owned = await prisma.folder.count({ where: { id: { in: folderIds }, userId } });
        if (owned !== folderIds.length) {
          throw new TRPCError({ code: "FORBIDDEN", message: "No podes agregar vinilos a carpetas que no son tuyas" });
        }
      }
      return prisma.$transaction(async (tx) => {
        const updated = await tx.vinyl.update({ where: { id }, data });
        if (folderIds) {
          await tx.folderVinyl.deleteMany({ where: { vinylId: id } });
          if (folderIds.length > 0) {
            await tx.folderVinyl.createMany({
              data: folderIds.map((folderId, i) => ({ folderId, vinylId: id, position: i })),
            });
          }
        }
        if (tagNames !== undefined) {
          await tx.vinylTag.deleteMany({ where: { vinylId: id } });
          for (const name of tagNames) {
            const tag = await tx.tag.upsert({
              where: { name_userId: { name, userId } },
              create: { name, userId },
              update: {},
            });
            await tx.vinylTag.create({ data: { vinylId: id, tagId: tag.id } });
          }
        }
        if (tracks !== undefined) {
          await tx.vinylTrack.deleteMany({ where: { vinylId: id } });
          if (tracks.length > 0) {
            await tx.vinylTrack.createMany({
              data: tracks.map((t) => ({ ...t, vinylId: id })),
            });
          }
        }
        return updated;
      });
    }),

  vinylDelete: protectedProcedure
    .input(z.object({ id: cuid }))
    .mutation(async ({ ctx, input }) => {
      const vinyl = await prisma.vinyl.findFirst({ where: { id: input.id, userId: ctx.session.user.id } });
      if (!vinyl) throw new TRPCError({ code: "NOT_FOUND", message: "Vinilo no encontrado" });
      await prisma.vinyl.delete({ where: { id: input.id } });
      return { success: true };
    }),

  foldersList: protectedProcedure.query(async ({ ctx }) => {
    return prisma.folder.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      include: { _count: { select: { vinyls: true } } },
    });
  }),

  folderCreate: protectedProcedure
    .input(folderInput)
    .mutation(async ({ ctx, input }) => {
      const count = await prisma.folder.count({ where: { userId: ctx.session.user.id } });
      const { password, ...rest } = input;
      return prisma.folder.create({
        data: {
          ...rest,
          password: password ? hashPassword(password) : null,
          userId: ctx.session.user.id,
          position: count,
        },
      });
    }),

  folderUpdate: protectedProcedure
    .input(folderInput.extend({ id: cuid }))
    .mutation(async ({ ctx, input }) => {
      const { id, password, ...rest } = input;
      const folder = await prisma.folder.findFirst({ where: { id, userId: ctx.session.user.id } });
      if (!folder) throw new TRPCError({ code: "NOT_FOUND", message: "Carpeta no encontrada" });
      return prisma.folder.update({
        where: { id },
        data: {
          ...rest,
          password: password === null ? null : password ? hashPassword(password) : undefined,
        },
      });
    }),

  folderDelete: protectedProcedure
    .input(z.object({ id: cuid }))
    .mutation(async ({ ctx, input }) => {
      const folder = await prisma.folder.findFirst({ where: { id: input.id, userId: ctx.session.user.id } });
      if (!folder) throw new TRPCError({ code: "NOT_FOUND", message: "Carpeta no encontrada" });
      await prisma.folder.delete({ where: { id: input.id } });
      return { success: true };
    }),

  folderSetVisibility: protectedProcedure
    .input(z.object({
      id: cuid,
      visibility: z.enum(["PUBLIC", "ACCOUNT", "PRIVATE"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const folder = await prisma.folder.findFirst({ where: { id: input.id, userId: ctx.session.user.id } });
      if (!folder) throw new TRPCError({ code: "NOT_FOUND", message: "Carpeta no encontrada" });
      return prisma.folder.update({
        where: { id: input.id },
        data: {
          visibility: input.visibility,
          password: input.visibility === "PRIVATE" ? null : undefined,
        },
      });
    }),

  folderReorder: protectedProcedure
    .input(z.object({ folderOrder: z.array(cuid).max(200) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const owned = await prisma.folder.count({ where: { id: { in: input.folderOrder }, userId } });
      if (owned !== input.folderOrder.length) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No podes reordenar carpetas que no son tuyas" });
      }
      await prisma.$transaction(
        input.folderOrder.map((id, i) => prisma.folder.update({ where: { id }, data: { position: i } })),
      );
      return { success: true };
    }),

  folderReorderVinyls: protectedProcedure
    .input(z.object({ folderId: cuid, vinylOrder: z.array(cuid).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const folder = await prisma.folder.findFirst({ where: { id: input.folderId, userId: ctx.session.user.id } });
      if (!folder) throw new TRPCError({ code: "NOT_FOUND", message: "Carpeta no encontrada" });
      await prisma.$transaction(
        input.vinylOrder.map((vinylId, i) =>
          prisma.folderVinyl.updateMany({ where: { folderId: input.folderId, vinylId }, data: { position: i } }),
        ),
      );
      return { success: true };
    }),

  folderInvite: protectedProcedure
    .input(z.object({
      folderId: cuid,
      email: z.string().email(),
      role: z.enum(["VIEWER", "CONTRIBUTOR", "EDITOR", "ADMIN"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const folder = await prisma.folder.findFirst({ where: { id: input.folderId, userId: ctx.session.user.id } });
      if (!folder) throw new TRPCError({ code: "NOT_FOUND", message: "Carpeta no encontrada" });
      const invitee = await prisma.user.findFirst({ where: { email: input.email } });
      if (!invitee || invitee.id === ctx.session.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No se pudo enviar la invitacion" });
      }
      return prisma.folderCollaborator.upsert({
        where: { folderId_userId: { folderId: input.folderId, userId: invitee.id } },
        create: { folderId: input.folderId, userId: invitee.id, role: input.role },
        update: { role: input.role },
      });
    }),

  folderRemoveCollaborator: protectedProcedure
    .input(z.object({ folderId: cuid, userId: cuid }))
    .mutation(async ({ ctx, input }) => {
      const folder = await prisma.folder.findFirst({ where: { id: input.folderId, userId: ctx.session.user.id } });
      if (!folder) throw new TRPCError({ code: "NOT_FOUND", message: "Carpeta no encontrada" });
      await prisma.folderCollaborator.deleteMany({ where: { folderId: input.folderId, userId: input.userId } });
      return { success: true };
    }),

  folderUpdateCollaboratorRole: protectedProcedure
    .input(z.object({
      folderId: cuid,
      userId: cuid,
      role: z.enum(["VIEWER", "CONTRIBUTOR", "EDITOR", "ADMIN"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const folder = await prisma.folder.findFirst({ where: { id: input.folderId, userId: ctx.session.user.id } });
      if (!folder) throw new TRPCError({ code: "NOT_FOUND", message: "Carpeta no encontrada" });
      return prisma.folderCollaborator.updateMany({
        where: { folderId: input.folderId, userId: input.userId },
        data: { role: input.role },
      });
    }),

  folderCollaborators: protectedProcedure
    .input(z.object({ folderId: cuid }))
    .query(async ({ ctx, input }) => {
      const folder = await prisma.folder.findFirst({ where: { id: input.folderId, userId: ctx.session.user.id } });
      if (!folder) throw new TRPCError({ code: "NOT_FOUND", message: "Carpeta no encontrada" });
      return prisma.folderCollaborator.findMany({
        where: { folderId: input.folderId },
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      });
    }),

  myCollaborations: protectedProcedure.query(async ({ ctx }) => {
    return prisma.folderCollaborator.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        folder: {
          include: {
            user: { select: { id: true, name: true } },
            _count: { select: { vinyls: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  tagsList: protectedProcedure.query(async ({ ctx }) => {
    return prisma.tag.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { name: "asc" },
      include: { _count: { select: { vinyls: true } } },
    });
  }),

  tagCreate: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(50).trim() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return prisma.tag.upsert({
        where: { name_userId: { name: input.name, userId } },
        create: { name: input.name, userId },
        update: {},
      });
    }),

  tagDelete: protectedProcedure
    .input(z.object({ id: cuid }))
    .mutation(async ({ ctx, input }) => {
      const tag = await prisma.tag.findFirst({ where: { id: input.id, userId: ctx.session.user.id } });
      if (!tag) throw new TRPCError({ code: "NOT_FOUND", message: "Tag no encontrado" });
      await prisma.tag.delete({ where: { id: input.id } });
      return { success: true };
    }),

  tagRename: protectedProcedure
    .input(z.object({ id: cuid, name: z.string().min(1).max(50).trim() }))
    .mutation(async ({ ctx, input }) => {
      const tag = await prisma.tag.findFirst({ where: { id: input.id, userId: ctx.session.user.id } });
      if (!tag) throw new TRPCError({ code: "NOT_FOUND", message: "Tag no encontrado" });
      return prisma.tag.update({ where: { id: input.id }, data: { name: input.name } });
    }),

  vinylBulkCreate: protectedProcedure
    .input(z.object({
      vinyls: z.array(vinylInput).min(1).max(500),
      folderId: cuid.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      if (input.folderId) {
        const folder = await prisma.folder.findFirst({ where: { id: input.folderId, userId } });
        if (!folder) throw new TRPCError({ code: "NOT_FOUND", message: "Carpeta no encontrada" });
      }
      const created = await prisma.$transaction(
        input.vinyls.map((v, i) =>
          prisma.vinyl.create({
            data: {
              ...v,
              userId,
              folders: input.folderId
                ? { create: { folderId: input.folderId, position: i } }
                : undefined,
            },
          }),
        ),
      );
      return { count: created.length };
    }),

  userGenres: protectedProcedure.query(async ({ ctx }) => {
    const vinyls = await prisma.vinyl.findMany({
      where: { userId: ctx.session.user.id },
      select: { genre: true },
      distinct: ["genre"],
    });
    return vinyls
      .map((v) => v.genre)
      .filter((g): g is string => !!g)
      .sort();
  }),

  userStyles: protectedProcedure.query(async ({ ctx }) => {
    const vinyls = await prisma.vinyl.findMany({
      where: { userId: ctx.session.user.id, style: { not: null } },
      select: { style: true },
    });
    const styles = new Set<string>();
    for (const v of vinyls) {
      if (v.style) {
        for (const s of v.style.split(",")) {
          const trimmed = s.trim();
          if (trimmed) styles.add(trimmed);
        }
      }
    }
    return [...styles].sort();
  }),

  djProfileGet: protectedProcedure.query(async ({ ctx }) => {
    const profile = await prisma.djProfile.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        featuredVinyl: { select: { id: true, title: true, artist: true, coverUrl: true, genre: true, style: true } },
        gigs: { orderBy: { date: "asc" } },
      },
    });
    if (!profile) return null;

    let socialLinks: { platform: string; url: string; label?: string }[] = [];
    let youtubeVideos: string[] = [];
    let spotifyTracks: string[] = [];
    let mixes: { title: string; url: string }[] = [];
    try { if (profile.socialLinks) socialLinks = JSON.parse(profile.socialLinks); } catch {}
    try { if (profile.youtubeVideos) youtubeVideos = JSON.parse(profile.youtubeVideos); } catch {}
    try { if (profile.spotifyTracks) spotifyTracks = JSON.parse(profile.spotifyTracks); } catch {}
    try { if (profile.mixes) mixes = JSON.parse(profile.mixes); } catch {}

    return {
      id: profile.id,
      userId: profile.userId,
      slug: profile.slug,
      bio: profile.bio,
      location: profile.location,
      isPublic: profile.isPublic,
      viewCount: profile.viewCount,
      showViewCount: profile.showViewCount,
      genres: profile.genres,
      youtubeLayout: profile.youtubeLayout,
      spotifyLayout: profile.spotifyLayout,
      mixesLayout: profile.mixesLayout,
      featuredVinylId: profile.featuredVinylId,
      featuredVinyl: profile.featuredVinyl,
      featuredMixUrl: profile.featuredMixUrl,
      featuredMixTitle: profile.featuredMixTitle,
      bookingEmail: profile.bookingEmail,
      bookingPhone: profile.bookingPhone,
      bookingInfo: profile.bookingInfo,
      pressKitUrl: profile.pressKitUrl,
      websiteUrl: profile.websiteUrl,
      gigs: profile.gigs,
      socialLinks,
      youtubeVideos,
      spotifyTracks,
      mixes,
    };
  }),

  djProfileCheckSlug: protectedProcedure
    .input(z.object({ slug: z.string().min(3).max(50).regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, "Solo letras minusculas, numeros y guiones") }))
    .query(async ({ ctx, input }) => {
      const existing = await prisma.djProfile.findUnique({ where: { slug: input.slug } });
      return { available: !existing || existing.userId === ctx.session.user.id };
    }),

  djProfileUpdate: protectedProcedure
    .input(z.object({
      slug: z.string().min(3).max(50).regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, "Solo letras minusculas, numeros y guiones").optional(),
      bio: z.string().max(1000).trim().optional(),
      location: z.string().max(200).trim().optional(),
      isPublic: z.boolean().optional(),
      genres: z.string().max(500).trim().optional(),
      socialLinks: z.array(z.object({
        platform: z.string().max(50),
        url: z.string().max(500).trim(),
        label: z.string().max(50).trim().optional(),
      })).max(15).optional(),
      youtubeVideos: z.array(z.string().max(500).trim()).max(10).optional(),
      youtubeLayout: z.enum(["slider", "card"]).optional(),
      showViewCount: z.boolean().optional(),
      spotifyTracks: z.array(z.string().max(500).trim()).max(10).optional(),
      spotifyLayout: z.enum(["slider", "card"]).optional(),
      featuredVinylId: z.string().max(50).optional().nullable(),
      featuredMixUrl: z.string().max(500).trim().optional().or(z.literal("")),
      featuredMixTitle: z.string().max(200).trim().optional().or(z.literal("")),
      mixes: z.array(z.object({
        title: z.string().max(200).trim(),
        url: z.string().max(500).trim(),
      })).max(20).optional(),
      mixesLayout: z.enum(["slider", "card"]).optional(),
      bookingEmail: z.string().max(200).trim().optional().or(z.literal("")),
      bookingPhone: z.string().max(50).trim().optional().or(z.literal("")),
      bookingInfo: z.string().max(500).trim().optional().or(z.literal("")),
      pressKitUrl: z.string().max(500).trim().optional().or(z.literal("")),
      websiteUrl: z.string().max(500).trim().optional().or(z.literal("")),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      if (input.slug) {
        const existing = await prisma.djProfile.findUnique({ where: { slug: input.slug } });
        if (existing && existing.userId !== userId) {
          throw new TRPCError({ code: "CONFLICT", message: "Ese slug ya esta en uso" });
        }
      }

      if (input.featuredVinylId) {
        const vinyl = await prisma.vinyl.findFirst({
          where: { id: input.featuredVinylId, userId },
        });
        if (!vinyl) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Vinilo no encontrado en tu coleccion" });
        }
      }

      const profileData = {
        slug: input.slug || null,
        bio: input.bio || null,
        location: input.location || null,
        isPublic: input.isPublic ?? false,
        showViewCount: input.showViewCount ?? true,
        genres: input.genres || null,
        socialLinks: input.socialLinks ? JSON.stringify(input.socialLinks) : null,
        youtubeVideos: input.youtubeVideos ? JSON.stringify(input.youtubeVideos) : null,
        youtubeLayout: input.youtubeLayout ?? "card",
        spotifyTracks: input.spotifyTracks ? JSON.stringify(input.spotifyTracks) : null,
        spotifyLayout: input.spotifyLayout ?? "card",
        featuredVinylId: input.featuredVinylId || null,
        featuredMixUrl: input.featuredMixUrl || null,
        featuredMixTitle: input.featuredMixTitle || null,
        mixes: input.mixes ? JSON.stringify(input.mixes) : null,
        mixesLayout: input.mixesLayout ?? "card",
        bookingEmail: input.bookingEmail || null,
        bookingPhone: input.bookingPhone || null,
        bookingInfo: input.bookingInfo || null,
        pressKitUrl: input.pressKitUrl || null,
        websiteUrl: input.websiteUrl || null,
      };

      const existing = await prisma.djProfile.findUnique({ where: { userId } });

      if (existing) {
        return prisma.djProfile.update({
          where: { userId },
          data: profileData,
        });
      }

      return prisma.djProfile.create({
        data: { userId, ...profileData },
      });
    }),

  djProfilePublic: publicProcedure
    .input(z.object({
      slug: z.string().min(1).max(100),
    }))
    .query(async ({ ctx, input }) => {
      const viewerId = (ctx as any).session?.user?.id as string | undefined;
      const profileInclude = {
        user: {
          select: {
            id: true, name: true, username: true, displayUsername: true, image: true, createdAt: true,
            folders: {
              where: { visibility: "PUBLIC" as const },
              select: {
                id: true, name: true, type: true, color: true, viewCount: true,
                _count: { select: { vinyls: true } },
              },
              orderBy: { position: "asc" as const },
            },
          },
        },
        featuredVinyl: {
          select: { id: true, title: true, artist: true, coverUrl: true, genre: true, style: true, year: true, label: true },
        },
        gigs: {
          where: { date: { gte: new Date() } },
          orderBy: { date: "asc" as const },
          take: 20,
        },
      } as const;

      let profile = await prisma.djProfile.findFirst({
        where: { slug: input.slug },
        include: profileInclude,
      });

      if (!profile) {
        const user = await prisma.user.findFirst({
          where: { username: input.slug },
          select: { id: true },
        });
        if (user) {
          profile = await prisma.djProfile.findUnique({
            where: { userId: user.id },
            include: profileInclude,
          });
        }
      }

      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Perfil no encontrado" });
      }

      const isOwner = viewerId === profile.userId;
      const isAdmin = viewerId ? await prisma.user.findFirst({ where: { id: viewerId, role: "admin" } }) : null;

      if (!profile.isPublic && !isOwner && !isAdmin) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Perfil no encontrado" });
      }

      if (!isOwner) {
        prisma.djProfile.update({
          where: { id: profile.id },
          data: { viewCount: { increment: 1 } },
        }).catch(() => {});
      }

      const user = profile.user;
      return {
        name: user.name,
        username: user.displayUsername ?? user.username ?? profile.slug ?? input.slug,
        image: user.image,
        memberSince: user.createdAt,
        bio: profile.bio,
        location: profile.location,
        genres: profile.genres,
        viewCount: profile.showViewCount ? profile.viewCount : null,
        socialLinks: (() => { try { return profile.socialLinks ? JSON.parse(profile.socialLinks) : []; } catch { return []; } })() as { platform: string; url: string; label?: string }[],
        youtubeVideos: (() => { try { return profile.youtubeVideos ? JSON.parse(profile.youtubeVideos) : []; } catch { return []; } })() as string[],
        youtubeLayout: (profile.youtubeLayout || "card") as "slider" | "card",
        spotifyTracks: (() => { try { return profile.spotifyTracks ? JSON.parse(profile.spotifyTracks) : []; } catch { return []; } })() as string[],
        spotifyLayout: (profile.spotifyLayout || "card") as "slider" | "card",
        featuredVinyl: profile.featuredVinyl,
        featuredMixUrl: profile.featuredMixUrl,
        featuredMixTitle: profile.featuredMixTitle,
        mixes: (() => { try { return profile.mixes ? JSON.parse(profile.mixes) : []; } catch { return []; } })() as { title: string; url: string }[],
        mixesLayout: (profile.mixesLayout || "card") as "slider" | "card",
        bookingEmail: profile.bookingEmail,
        bookingPhone: profile.bookingPhone,
        bookingInfo: profile.bookingInfo,
        pressKitUrl: profile.pressKitUrl,
        websiteUrl: profile.websiteUrl,
        gigs: (profile as any).gigs ?? [],
        folders: user.folders,
      };
    }),

  djProfileAddMedia: protectedProcedure
    .input(z.object({
      type: z.enum(["youtube", "spotify"]),
      url: z.string().min(1).max(500).trim(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const profile = await prisma.djProfile.findUnique({ where: { userId } });
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Crea tu perfil DJ primero" });

      const field = input.type === "youtube" ? "youtubeVideos" : "spotifyTracks";
      const current: string[] = profile[field] ? JSON.parse(profile[field] as string) : [];

      if (current.length >= 10) throw new TRPCError({ code: "BAD_REQUEST", message: "Maximo 10 items" });
      if (current.includes(input.url)) throw new TRPCError({ code: "BAD_REQUEST", message: "Ya existe ese link" });

      current.push(input.url);
      await prisma.djProfile.update({
        where: { userId },
        data: { [field]: JSON.stringify(current) },
      });
      return current;
    }),

  djProfileRemoveMedia: protectedProcedure
    .input(z.object({
      type: z.enum(["youtube", "spotify"]),
      index: z.number().int().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const profile = await prisma.djProfile.findUnique({ where: { userId } });
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });

      const field = input.type === "youtube" ? "youtubeVideos" : "spotifyTracks";
      const current: string[] = profile[field] ? JSON.parse(profile[field] as string) : [];

      current.splice(input.index, 1);
      await prisma.djProfile.update({
        where: { userId },
        data: { [field]: JSON.stringify(current) },
      });
      return current;
    }),

  djGigCreate: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(200).trim(),
      venue: z.string().max(200).trim().optional(),
      city: z.string().max(100).trim().optional(),
      date: z.string().min(1),
      endDate: z.string().optional(),
      ticketUrl: z.string().max(500).trim().optional(),
      description: z.string().max(500).trim().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profile = await prisma.djProfile.findUnique({ where: { userId: ctx.session.user.id } });
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Crea tu perfil DJ primero" });
      return prisma.djGig.create({
        data: {
          profileId: profile.id,
          name: input.name,
          venue: input.venue || null,
          city: input.city || null,
          date: new Date(input.date),
          endDate: input.endDate ? new Date(input.endDate) : null,
          ticketUrl: input.ticketUrl || null,
          description: input.description || null,
        },
      });
    }),

  djGigDelete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const gig = await prisma.djGig.findUnique({
        where: { id: input.id },
        include: { profile: { select: { userId: true } } },
      });
      if (!gig || gig.profile.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return prisma.djGig.delete({ where: { id: input.id } });
    }),

  collectionStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const vinyls = await prisma.vinyl.findMany({
      where: { userId },
      select: { genre: true, year: true, bpm: true, label: true, pricePaid: true },
    });

    const genres: Record<string, number> = {};
    const decades: Record<string, number> = {};
    const labels: Record<string, number> = {};
    let bpmSum = 0;
    let bpmCount = 0;
    let totalValue = 0;
    let pricedCount = 0;

    for (const v of vinyls) {
      if (v.genre) genres[v.genre] = (genres[v.genre] ?? 0) + 1;
      if (v.year) {
        const decade = `${Math.floor(v.year / 10) * 10}s`;
        decades[decade] = (decades[decade] ?? 0) + 1;
      }
      if (v.label) labels[v.label] = (labels[v.label] ?? 0) + 1;
      if (v.bpm) { bpmSum += v.bpm; bpmCount++; }
      if (v.pricePaid != null) { totalValue += v.pricePaid; pricedCount++; }
    }

    const sortDesc = (obj: Record<string, number>) =>
      Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 10);

    return {
      totalVinyls: vinyls.length,
      avgBpm: bpmCount > 0 ? Math.round(bpmSum / bpmCount) : null,
      totalValue: pricedCount > 0 ? Math.round(totalValue * 100) / 100 : null,
      avgPrice: pricedCount > 0 ? Math.round((totalValue / pricedCount) * 100) / 100 : null,
      pricedCount,
      topGenres: sortDesc(genres),
      topDecades: sortDesc(decades),
      topLabels: sortDesc(labels),
    };
  }),

  adminUpdateUser: protectedProcedure
    .input(z.object({
      userId: z.string().min(1),
      name: z.string().min(1).max(100).trim().optional(),
      email: z.string().email().max(200).trim().optional(),
      password: z.string().min(8).max(128).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Solo admins" });
      }
      const data: Record<string, unknown> = {};
      if (input.name) data.name = input.name;
      if (input.email) data.email = input.email;

      if (Object.keys(data).length > 0) {
        await prisma.user.update({ where: { id: input.userId }, data });
      }

      if (input.password) {
        const { scryptSync, randomBytes } = await import("crypto");
        const salt = randomBytes(16).toString("hex");
        const hash = scryptSync(input.password, salt, 64).toString("hex");
        const hashedPassword = `${salt}:${hash}`;
        await prisma.account.updateMany({
          where: { userId: input.userId, providerId: "credential" },
          data: { password: hashedPassword },
        });
      }

      return { success: true };
    }),

  adminGetUser: protectedProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Solo admins" });
      }
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        include: {
          folders: {
            select: {
              id: true, name: true, type: true, color: true, visibility: true, viewCount: true,
              _count: { select: { vinyls: true, collaborators: true } },
            },
            orderBy: { position: "asc" },
          },
          vinyls: {
            select: { id: true, title: true, artist: true, genre: true, coverUrl: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 50,
          },
          _count: { select: { vinyls: true, folders: true } },
        },
      });
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return user;
    }),

  adminFolders: protectedProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(50).default(20),
      cursor: cuid.optional(),
      search: z.string().max(200).trim().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Solo admins" });
      }
      const limit = input?.limit ?? 20;
      const where: Record<string, unknown> = {};
      if (input?.search) {
        where.OR = [
          { name: { contains: input.search } },
          { description: { contains: input.search } },
        ];
      }
      const folders = await prisma.folder.findMany({
        where,
        take: limit + 1,
        ...(input?.cursor && { cursor: { id: input.cursor }, skip: 1 }),
        orderBy: { updatedAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { vinyls: true } },
        },
      });
      const hasMore = folders.length > limit;
      const items = hasMore ? folders.slice(0, limit) : folders;
      return {
        items: items.map((f) => ({
          id: f.id,
          name: f.name,
          description: f.description,
          type: f.type,
          color: f.color,
          visibility: f.visibility,
          hasPassword: !!f.password,
          viewCount: f.viewCount,
          vinylCount: f._count.vinyls,
          updatedAt: f.updatedAt,
          owner: f.user,
        })),
        nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
      };
    }),
});

export type AppRouter = typeof appRouter;
