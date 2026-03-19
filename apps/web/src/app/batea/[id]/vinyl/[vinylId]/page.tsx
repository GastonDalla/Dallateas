"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Disc3, ExternalLink, Gauge, Music, Play, Tag } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { fetchReleaseDetail, type DiscogsVideo } from "@/lib/discogs";
import { trpc } from "@/utils/trpc";

function youtubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

export default function PublicVinylPage() {
  const { id: folderId, vinylId } = useParams<{ id: string; vinylId: string }>();
  const [showPreview, setShowPreview] = useState(false);
  const [previewTrackIndex, setPreviewTrackIndex] = useState<number | null>(null);
  const [discogsVideos, setDiscogsVideos] = useState<DiscogsVideo[]>([]);
  const vinylQuery = useQuery(
    trpc.publicVinylGet.queryOptions({ id: vinylId, folderId }),
  );
  const vinyl = vinylQuery.data;

  useEffect(() => {
    if (vinyl?.discogsId) {
      fetchReleaseDetail(vinyl.discogsId).then((d) => setDiscogsVideos(d.videos ?? [])).catch(() => {});
    }
  }, [vinyl?.discogsId]);

  if (vinylQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Disc3 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!vinyl) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">Vinilo no encontrado.</p>
        <Link href={`/batea/${folderId}` as any} className="text-sm text-primary underline">
          Volver a la batea
        </Link>
      </div>
    );
  }

  const meta = [
    vinyl.label && { icon: Tag, label: "Sello", value: vinyl.label },
    vinyl.genre && { icon: Music, label: "Genero", value: vinyl.genre },
    vinyl.year && { icon: Calendar, label: "Ano", value: String(vinyl.year) },
    vinyl.bpm && { icon: Gauge, label: "BPM", value: String(vinyl.bpm) },
  ].filter(Boolean) as { icon: any; label: string; value: string }[];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-20">
      <Link
        href={`/batea/${folderId}` as any}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {vinyl.folder?.name ?? "Volver"}
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="aspect-square w-full shrink-0 overflow-hidden rounded-lg bg-muted shadow-md sm:w-56">
          {vinyl.coverUrl ? (
            <img src={vinyl.coverUrl} alt={vinyl.title} width={224} height={224} decoding="async" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Disc3 className="h-16 w-16 text-muted-foreground/20" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">{vinyl.title}</h1>
            <p className="text-base text-muted-foreground">{vinyl.artist}</p>
          </div>

          {meta.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {meta.map((m) => (
                <div key={m.label} className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                  <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">{m.label}</p>
                    <p className="text-xs font-medium">{m.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* External Links + Preview */}
          {(() => {
            const q = encodeURIComponent(`${vinyl.artist} ${vinyl.title}`);
            const discogsUrl = vinyl.discogsId ? `https://www.discogs.com/release/${vinyl.discogsId}` : null;
            return (
              <>
                <div className="flex flex-wrap gap-2">
                  {discogsUrl && (
                    <a href={discogsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-accent">
                      <Disc3 className="h-3.5 w-3.5" /> Discogs <ExternalLink className="h-3 w-3 opacity-50" />
                    </a>
                  )}
                  <a href={`https://open.spotify.com/search/${q}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-accent">
                    Spotify <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                  <a href={`https://www.youtube.com/results?search_query=${q}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-accent">
                    YouTube <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                  <button type="button" onClick={() => setShowPreview(!showPreview)} className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20">
                    <Play className="h-3.5 w-3.5" /> {showPreview ? "Ocultar" : "Preview"}
                  </button>
                </div>
                {showPreview && (
                  <a
                    href={`https://www.youtube.com/results?search_query=${q}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                  >
                    Buscar en YouTube
                  </a>
                )}
              </>
            );
          })()}

          {/* Tracklist with inline video preview — same as private vinyl detail */}
          {vinyl.tracks && vinyl.tracks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                Tracklist · {vinyl.tracks.length} tracks
              </h3>
              <div className="rounded-md border border-border/60 overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-border/40 bg-muted/30 px-3 py-1.5 text-[10px] font-medium text-muted-foreground">
                  <span className="w-8 shrink-0 text-right">Pos.</span>
                  <span className="min-w-0 flex-1">Titulo</span>
                  <span className="w-10 shrink-0 text-right">Dur.</span>
                  {discogsVideos.length > 0 && <span className="w-7 shrink-0" />}
                </div>
                {vinyl.tracks.map((track: any, i: number) => {
                  const trackLower = track.title.toLowerCase();
                  const matchedVideo = discogsVideos.find((v) =>
                    v.title.toLowerCase().includes(trackLower) ||
                    trackLower.includes(v.title.toLowerCase().replace(/^.*?-\s*/, ""))
                  );
                  const videoForTrack = matchedVideo ??
                    (discogsVideos.length === vinyl.tracks.length ? discogsVideos[i] : undefined);
                  const videoId = videoForTrack ? youtubeVideoId(videoForTrack.uri) : null;
                  const isOpen = previewTrackIndex === i;

                  return (
                    <div key={track.id} className="border-b border-border/30 last:border-b-0">
                      <div
                        className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${videoId ? "cursor-pointer hover:bg-muted/30" : ""}`}
                        onClick={() => videoId && setPreviewTrackIndex(isOpen ? null : i)}
                      >
                        <span className="w-8 shrink-0 text-right text-[11px] font-bold text-muted-foreground">
                          {track.side}
                        </span>
                        <span className="min-w-0 flex-1 text-sm">{track.title}</span>
                        <span className="w-10 shrink-0 text-right text-[11px] text-muted-foreground">
                          {track.duration || "—"}
                        </span>
                        {videoId && (
                          <button
                            type="button"
                            aria-label={`Reproducir ${track.title}`}
                            className={`w-7 shrink-0 rounded p-1 transition-colors ${isOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                          >
                            <Play className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      {isOpen && videoId && (
                        <div className="border-t border-border/30">
                          <iframe
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                            className="aspect-video w-full"
                            loading="lazy"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                            title={track.title}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {vinyl.notes && (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{vinyl.notes}</p>
          )}

          {vinyl.folder && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>En batea:</span>
              <Link
                href={`/batea/${vinyl.folder.id}` as any}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary"
              >
                {vinyl.folder.color && (
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: vinyl.folder.color }} />
                )}
                {vinyl.folder.name}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
