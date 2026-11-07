import type { DiscogsVideo } from "@/lib/discogs";

const YOUTUBE_LINK = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function youtubeVideoId(url: string) {
  return url.match(YOUTUBE_LINK)?.[1] ?? null;
}

/** Discogs names videos "Artist - Track". This keeps the track, or nothing if that is all there was. */
function videoTrackName(video: DiscogsVideo) {
  return video.title
    .toLowerCase()
    .replace(/^.*?-\s*/, "")
    .trim();
}

/** Finds a track's video by name, or by place when the release lists one video per track. */
export function videoForTrack(title: string, index: number, trackCount: number, videos: readonly DiscogsVideo[]) {
  const name = title.toLowerCase();
  const named = videos.find((video) => {
    const videoName = videoTrackName(video);
    return video.title.toLowerCase().includes(name) || (videoName.length > 0 && name.includes(videoName));
  });

  return named ?? (videos.length === trackCount ? videos[index] : undefined);
}
