import { env } from "@dallateas/env/server";
import { NextRequest, NextResponse } from "next/server";

const DISCOGS_BASE_URL = "https://api.discogs.com";

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const url = new URL(`${DISCOGS_BASE_URL}/database/search`);

  let hasQuery = false;
  for (const param of ALLOWED_PARAMS) {
    const value = searchParams.get(param);
    if (value?.trim()) {
      url.searchParams.set(param, value.trim());
      hasQuery = true;
    }
  }

  if (!hasQuery) {
    return NextResponse.json({ results: [] });
  }

  if (!url.searchParams.has("type")) {
    url.searchParams.set("type", "release");
  }

  url.searchParams.set("per_page", "15");

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
    return NextResponse.json({ results: [] }, { status: 200 });
  }

  const data = await res.json();

  return NextResponse.json({
    results: (data.results ?? []).map((item: any) => ({
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
