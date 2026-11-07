import { keyLabel, parseKey } from "@dallateas/dj/camelot";
import { analyzeSet, rankMixes } from "@dallateas/dj/mixing";
import { DEFAULT_PITCH_RANGE } from "@dallateas/dj/tempo";
import prisma from "@dallateas/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { lookupTrackBpm } from "../bpm-lookup";
import { protectedProcedure, router } from "../index";
import { consumeRateLimit } from "../rate-limit";
import { tempoChange } from "../track-tempo";
import { bpmSource, camelotKey, cueNotes, recordId, trackBpm, trackEnergy } from "../schemas";

const HOUR_MS = 60 * 60 * 1000;
const TRACK_LOOKUPS_PER_HOUR = 600;
const MAX_TRACKS_PER_LOOKUP = 30;
const LOOKUP_BUDGET_MS = 20_000;
const MIX_RESULTS = 30;

const pitchRange = z.number().min(1).max(50).default(DEFAULT_PITCH_RANGE);

async function requireOwnedTrack(trackId: string, userId: string) {
  const track = await prisma.vinylTrack.findFirst({
    where: { id: trackId, vinyl: { userId } },
    select: { id: true, vinylId: true, bpm: true, bpmSource: true, camelotKey: true },
  });
  if (!track) throw new TRPCError({ code: "NOT_FOUND", message: "Track no encontrado" });
  return track;
}

async function requireFolderMember(folderId: string, session: { user: { id: string; role?: string | null } }) {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { userId: true, collaborators: { where: { userId: session.user.id }, select: { id: true } } },
  });
  const allowed =
    folder && (folder.userId === session.user.id || session.user.role === "admin" || folder.collaborators.length > 0);
  if (!allowed) throw new TRPCError({ code: "NOT_FOUND", message: "Carpeta no encontrada" });
}

export const djRouter = router({
  trackUpdate: protectedProcedure
    .input(
      z.object({
        id: recordId,
        bpm: trackBpm.nullable().optional(),
        bpmSource: bpmSource.nullable().optional(),
        camelotKey: camelotKey.nullable().optional(),
        energy: trackEnergy.nullable().optional(),
        cueNotes: cueNotes.nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, bpm, bpmSource: source, ...data } = input;
      const stored = await requireOwnedTrack(id, ctx.session.user.id);

      return prisma.vinylTrack.update({
        where: { id },
        data: { ...data, ...tempoChange({ bpm, bpmSource: source }, stored) },
      });
    }),

  vinylLookupBpm: protectedProcedure.input(z.object({ id: recordId })).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    const vinyl = await prisma.vinyl.findFirst({
      where: { id: input.id, userId },
      select: { artist: true, tracks: { where: { bpm: null }, select: { id: true, title: true } } },
    });
    if (!vinyl) throw new TRPCError({ code: "NOT_FOUND", message: "Vinilo no encontrado" });

    let searched = 0;
    let found = 0;
    let unavailable = false;
    const deadline = Date.now() + LOOKUP_BUDGET_MS;

    // One at a time: Deezer limits requests per address.
    for (const track of vinyl.tracks.slice(0, MAX_TRACKS_PER_LOOKUP)) {
      if (Date.now() > deadline) break;

      const allowed = await consumeRateLimit(`bpm-lookup:${userId}`, {
        limit: TRACK_LOOKUPS_PER_HOUR,
        windowMs: HOUR_MS,
      });
      if (!allowed) {
        if (searched > 0) break;
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Demasiadas búsquedas. Probá de nuevo en un rato." });
      }

      searched += 1;
      const result = await lookupTrackBpm(vinyl.artist, track.title);

      if (result.unavailable) {
        unavailable = true;
        break;
      }

      if (result.bpm !== null) {
        // Only an empty track: the DJ may have measured this one while the lookup was running.
        const { count } = await prisma.vinylTrack.updateMany({
          where: { id: track.id, bpm: null },
          data: { bpm: result.bpm, bpmSource: "LOOKUP" },
        });
        found += count;
      }
    }

    // A record longer than one pass reports what is left, so callers can tell a partial run from a full one.
    return { searched, found, unavailable, remaining: vinyl.tracks.length - searched };
  }),

  vinylsMissingBpm: protectedProcedure.query(async ({ ctx }) => {
    const vinyls = await prisma.vinyl.findMany({
      where: { userId: ctx.session.user.id, tracks: { some: { bpm: null } } },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });
    return vinyls.map(({ id }) => id);
  }),

  trackMixCandidates: protectedProcedure
    .input(z.object({ trackId: recordId, pitchRange }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const source = await requireOwnedTrack(input.trackId, userId);
      if (source.bpm === null) return { sourceHasBpm: false, mixes: [] };

      const tracks = await prisma.vinylTrack.findMany({
        where: { vinyl: { userId }, bpm: { not: null }, vinylId: { not: source.vinylId } },
        select: {
          id: true,
          title: true,
          side: true,
          bpm: true,
          camelotKey: true,
          vinyl: { select: { id: true, title: true, artist: true, coverUrl: true } },
        },
      });

      const mixes = rankMixes(
        { id: source.id, bpm: source.bpm, key: source.camelotKey },
        tracks.map((track) => ({ ...track, key: track.camelotKey })),
        { pitchRange: input.pitchRange },
      ).slice(0, MIX_RESULTS);

      return { sourceHasBpm: true, mixes };
    }),

  folderSetFlow: protectedProcedure
    .input(z.object({ folderId: recordId, pitchRange }))
    .query(async ({ ctx, input }) => {
      await requireFolderMember(input.folderId, ctx.session);

      const entries = await prisma.folderVinyl.findMany({
        where: { folderId: input.folderId },
        orderBy: { position: "asc" },
        select: {
          track: { select: { id: true, title: true, side: true, duration: true, bpm: true, camelotKey: true } },
          vinyl: {
            select: {
              id: true,
              title: true,
              artist: true,
              coverUrl: true,
              location: true,
              bpm: true,
              tracks: {
                select: { id: true, title: true, side: true, duration: true, bpm: true, camelotKey: true },
                orderBy: { position: "asc" },
              },
            },
          },
        },
      });

      const rows = entries.map(({ track, vinyl }) => {
        // Without a chosen cut, the first one with a tempo stands in, then the record's own tempo.
        const active = track ?? vinyl.tracks.find(({ bpm }) => bpm !== null) ?? vinyl.tracks[0] ?? null;
        return {
          id: vinyl.id,
          vinyl,
          trackId: active?.id ?? null,
          chosen: Boolean(track),
          label: active ? `${active.side} ${active.title}` : vinyl.title,
          bpm: active?.bpm ?? vinyl.bpm,
          key: active?.camelotKey ?? null,
          keyLabel: active?.camelotKey ? keyLabel(parseKey(active.camelotKey)!) : null,
          duration: active?.duration ?? null,
        };
      });

      return { rows, ...analyzeSet(rows, { pitchRange: input.pitchRange }) };
    }),

  folderSetTrack: protectedProcedure
    .input(z.object({ folderId: recordId, vinylId: recordId, trackId: recordId.nullable() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const folder = await prisma.folder.findFirst({ where: { id: input.folderId, userId }, select: { id: true } });
      if (!folder) throw new TRPCError({ code: "NOT_FOUND", message: "Carpeta no encontrada" });

      if (input.trackId) {
        const owned = await prisma.vinylTrack.count({ where: { id: input.trackId, vinylId: input.vinylId } });
        if (!owned) throw new TRPCError({ code: "NOT_FOUND", message: "Track no encontrado" });
      }

      const { count } = await prisma.folderVinyl.updateMany({
        where: { folderId: input.folderId, vinylId: input.vinylId },
        data: { trackId: input.trackId },
      });
      if (count === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Ese disco ya no está en el set" });
      return { success: true };
    }),

  vinylMarkPlayed: protectedProcedure.input(z.object({ id: recordId })).mutation(async ({ ctx, input }) => {
    const { count } = await prisma.vinyl.updateMany({
      where: { id: input.id, userId: ctx.session.user.id },
      data: { playCount: { increment: 1 }, lastPlayedAt: new Date() },
    });
    if (count === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Vinilo no encontrado" });
    return { success: true };
  }),

  trackStats: protectedProcedure.query(async ({ ctx }) => {
    const tracks = await prisma.vinylTrack.findMany({
      where: { vinyl: { userId: ctx.session.user.id } },
      select: { bpm: true, bpmSource: true, camelotKey: true },
    });

    const bpms = tracks.flatMap(({ bpm }) => (bpm === null ? [] : [bpm]));
    const histogram = new Map<number, number>();
    for (const bpm of bpms) {
      const bucket = Math.floor(bpm / 5) * 5;
      histogram.set(bucket, (histogram.get(bucket) ?? 0) + 1);
    }

    const keys = new Map<string, number>();
    for (const { camelotKey: key } of tracks) if (key) keys.set(key, (keys.get(key) ?? 0) + 1);

    return {
      totalTracks: tracks.length,
      tracksWithBpm: bpms.length,
      approximateBpm: tracks.filter(({ bpm, bpmSource: source }) => bpm !== null && source === "LOOKUP").length,
      averageBpm: bpms.length ? Math.round((bpms.reduce((sum, bpm) => sum + bpm, 0) / bpms.length) * 10) / 10 : null,
      bpmHistogram: [...histogram].toSorted(([a], [b]) => a - b).map(([bucket, count]) => ({ bucket, count })),
      keys: [...keys].toSorted(([, a], [, b]) => b - a).map(([key, count]) => ({ key, count })),
    };
  }),
});
