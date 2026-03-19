import { env } from "@dallateas/env/server";
import { NextRequest, NextResponse } from "next/server";

const DISCOGS_BASE_URL = "https://api.discogs.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const releaseId = searchParams.get("id");

  if (!releaseId || !/^\d+$/.test(releaseId)) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  const url = new URL(`${DISCOGS_BASE_URL}/releases/${releaseId}`);

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
    return NextResponse.json({ tracklist: [], videos: [] }, { status: 200 });
  }

  const data = await res.json();

  // Extract barcode from identifiers
  const barcode = data.identifiers?.find((i: any) => i.type === "Barcode")?.value ?? null;

  return NextResponse.json({
    tracklist: (data.tracklist ?? [])
      .filter((t: any) => t.type_ === "track")
      .map((t: any) => ({
        position: t.position ?? "",
        title: t.title ?? "",
        duration: t.duration ?? "",
      })),
    videos: (data.videos ?? [])
      .filter((v: any) => v.embed)
      .map((v: any) => ({
        title: v.title ?? "",
        uri: v.uri ?? "",
        duration: v.duration ?? 0,
      })),
    barcode,
    discogsUrl: data.uri ?? null,
  });
}
