"use client";

import { parseDuration } from "@dallateas/dj/tempo";
import { Button } from "@dallateas/ui/components/button";
import { cn } from "@dallateas/ui/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { useState } from "react";

import { TrackMeasureDialog } from "@/components/dj/track-measure-dialog";
import { EmptyState } from "@/components/shell/empty-state";
import { actionClass } from "@/components/vinyl-form/field";
import { useInvalidateCollection } from "@/hooks/use-invalidate-collection";
import { useVinylBpmLookup, type VinylBpmLookup } from "@/hooks/use-vinyl-bpm-lookup";
import type { DiscogsVideo } from "@/lib/discogs";
import { formatRunningTime } from "@/lib/format";

import { TRACK_COLUMNS, TrackRow } from "./track-row";
import { videoForTrack, youtubeVideoId } from "./track-video";
import type { Vinyl } from "./types";

function cuts(count: number) {
  return count === 1 ? "1 corte" : `${count} cortes`;
}

function tracklistSummary(tracks: Vinyl["tracks"]) {
  const durations = tracks.map(({ duration }) => parseDuration(duration));
  const measured = tracks.filter(({ bpm }) => bpm !== null).length;
  const runningTime = durations.every((seconds) => seconds !== null)
    ? [formatRunningTime(durations.reduce<number>((total, seconds) => total + (seconds ?? 0), 0))]
    : [];

  return [cuts(tracks.length), `${measured} con BPM`, ...runningTime].join(" · ");
}

/** Says what happened, even when nothing did, and never presents a lookup as a measurement. */
function lookupReport({ searched, found, unavailable, remaining }: VinylBpmLookup) {
  const parts: string[] = [];

  if (searched === 0 && !unavailable) return "Ya tenés el BPM de todos los cortes";
  if (found > 0) parts.push(`Encontré ${found} de ${searched}. Son aproximados: confirmalos con el tap o el micrófono`);
  else if (searched > 0 && !unavailable) parts.push(`Busqué ${cuts(searched)} y no encontré ninguno. Medilos con el tap o el micrófono`);

  if (unavailable) parts.push("Deezer dejó de responder");
  if (remaining > 0) parts.push(`Faltan ${cuts(remaining)}, volvé a buscar en un rato`);

  return parts.join(". ");
}

type TracklistProps = {
  vinyl: Vinyl;
  videos: DiscogsVideo[];
};

export function Tracklist({ vinyl, videos }: TracklistProps) {
  const invalidate = useInvalidateCollection();
  const [measuringId, setMeasuringId] = useState<string | null>(null);
  const [mixTrackId, setMixTrackId] = useState<string | null>(null);
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);

  const lookupVinyl = useVinylBpmLookup();
  const lookup = useMutation({ mutationFn: (id: string) => lookupVinyl(id), onSuccess: () => invalidate(vinyl.id) });

  const { tracks } = vinyl;
  const measuring = tracks.find(({ id }) => id === measuringId);
  const missingBpm = tracks.some(({ bpm }) => bpm === null);

  return (
    <section aria-labelledby="tracklist-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h2 id="tracklist-title" className="font-heading text-2xl font-bold leading-none">
            Tracklist
          </h2>
          {tracks.length > 0 && <p className="tabular mt-1 text-[13px] text-muted-foreground">{tracklistSummary(tracks)}</p>}
        </div>
        {missingBpm && (
          <Button type="button" className={actionClass} disabled={lookup.isPending} onClick={() => lookup.mutate(vinyl.id)}>
            {lookup.isPending ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Search aria-hidden="true" />}
            {lookup.isPending ? "Buscando BPM" : "Buscar BPM"}
          </Button>
        )}
      </div>

      <div role="status" className="text-[13px] text-pretty empty:hidden">
        {lookup.data && <p className="text-muted-foreground">{lookupReport(lookup.data)}</p>}
        {lookup.error && <p className="text-clash">{lookup.error.message}</p>}
      </div>

      {tracks.length === 0 ? (
        <EmptyState
          title="Este disco no tiene tracklist"
          description="Editalo para cargar los cortes y poder medirlos, o buscalo en Discogs"
        />
      ) : (
        <div>
          <div aria-hidden="true" className={cn("hidden gap-x-3 pb-2 text-[13px] text-muted-foreground lg:grid", TRACK_COLUMNS)}>
            <span>Lado</span>
            <span>Título</span>
            <span className="text-right">Duración</span>
            <span>BPM</span>
            <span>Tonalidad</span>
            <span>Energía</span>
            <span />
          </div>
          <ol>
            {tracks.map((track, index) => {
              const video = videoForTrack(track.title, index, tracks.length, videos);
              return (
                <TrackRow
                  key={track.id}
                  track={track}
                  videoId={video ? youtubeVideoId(video.uri) : null}
                  mixOpen={mixTrackId === track.id}
                  previewOpen={previewTrackId === track.id}
                  onMeasure={() => setMeasuringId(track.id)}
                  onToggleMix={() => setMixTrackId((current) => (current === track.id ? null : track.id))}
                  onTogglePreview={() => setPreviewTrackId((current) => (current === track.id ? null : track.id))}
                />
              );
            })}
          </ol>
        </div>
      )}

      {measuring && (
        <TrackMeasureDialog key={measuring.id} track={measuring} vinylId={vinyl.id} onClose={() => setMeasuringId(null)} />
      )}
    </section>
  );
}
