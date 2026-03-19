import { env } from "@dallateas/env/server";
import { NextRequest, NextResponse } from "next/server";

const DISCOGS_BASE_URL = "https://api.discogs.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username")?.trim();
  const page = searchParams.get("page") ?? "1";
  const perPage = searchParams.get("per_page") ?? "50";

  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  const url = new URL(
    `${DISCOGS_BASE_URL}/users/${encodeURIComponent(username)}/collection/folders/0/releases`,
  );
  url.searchParams.set("page", page);
  url.searchParams.set("per_page", String(Math.min(Number(perPage) || 50, 100)));
  url.searchParams.set("sort", "added");
  url.searchParams.set("sort_order", "desc");

  if (env.DISCOGS_KEY && env.DISCOGS_SECRET) {
    url.searchParams.set("key", env.DISCOGS_KEY);
    url.searchParams.set("secret", env.DISCOGS_SECRET);
  }

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Dallateas/1.0",
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const status = res.status;
    if (status === 404) {
      return NextResponse.json({ error: "Usuario no encontrado en Discogs" }, { status: 404 });
    }
    if (status === 403) {
      return NextResponse.json({ error: "La coleccion de este usuario es privada en Discogs" }, { status: 403 });
    }
    return NextResponse.json({ error: "Error al conectar con Discogs. Intenta de nuevo." }, { status: status });
  }

  const data = await res.json();

  if (!data.releases || data.releases.length === 0) {
    return NextResponse.json({
      releases: [],
      pagination: { page: 1, pages: 1, items: 0 },
    });
  }

  const releases = (data.releases ?? []).map((item: any) => ({
    id: item.id,
    title: item.basic_information?.title ?? "",
    artist: item.basic_information?.artists?.map((a: any) => a.name).join(", ") ?? "",
    year: item.basic_information?.year ?? null,
    label: item.basic_information?.labels?.[0]?.name ?? null,
    genre: item.basic_information?.genres?.[0] ?? null,
    coverUrl: item.basic_information?.cover_image ?? null,
    discogsId: String(item.basic_information?.id ?? item.id),
  }));

  return NextResponse.json({
    releases,
    pagination: {
      page: data.pagination?.page ?? 1,
      pages: data.pagination?.pages ?? 1,
      items: data.pagination?.items ?? 0,
    },
  });
}
