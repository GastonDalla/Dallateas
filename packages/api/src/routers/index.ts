import prisma from "@dallateas/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { mergeRouters, protectedProcedure, publicProcedure, router } from "../index";
import { folderRouter } from "./folder";
import { libraryRouter } from "./library";
import { publicRouter } from "./public";
import { vinylRouter } from "./vinyl";

const cuid = z.string().min(1).max(30);

// Procedures that have not moved to a domain router yet.
const remainingRouter = router({
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

export const appRouter = mergeRouters(publicRouter, vinylRouter, folderRouter, libraryRouter, remainingRouter);

export type AppRouter = typeof appRouter;
