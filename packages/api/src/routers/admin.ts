import prisma, { type Prisma } from "@dallateas/db";
import { TRPCError } from "@trpc/server";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";

import { adminProcedure, router } from "../index";
import { recordId, userId } from "../schemas";

export const adminRouter = router({
  adminUpdateUser: adminProcedure
    .input(
      z.object({
        userId,
        name: z.string().trim().min(1).max(100).optional(),
        email: z.string().trim().toLowerCase().email().max(200).optional(),
        password: z.string().min(8).max(128).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const data: Prisma.UserUpdateInput = {};
      if (input.name) data.name = input.name;
      if (input.email) data.email = input.email;

      if (Object.keys(data).length > 0) {
        await prisma.user.update({ where: { id: input.userId }, data });
      }

      if (input.password) {
        // Better Auth owns the hash format; any other hash leaves the account unable to sign in.
        const hash = await hashPassword(input.password);
        await prisma.$transaction([
          prisma.account.updateMany({
            where: { userId: input.userId, providerId: "credential" },
            data: { password: hash },
          }),
          prisma.session.deleteMany({ where: { userId: input.userId } }),
        ]);
      }

      return { success: true };
    }),

  adminGetUser: adminProcedure.input(z.object({ userId })).query(async ({ input }) => {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      include: {
        folders: {
          select: {
            id: true,
            name: true,
            type: true,
            color: true,
            visibility: true,
            viewCount: true,
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
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Usuario no encontrado" });
    return user;
  }),

  adminFolders: adminProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(50).default(20),
          cursor: recordId.optional(),
          search: z.string().trim().max(200).optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const limit = input?.limit ?? 20;
      const where: Prisma.FolderWhereInput = input?.search
        ? {
            OR: [
              { name: { contains: input.search, mode: "insensitive" } },
              { description: { contains: input.search, mode: "insensitive" } },
            ],
          }
        : {};

      const folders = await prisma.folder.findMany({
        where,
        take: limit + 1,
        ...(input?.cursor && { cursor: { id: input.cursor }, skip: 1 }),
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        include: {
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { vinyls: true } },
        },
      });

      const hasMore = folders.length > limit;
      const items = hasMore ? folders.slice(0, limit) : folders;

      return {
        items: items.map((folder) => ({
          id: folder.id,
          name: folder.name,
          description: folder.description,
          type: folder.type,
          color: folder.color,
          visibility: folder.visibility,
          hasPassword: folder.password !== null,
          viewCount: folder.viewCount,
          vinylCount: folder._count.vinyls,
          updatedAt: folder.updatedAt,
          owner: folder.user,
        })),
        nextCursor: hasMore ? items.at(-1)?.id : undefined,
      };
    }),
});
