import prisma from "@dallateas/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { recordId, tagName } from "../schemas";

async function requireOwnedTag(id: string, ownerId: string) {
  const tag = await prisma.tag.findFirst({ where: { id, userId: ownerId }, select: { id: true } });
  if (!tag) throw new TRPCError({ code: "NOT_FOUND", message: "Tag no encontrado" });
}

function topEntries(counts: Map<string, number>) {
  return [...counts].toSorted((a, b) => b[1] - a[1]).slice(0, 10);
}

function increment(counts: Map<string, number>, key: string) {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

export const libraryRouter = router({
  tagsList: protectedProcedure.query(async ({ ctx }) =>
    prisma.tag.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { name: "asc" },
      include: { _count: { select: { vinyls: true } } },
    }),
  ),

  tagCreate: protectedProcedure.input(z.object({ name: tagName })).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    return prisma.tag.upsert({
      where: { name_userId: { name: input.name, userId } },
      create: { name: input.name, userId },
      update: {},
    });
  }),

  tagDelete: protectedProcedure.input(z.object({ id: recordId })).mutation(async ({ ctx, input }) => {
    await requireOwnedTag(input.id, ctx.session.user.id);
    await prisma.tag.delete({ where: { id: input.id } });
    return { success: true };
  }),

  tagRename: protectedProcedure
    .input(z.object({ id: recordId, name: tagName }))
    .mutation(async ({ ctx, input }) => {
      await requireOwnedTag(input.id, ctx.session.user.id);
      return prisma.tag.update({ where: { id: input.id }, data: { name: input.name } });
    }),

  userGenres: protectedProcedure.query(async ({ ctx }) => {
    const vinyls = await prisma.vinyl.findMany({
      where: { userId: ctx.session.user.id },
      select: { genre: true },
      distinct: ["genre"],
    });
    return vinyls.flatMap(({ genre }) => (genre ? [genre] : [])).sort();
  }),

  userStyles: protectedProcedure.query(async ({ ctx }) => {
    const vinyls = await prisma.vinyl.findMany({
      where: { userId: ctx.session.user.id, style: { not: null } },
      select: { style: true },
    });
    const styles = new Set(
      vinyls.flatMap(({ style }) =>
        (style ?? "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    );
    return [...styles].sort();
  }),

  collectionStats: protectedProcedure.query(async ({ ctx }) => {
    const vinyls = await prisma.vinyl.findMany({
      where: { userId: ctx.session.user.id },
      select: { genre: true, year: true, bpm: true, label: true, pricePaid: true },
    });

    const genres = new Map<string, number>();
    const decades = new Map<string, number>();
    const labels = new Map<string, number>();
    let bpmSum = 0;
    let bpmCount = 0;
    let totalValue = 0;
    let pricedCount = 0;

    for (const vinyl of vinyls) {
      if (vinyl.genre) increment(genres, vinyl.genre);
      if (vinyl.year) increment(decades, `${Math.floor(vinyl.year / 10) * 10}s`);
      if (vinyl.label) increment(labels, vinyl.label);
      if (vinyl.bpm) {
        bpmSum += vinyl.bpm;
        bpmCount += 1;
      }
      if (vinyl.pricePaid != null) {
        totalValue += vinyl.pricePaid;
        pricedCount += 1;
      }
    }

    return {
      totalVinyls: vinyls.length,
      avgBpm: bpmCount > 0 ? Math.round(bpmSum / bpmCount) : null,
      totalValue: pricedCount > 0 ? Math.round(totalValue * 100) / 100 : null,
      avgPrice: pricedCount > 0 ? Math.round((totalValue / pricedCount) * 100) / 100 : null,
      pricedCount,
      topGenres: topEntries(genres),
      topDecades: topEntries(decades),
      topLabels: topEntries(labels),
    };
  }),
});
