import { NextResponse, type NextRequest } from "next/server";

import { discogsFetch, guardDiscogsRequest } from "@/lib/discogs-server";

type DiscogsCollectionItem = {
  id: number;
  basic_information?: {
    id?: number;
    title?: string;
    year?: number;
    cover_image?: string;
    artists?: { name: string }[];
    labels?: { name: string }[];
    genres?: string[];
  };
};

type DiscogsCollectionPage = {
  releases?: DiscogsCollectionItem[];
  pagination?: { page?: number; pages?: number; items?: number };
};

export async function GET(req: NextRequest) {
  const blocked = await guardDiscogsRequest(req, { requireSession: true });
  if (blocked) return blocked;

  const { searchParams } = req.nextUrl;
  const username = searchParams.get("username")?.trim();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const perPage = Math.min(Number(searchParams.get("per_page")) || 50, 100);

  if (!username) {
    return NextResponse.json({ error: "Falta el usuario de Discogs" }, { status: 400 });
  }

  const res = await discogsFetch({
    path: `/users/${encodeURIComponent(username)}/collection/folders/0/releases`,
    params: { page: String(page), per_page: String(perPage), sort: "added", sort_order: "desc" },
    revalidate: 300,
  });

  if (!res.ok) {
    const status = res.status;
    if (status === 404) {
      return NextResponse.json({ error: "Usuario no encontrado en Discogs" }, { status: 404 });
    }
    if (status === 403) {
      return NextResponse.json({ error: "La coleccion de este usuario es privada en Discogs" }, { status: 403 });
    }
    return NextResponse.json({ error: "Error al conectar con Discogs. Intenta de nuevo." }, { status: 502 });
  }

  const data = (await res.json()) as DiscogsCollectionPage;

  if (!data.releases || data.releases.length === 0) {
    return NextResponse.json({
      releases: [],
      pagination: { page: 1, pages: 1, items: 0 },
    });
  }

  const releases = data.releases.map((item) => ({
    id: item.id,
    title: item.basic_information?.title ?? "",
    artist: item.basic_information?.artists?.map((artist) => artist.name).join(", ") ?? "",
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
