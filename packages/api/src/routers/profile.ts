import prisma, { type Prisma } from "@dallateas/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";
import { consumeRateLimit } from "../rate-limit";
import {
  dateString,
  httpUrl,
  mixLink,
  optionalHttpUrl,
  parseJsonList,
  profileSlug,
  recordId,
  safeHttpUrl,
  socialLink,
} from "../schemas";

const VIEW_WINDOW_MS = 60 * 60 * 1000;
const MAX_MEDIA_ITEMS = 10;

const layout = z.enum(["slider", "card"]);
const mediaType = z.enum(["youtube", "spotify"]);

const storedUrl = z.string().transform((value, context) => {
  const url = safeHttpUrl(value);
  if (url) return url;
  context.addIssue({ code: "custom", message: "Invalid link" });
  return z.NEVER;
});

const storedSocialLink = z.object({
  platform: z.string(),
  url: storedUrl,
  label: z.string().optional(),
});

const storedMix = z.object({ title: z.string(), url: storedUrl });

function asLayout(value: string) {
  return value === "slider" ? "slider" : "card";
}

const profileUpdateInput = z.object({
  slug: profileSlug.optional(),
  bio: z.string().trim().max(1000).optional(),
  location: z.string().trim().max(200).optional(),
  isPublic: z.boolean().optional(),
  genres: z.string().trim().max(500).optional(),
  socialLinks: z.array(socialLink).max(15).optional(),
  youtubeVideos: z.array(httpUrl()).max(MAX_MEDIA_ITEMS).optional(),
  youtubeLayout: layout.optional(),
  showViewCount: z.boolean().optional(),
  spotifyTracks: z.array(httpUrl()).max(MAX_MEDIA_ITEMS).optional(),
  spotifyLayout: layout.optional(),
  featuredVinylId: z.string().max(50).nullable().optional(),
  featuredMixUrl: optionalHttpUrl(),
  featuredMixTitle: z.string().trim().max(200).optional(),
  mixes: z.array(mixLink).max(20).optional(),
  mixesLayout: layout.optional(),
  bookingEmail: z.union([z.literal(""), z.string().trim().email("Email inválido").max(200)]).optional(),
  bookingPhone: z.string().trim().max(50).optional(),
  bookingInfo: z.string().trim().max(500).optional(),
  pressKitUrl: optionalHttpUrl(),
  websiteUrl: optionalHttpUrl(),
});

type ProfileUpdate = z.infer<typeof profileUpdateInput>;

/** Omitted fields keep their value, and an empty string clears one. */
function toProfileData(input: ProfileUpdate): Prisma.DjProfileUncheckedUpdateInput {
  const { socialLinks, youtubeVideos, spotifyTracks, mixes, ...fields } = input;
  const data: Prisma.DjProfileUncheckedUpdateInput = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) Object.assign(data, { [key]: value === "" ? null : value });
  }

  const lists = { socialLinks, youtubeVideos, spotifyTracks, mixes };
  for (const [key, value] of Object.entries(lists)) {
    if (value !== undefined) Object.assign(data, { [key]: JSON.stringify(value) });
  }

  return data;
}

function mediaField(type: z.infer<typeof mediaType>) {
  return type === "youtube" ? "youtubeVideos" : "spotifyTracks";
}

const publicProfileInclude = {
  user: {
    select: {
      id: true,
      name: true,
      username: true,
      displayUsername: true,
      image: true,
      createdAt: true,
      folders: {
        where: { visibility: "PUBLIC" },
        select: {
          id: true,
          name: true,
          type: true,
          color: true,
          viewCount: true,
          _count: { select: { vinyls: true } },
        },
        orderBy: { position: "asc" },
      },
    },
  },
  featuredVinyl: {
    select: {
      id: true,
      title: true,
      artist: true,
      coverUrl: true,
      genre: true,
      style: true,
      year: true,
      label: true,
    },
  },
  gigs: {
    orderBy: { date: "asc" },
    take: 20,
  },
} satisfies Prisma.DjProfileInclude;

async function findPublicProfile(slug: string) {
  const include = {
    ...publicProfileInclude,
    gigs: { ...publicProfileInclude.gigs, where: { date: { gte: new Date() } } },
  };

  const bySlug = await prisma.djProfile.findUnique({ where: { slug }, include });
  if (bySlug) return bySlug;

  const user = await prisma.user.findUnique({ where: { username: slug }, select: { id: true } });
  return user ? prisma.djProfile.findUnique({ where: { userId: user.id }, include }) : null;
}

export const profileRouter = router({
  djProfileGet: protectedProcedure.query(async ({ ctx }) => {
    const profile = await prisma.djProfile.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        featuredVinyl: {
          select: { id: true, title: true, artist: true, coverUrl: true, genre: true, style: true },
        },
        gigs: { orderBy: { date: "asc" } },
      },
    });
    if (!profile) return null;

    return {
      ...profile,
      socialLinks: parseJsonList(profile.socialLinks, storedSocialLink),
      youtubeVideos: parseJsonList(profile.youtubeVideos, storedUrl),
      spotifyTracks: parseJsonList(profile.spotifyTracks, storedUrl),
      mixes: parseJsonList(profile.mixes, storedMix),
    };
  }),

  djProfileCheckSlug: protectedProcedure
    .input(z.object({ slug: profileSlug }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const [profile, user] = await Promise.all([
        prisma.djProfile.findUnique({ where: { slug: input.slug }, select: { userId: true } }),
        prisma.user.findUnique({ where: { username: input.slug }, select: { id: true } }),
      ]);
      const taken = (profile && profile.userId !== userId) || (user && user.id !== userId);
      return { available: !taken };
    }),

  djProfileUpdate: protectedProcedure.input(profileUpdateInput).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    if (input.slug) {
      const [profile, user] = await Promise.all([
        prisma.djProfile.findUnique({ where: { slug: input.slug }, select: { userId: true } }),
        prisma.user.findUnique({ where: { username: input.slug }, select: { id: true } }),
      ]);
      // Usernames resolve to /p/<username> too, so a slug must not take over someone else's address.
      if ((profile && profile.userId !== userId) || (user && user.id !== userId)) {
        throw new TRPCError({ code: "CONFLICT", message: "Esa URL ya está en uso" });
      }
    }

    if (input.featuredVinylId) {
      const owned = await prisma.vinyl.count({ where: { id: input.featuredVinylId, userId } });
      if (!owned) throw new TRPCError({ code: "BAD_REQUEST", message: "Vinilo no encontrado en tu colección" });
    }

    const data = toProfileData(input);
    return prisma.djProfile.upsert({
      where: { userId },
      update: data,
      create: { ...(data as Prisma.DjProfileUncheckedCreateInput), userId },
    });
  }),

  djProfilePublic: publicProcedure
    .input(z.object({ slug: z.string().min(1).max(100) }))
    .query(async ({ ctx, input }) => {
      const profile = await findPublicProfile(input.slug);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil no encontrado" });

      const isOwner = ctx.session?.user.id === profile.userId;
      const isAdmin = ctx.session?.user.role === "admin";
      if (!profile.isPublic && !isOwner && !isAdmin) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Perfil no encontrado" });
      }

      const { user } = profile;
      return {
        id: profile.id,
        name: user.name,
        username: user.displayUsername ?? user.username ?? profile.slug ?? input.slug,
        image: user.image,
        memberSince: user.createdAt,
        bio: profile.bio,
        location: profile.location,
        genres: profile.genres,
        viewCount: profile.showViewCount ? profile.viewCount : null,
        socialLinks: parseJsonList(profile.socialLinks, storedSocialLink),
        youtubeVideos: parseJsonList(profile.youtubeVideos, storedUrl),
        youtubeLayout: asLayout(profile.youtubeLayout),
        spotifyTracks: parseJsonList(profile.spotifyTracks, storedUrl),
        spotifyLayout: asLayout(profile.spotifyLayout),
        featuredVinyl: profile.featuredVinyl,
        featuredMixUrl: safeHttpUrl(profile.featuredMixUrl),
        featuredMixTitle: profile.featuredMixTitle,
        mixes: parseJsonList(profile.mixes, storedMix),
        mixesLayout: asLayout(profile.mixesLayout),
        bookingEmail: profile.bookingEmail,
        bookingPhone: profile.bookingPhone,
        bookingInfo: profile.bookingInfo,
        pressKitUrl: safeHttpUrl(profile.pressKitUrl),
        websiteUrl: safeHttpUrl(profile.websiteUrl),
        gigs: profile.gigs.map((gig) => ({ ...gig, ticketUrl: safeHttpUrl(gig.ticketUrl) })),
        folders: user.folders,
      };
    }),

  djProfileRecordView: publicProcedure.input(z.object({ id: recordId })).mutation(async ({ ctx, input }) => {
    const exists = await prisma.djProfile.count({ where: { id: input.id } });
    if (!exists) return { success: true };

    const fresh = await consumeRateLimit(`view:profile:${input.id}:${ctx.ip}`, { limit: 1, windowMs: VIEW_WINDOW_MS });
    if (fresh) {
      // Raw on purpose: a Prisma update would touch `updatedAt`, which feeds the sitemap.
      await prisma.$executeRaw`
        UPDATE "DjProfile" SET "viewCount" = "viewCount" + 1
        WHERE "id" = ${input.id} AND "userId" <> ${ctx.session?.user.id ?? ""}
      `;
    }
    return { success: true };
  }),

  djProfileAddMedia: protectedProcedure
    .input(z.object({ type: mediaType, url: httpUrl() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const profile = await prisma.djProfile.findUnique({ where: { userId } });
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Creá tu perfil DJ primero" });

      const field = mediaField(input.type);
      const current = parseJsonList(profile[field], storedUrl);

      if (current.length >= MAX_MEDIA_ITEMS) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Máximo ${MAX_MEDIA_ITEMS} items` });
      }
      if (current.includes(input.url)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ese link ya está agregado" });
      }

      const next = [...current, input.url];
      await prisma.djProfile.update({ where: { userId }, data: { [field]: JSON.stringify(next) } });
      return next;
    }),

  djProfileRemoveMedia: protectedProcedure
    .input(z.object({ type: mediaType, index: z.number().int().min(0).max(MAX_MEDIA_ITEMS) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const profile = await prisma.djProfile.findUnique({ where: { userId } });
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil no encontrado" });

      const field = mediaField(input.type);
      const next = parseJsonList(profile[field], storedUrl).filter((_, index) => index !== input.index);
      await prisma.djProfile.update({ where: { userId }, data: { [field]: JSON.stringify(next) } });
      return next;
    }),

  djGigCreate: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(200),
        venue: z.string().trim().max(200).optional(),
        city: z.string().trim().max(100).optional(),
        date: dateString,
        endDate: dateString.optional(),
        ticketUrl: optionalHttpUrl(),
        description: z.string().trim().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const profile = await prisma.djProfile.findUnique({
        where: { userId: ctx.session.user.id },
        select: { id: true },
      });
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Creá tu perfil DJ primero" });

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

  djGigDelete: protectedProcedure.input(z.object({ id: recordId })).mutation(async ({ ctx, input }) => {
    const { count } = await prisma.djGig.deleteMany({
      where: { id: input.id, profile: { userId: ctx.session.user.id } },
    });
    if (count === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Fecha no encontrada" });
    return { success: true };
  }),
});
