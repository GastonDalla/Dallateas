import prisma from "@dallateas/db";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.BETTER_AUTH_URL ?? "https://dallateas.com";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/bateas`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  const publicFolders = await prisma.folder.findMany({
    where: { visibility: "PUBLIC" },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 1000,
  });

  const bateaPages: MetadataRoute.Sitemap = publicFolders.map((folder) => ({
    url: `${baseUrl}/batea/${folder.id}`,
    lastModified: folder.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const publicProfiles = await prisma.djProfile.findMany({
    where: { isPublic: true },
    select: { slug: true, updatedAt: true, user: { select: { username: true } } },
    take: 1000,
  });

  const profilePages: MetadataRoute.Sitemap = publicProfiles
    .filter((p) => p.slug || p.user.username)
    .map((p) => ({
      url: `${baseUrl}/p/${p.slug ?? p.user.username}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  return [...staticPages, ...bateaPages, ...profilePages];
}
