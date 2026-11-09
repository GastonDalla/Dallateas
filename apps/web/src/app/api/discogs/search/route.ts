import { NextResponse, type NextRequest } from "next/server";

import { discogsFetch, guardDiscogsRequest } from "@/lib/discogs-server";

const ALLOWED_PARAMS = [
  "q",
  "type",
  "title",
  "artist",
  "label",
  "genre",
  "style",
  "country",
  "year",
  "format",
  "catno",
  "barcode",
  "release_title",
] as const;

type DiscogsSearchResult = {
  id: number;
  title: string;
  year?: string;
  country?: string;
  format?: string[];
  label?: string[];
  genre?: string[];
  style?: string[];
  catno?: string;
  barcode?: string[];
  cover_image?: string;
  thumb?: string;
};

export async function GET(req: NextRequest) {
  const blocked = await guardDiscogsRequest(req, { requireSession: true });
  if (blocked) return blocked;

  const params: Record<string, string> = {};
  for (const param of ALLOWED_PARAMS) {
    const value = req.nextUrl.searchParams.get(param)?.trim();
    if (value) params[param] = value;
  }

  if (Object.keys(params).length === 0) {
    return NextResponse.json({ results: [] });
  }

  const res = await discogsFetch({
    path: "/database/search",
    params: { type: "release", ...params, per_page: "15" },
  });

  if (!res.ok) {
    return NextResponse.json({ results: [] }, { status: 200 });
  }

  const data = (await res.json()) as { results?: DiscogsSearchResult[] };

  return NextResponse.json({
    results: (data.results ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      year: item.year,
      country: item.country,
      format: item.format,
      label: item.label,
      genre: item.genre,
      style: item.style,
      catno: item.catno,
      barcode: item.barcode,
      cover_image: item.cover_image,
      thumb: item.thumb,
    })),
  });
}
