"use client";

import { Button } from "@dallateas/ui/components/button";
import { cn } from "@dallateas/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { useState } from "react";

import { KeyTag } from "@/components/dj/key-tag";
import { bpmSourceLabel, TrackTempo } from "@/components/dj/track-tempo";
import { videoForTrack, youtubeVideoId } from "@/app/vinyl/[id]/track-video";
import { fetchReleaseDetail } from "@/lib/discogs";

const VIDEOS_STALE_MS = 60 * 60 * 1000;

type Track = {
  id: string;
  side: string;
  title: string;
  duration: string | null;
} & Parameters<typeof TrackTempo>[0] & { camelotKey: string | null };

type TrackListProps = {
  tracks: Track[];
  discogsId: string | null;
};

export function TrackList({ tracks, discogsId }: TrackListProps) {
  const [openTrackId, setOpenTrackId] = useState<string | null>(null);

  const { data: release } = useQuery({
    queryKey: ["discogs-release", discogsId],
    queryFn: () => fetchReleaseDetail(discogsId!),
    enabled: discogsId !== null,
    staleTime: VIDEOS_STALE_MS,
  });
  const videos = release?.videos ?? [];

  return (
    <section aria-labelledby="tracklist-title" className="mt-8">
      <h2 id="tracklist-title" className="font-heading text-[28px] leading-none font-bold">
        {tracks.length} {tracks.length === 1 ? "corte" : "cortes"}
      </h2>

      <ol className="mt-3 divide-y divide-border">
        {tracks.map((track, index) => {
          const video = videoForTrack(track.title, index, tracks.length, videos);
          const videoId = video ? youtubeVideoId(video.uri) : null;
          const open = openTrackId === track.id;
          const source = bpmSourceLabel(track);

          return (
            <li key={track.id}>
              <div className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-2.5 sm:grid-cols-[2rem_minmax(0,1fr)_3rem_4.5rem_5rem_2.75rem]">
                <span className="tabular text-sm font-medium text-muted-foreground">{track.side}</span>
                <span className="min-w-0">
                  <span className="block truncate text-base">{track.title}</span>
                  {source && <span className="block truncate text-[13px] text-muted-foreground">{source}</span>}
                </span>
                <span className="tabular hidden text-right text-sm text-muted-foreground sm:block">{track.duration || "—"}</span>
                <span className="text-right">
                  <TrackTempo bpm={track.bpm} bpmSource={track.bpmSource} />
                </span>
                <span className="col-start-2 text-sm sm:col-start-auto sm:text-right">
                  <KeyTag value={track.camelotKey} />
                </span>
                {videoId ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`${open ? "Cerrar" : "Reproducir"} ${track.title}`}
                    aria-expanded={open}
                    onClick={() => setOpenTrackId(open ? null : track.id)}
                    className={cn("size-11 justify-self-end", open && "text-link")}
                  >
                    <Play aria-hidden="true" />
                  </Button>
                ) : (
                  <span aria-hidden="true" className="hidden sm:block" />
                )}
              </div>
              {open && videoId && (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                  className="mb-3 aspect-video w-full"
                  loading="lazy"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title={track.title}
                />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
