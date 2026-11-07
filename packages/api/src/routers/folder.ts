import prisma from "@dallateas/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { hashFolderPassword, toClientFolder } from "../folder-access";
import { protectedProcedure, router } from "../index";
import { collaboratorRole, folderInput, recordId, userId } from "../schemas";

async function requireOwnedFolder(folderId: string, ownerId: string) {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId: ownerId },
    select: { id: true },
  });
  if (!folder) throw new TRPCError({ code: "NOT_FOUND", message: "Carpeta no encontrada" });
  return folder;
}

export const folderRouter = router({
  folderGet: protectedProcedure.input(z.object({ id: recordId })).query(async ({ ctx, input }) => {
    const viewerId = ctx.session.user.id;
    const folder = await prisma.folder.findUnique({
      where: { id: input.id },
      include: {
        vinyls: {
          select: {
            vinyl: {
              include: {
                tracks: {
                  select: { bpm: true, bpmSource: true, camelotKey: true },
                  where: { bpm: { not: null } },
                  orderBy: { position: "asc" },
                },
              },
            },
          },
          orderBy: { position: "asc" },
        },
        _count: { select: { vinyls: true } },
        user: { select: { id: true, name: true } },
      },
    });
    if (!folder) throw new TRPCError({ code: "NOT_FOUND", message: "Carpeta no encontrada" });

    const isOwner = folder.userId === viewerId;
    const isAdmin = ctx.session.user.role === "admin";
    let collaboratorRole: string | null = null;

    if (!isOwner && !isAdmin) {
      const collaborator = await prisma.folderCollaborator.findUnique({
        where: { folderId_userId: { folderId: folder.id, userId: viewerId } },
        select: { role: true },
      });
      if (!collaborator) throw new TRPCError({ code: "NOT_FOUND", message: "Carpeta no encontrada" });
      collaboratorRole = collaborator.role;
    }

    // Collaborators share the crate, not what the owner paid or their mix notes.
    const seesPrivateFields = isOwner || isAdmin;

    return {
      ...toClientFolder(folder),
      vinyls: folder.vinyls.map(({ vinyl }) =>
        seesPrivateFields ? vinyl : { ...vinyl, pricePaid: null, mixNotes: null },
      ),
      isOwner,
      collaboratorRole,
      owner: folder.user,
    };
  }),

  foldersList: protectedProcedure.query(async ({ ctx }) => {
    const folders = await prisma.folder.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      include: { _count: { select: { vinyls: true } } },
    });
    return folders.map(toClientFolder);
  }),

  folderCreate: protectedProcedure.input(folderInput).mutation(async ({ ctx, input }) => {
    const ownerId = ctx.session.user.id;
    const { password, ...rest } = input;
    const position = await prisma.folder.count({ where: { userId: ownerId } });
    const folder = await prisma.folder.create({
      data: {
        ...rest,
        password: password ? await hashFolderPassword(password) : null,
        userId: ownerId,
        position,
      },
    });
    return toClientFolder(folder);
  }),

  folderUpdate: protectedProcedure
    .input(folderInput.extend({ id: recordId }))
    .mutation(async ({ ctx, input }) => {
      const { id, password, ...rest } = input;
      await requireOwnedFolder(id, ctx.session.user.id);

      const passwordChange =
        password === undefined ? {} : { password: password === null ? null : await hashFolderPassword(password) };

      const folder = await prisma.folder.update({ where: { id }, data: { ...rest, ...passwordChange } });
      return toClientFolder(folder);
    }),

  folderDelete: protectedProcedure.input(z.object({ id: recordId })).mutation(async ({ ctx, input }) => {
    await requireOwnedFolder(input.id, ctx.session.user.id);
    await prisma.folder.delete({ where: { id: input.id } });
    return { success: true };
  }),

  folderSetVisibility: protectedProcedure
    .input(z.object({ id: recordId, visibility: z.enum(["PUBLIC", "ACCOUNT", "PRIVATE"]) }))
    .mutation(async ({ ctx, input }) => {
      await requireOwnedFolder(input.id, ctx.session.user.id);
      const folder = await prisma.folder.update({
        where: { id: input.id },
        data: { visibility: input.visibility },
      });
      return toClientFolder(folder);
    }),

  folderReorder: protectedProcedure
    .input(z.object({ folderOrder: z.array(recordId).max(200) }))
    .mutation(async ({ ctx, input }) => {
      const owned = await prisma.folder.count({
        where: { id: { in: input.folderOrder }, userId: ctx.session.user.id },
      });
      if (owned !== new Set(input.folderOrder).size) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No podés reordenar carpetas que no son tuyas" });
      }
      await prisma.$transaction(
        input.folderOrder.map((id, position) => prisma.folder.update({ where: { id }, data: { position } })),
      );
      return { success: true };
    }),

  folderReorderVinyls: protectedProcedure
    .input(z.object({ folderId: recordId, vinylOrder: z.array(recordId).max(500) }))
    .mutation(async ({ ctx, input }) => {
      await requireOwnedFolder(input.folderId, ctx.session.user.id);
      await prisma.$transaction(
        input.vinylOrder.map((vinylId, position) =>
          prisma.folderVinyl.updateMany({ where: { folderId: input.folderId, vinylId }, data: { position } }),
        ),
      );
      return { success: true };
    }),

  folderInvite: protectedProcedure
    .input(z.object({ folderId: recordId, email: z.string().trim().toLowerCase().email(), role: collaboratorRole }))
    .mutation(async ({ ctx, input }) => {
      await requireOwnedFolder(input.folderId, ctx.session.user.id);

      const invitee = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });

      if (invitee && invitee.id !== ctx.session.user.id) {
        await prisma.folderCollaborator.upsert({
          where: { folderId_userId: { folderId: input.folderId, userId: invitee.id } },
          create: { folderId: input.folderId, userId: invitee.id, role: input.role },
          update: { role: input.role },
        });
      }

      // The same answer either way, so this cannot be used to test which emails have accounts.
      return { success: true };
    }),

  folderRemoveCollaborator: protectedProcedure
    .input(z.object({ folderId: recordId, userId }))
    .mutation(async ({ ctx, input }) => {
      await requireOwnedFolder(input.folderId, ctx.session.user.id);
      await prisma.folderCollaborator.deleteMany({ where: { folderId: input.folderId, userId: input.userId } });
      return { success: true };
    }),

  folderUpdateCollaboratorRole: protectedProcedure
    .input(z.object({ folderId: recordId, userId, role: collaboratorRole }))
    .mutation(async ({ ctx, input }) => {
      await requireOwnedFolder(input.folderId, ctx.session.user.id);
      await prisma.folderCollaborator.updateMany({
        where: { folderId: input.folderId, userId: input.userId },
        data: { role: input.role },
      });
      return { success: true };
    }),

  folderCollaborators: protectedProcedure
    .input(z.object({ folderId: recordId }))
    .query(async ({ ctx, input }) => {
      await requireOwnedFolder(input.folderId, ctx.session.user.id);
      return prisma.folderCollaborator.findMany({
        where: { folderId: input.folderId },
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      });
    }),

  myCollaborations: protectedProcedure.query(async ({ ctx }) => {
    const collaborations = await prisma.folderCollaborator.findMany({
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
    return collaborations.map((collaboration) => ({
      ...collaboration,
      folder: toClientFolder(collaboration.folder),
    }));
  }),
});
