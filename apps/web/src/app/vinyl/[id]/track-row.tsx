import { Button } from "@dallateas/ui/components/button";
import { cn } from "@dallateas/ui/lib/utils";
import { Gauge, Play, Shuffle } from "lucide-react";

import { KeyTag } from "@/components/dj/key-tag";
import { MixPanel } from "@/components/dj/mix-panel";
import { bpmSourceLabel, TrackTempo } from "@/components/dj/track-tempo";
import { actionClass, iconActionClass } from "@/components/vinyl-form/field";

import type { Track } from "./types";
import { VideoFrame } from "./video-frame";

/** Columns shared by the header and every row. Below this width a row stacks and the header goes away. */
export const TRACK_COLUMNS =
  "lg:grid-cols-[2.5rem_minmax(0,1fr)_3.5rem_5rem_6.5rem_3.5rem_auto] lg:items-center";

function Energy({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="tabular">
      <span className="sr-only">Energía </span>
      {value}
      <span className="text-muted-foreground">/5</span>
    </span>
  );
}

type TrackRowProps = {
  track: Track;
  videoId: string | null;
  mixOpen: boolean;
  previewOpen: boolean;
  onMeasure: () => void;
  onToggleMix: () => void;
  onTogglePreview: () => void;
};

export function TrackRow({ track, videoId, mixOpen, previewOpen, onMeasure, onToggleMix, onTogglePreview }: TrackRowProps) {
  const source = bpmSourceLabel(track);

  return (
    <li className="border-t border-border">
      <div className={cn("grid grid-cols-[2.5rem_minmax(0,1fr)_auto] gap-x-3 gap-y-1 py-3", TRACK_COLUMNS)}>
        <span className="tabular text-[13px] font-semibold text-muted-foreground">{track.side}</span>

        <div className="min-w-0">
          <p className="text-sm font-medium text-pretty">{track.title}</p>
          {source && <p className="text-[13px] text-muted-foreground">{source}</p>}
          {track.cueNotes && <p className="text-[13px] text-pretty text-muted-foreground">{track.cueNotes}</p>}
          <p className="flex flex-wrap gap-x-3 text-[13px] text-muted-foreground lg:hidden">
            {track.duration && <span className="tabular">{track.duration}</span>}
            {track.camelotKey && <KeyTag value={track.camelotKey} />}
            {track.energy !== null && <Energy value={track.energy} />}
          </p>
        </div>

        <span className="tabular hidden text-right text-[13px] text-muted-foreground lg:block">{track.duration || "—"}</span>

        <div className="lg:order-none">
          <TrackTempo bpm={track.bpm} bpmSource={track.bpmSource} />
        </div>

        <span className="hidden text-sm lg:block">
          <KeyTag value={track.camelotKey} />
        </span>
        <span className="hidden text-sm lg:block">
          <Energy value={track.energy} />
        </span>

        <div className="col-span-full flex items-center gap-1 lg:col-span-1 lg:justify-end">
          <Button type="button" variant="outline" className={actionClass} onClick={onMeasure} aria-label={`Medir ${track.title}`}>
            <Gauge aria-hidden="true" />
            Medir
          </Button>
          {track.bpm !== null && (
            <Button
              type="button"
              variant="outline"
              className={actionClass}
              aria-expanded={mixOpen}
              aria-label={`Qué mezcla con ${track.title}`}
              onClick={onToggleMix}
            >
              <Shuffle aria-hidden="true" />
              Mezcla
            </Button>
          )}
          {videoId && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(iconActionClass, previewOpen && "text-link")}
              aria-expanded={previewOpen}
              aria-label={`Escuchar ${track.title}`}
              onClick={onTogglePreview}
            >
              <Play aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {previewOpen && videoId && (
        <div className="pb-3">
          <VideoFrame videoId={videoId} title={track.title} />
        </div>
      )}

      {mixOpen && (
        <div className="pb-3">
          <MixPanel track={track} />
        </div>
      )}
    </li>
  );
}
