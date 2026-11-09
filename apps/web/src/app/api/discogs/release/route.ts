import { NextResponse, type NextRequest } from "next/server";

import { discogsFetch, guardDiscogsRequest } from "@/lib/discogs-server";

type DiscogsRelease = {
  identifiers?: { type: string; value: string }[];
  tracklist?: { type_: string; position?: string; title?: string; duration?: string }[];
  videos?: { embed: boolean; title?: string; uri?: string; duration?: number }[];
  uri?: string;
};

export async function GET(req: NextRequest) {
  // Public batea pages load videos from here, so visitors without an account are allowed, with a lower limit.
  const blocked = await guardDiscogsRequest(req, { requireSession: false });
  if (blocked) return blocked;

  const releaseId = req.nextUrl.searchParams.get("id");

  if (!releaseId || !/^\d+$/.test(releaseId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const res = await discogsFetch({ path: `/releases/${releaseId}`, revalidate: 86_400 });

  if (!res.ok) {
    return NextResponse.json({ tracklist: [], videos: [] }, { status: 200 });
  }

  const data = (await res.json()) as DiscogsRelease;
  const barcode = data.identifiers?.find((identifier) => identifier.type === "Barcode")?.value ?? null;

  return NextResponse.json({
    tracklist: (data.tracklist ?? [])
      .filter((track) => track.type_ === "track")
      .map((track) => ({
        position: track.position ?? "",
        title: track.title ?? "",
        duration: track.duration ?? "",
      })),
    videos: (data.videos ?? [])
      .filter((video) => video.embed)
      .map((video) => ({
        title: video.title ?? "",
        uri: video.uri ?? "",
        duration: video.duration ?? 0,
      })),
    barcode,
    discogsUrl: data.uri ?? null,
  });
}
