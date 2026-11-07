import prisma from "@dallateas/db";
import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { connection } from "next/server";

const REVALIDATE_SECONDS = 60 * 60;
const MAX_ENTRIES = 1000;

/** The search engines ask far more often than these change, so an hour-old list is fine. */
const loadPublicPages = unstable_cache(
  async () => {
    const [folders, profiles] = await Promise.all([
      prisma.folder.findMany({
        // A locked crate shows nothing to index.
        where: { visibility: "PUBLIC", password: null },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: MAX_ENTRIES,
      }),
      prisma.djProfile.findMany({
        where: { isPublic: true },
        select: { slug: true, updatedAt: true, user: { select: { username: true } } },
        take: MAX_ENTRIES,
      }),
    ]);

    return {
      folders: folders.map(({ id, updatedAt }) => ({ id, updatedAt: updatedAt.toISOString() })),
      profiles: profiles.flatMap(({ slug, updatedAt, user }) => {
        const path = slug ?? user.username;
        return path ? [{ path, updatedAt: updatedAt.toISOString() }] : [];
      }),
    };
  },
  ["sitemap-public-pages"],
  { revalidate: REVALIDATE_SECONDS },
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Rendered per request so a build never depends on the database being reachable.
  await connection();

  const baseUrl = process.env.BETTER_AUTH_URL ?? "https://dallateas.com";
  const { folders, profiles } = await loadPublicPages();

  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/bateas`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/herramientas`, changeFrequency: "monthly", priority: 0.8 },
    ...folders.map(({ id, updatedAt }) => ({
      url: `${baseUrl}/batea/${id}`,
      lastModified: updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...profiles.map(({ path, updatedAt }) => ({
      url: `${baseUrl}/p/${path}`,
      lastModified: updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
