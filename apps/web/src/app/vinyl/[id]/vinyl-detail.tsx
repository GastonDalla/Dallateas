"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Disc3,
  Edit2,
  ExternalLink,
  Folder,
  Gauge,
  ListMusic,
  MessageSquare,
  Music,
  Play,
  Tag,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useHaptic } from "@/hooks/use-haptic";
import { fetchReleaseDetail, type DiscogsVideo } from "@/lib/discogs";
import { useAddVinyl } from "@/components/add-vinyl-context";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ExportPdf } from "@/components/export-pdf";
import { queryClient, trpc } from "@/utils/trpc";

function buildSearchQuery(artist: string, title: string) {
  return encodeURIComponent(`${artist} ${title}`);
}

function youtubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

export default function VinylDetail({ id }: { id: string }) {
  const router = useRouter();
  const haptic = useHaptic();
  const { openDrawer } = useAddVinyl();
  const [showDelete, setShowDelete] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTrackIndex, setPreviewTrackIndex] = useState<number | null>(null);

  const vinylQuery = useQuery(trpc.vinylGet.queryOptions({ id }));
  const vinyl = vinylQuery.data;

  const [discogsVideos, setDiscogsVideos] = useState<DiscogsVideo[]>([]);
  useEffect(() => {
    if (vinyl?.discogsId) {
      fetchReleaseDetail(vinyl.discogsId).then((d) => setDiscogsVideos(d.videos));
    }
  }, [vinyl?.discogsId]);

  const deleteVinyl = useMutation({
    ...trpc.vinylDelete.mutationOptions(),
    onSuccess: () => {
      haptic.trigger("success");
      queryClient.invalidateQueries({ queryKey: trpc.vinylsList.queryOptions().queryKey });
      toast.success("Vinilo eliminado");
      router.push("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

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
        <Link href="/dashboard" className="text-sm text-primary underline">Volver a coleccion</Link>
      </div>
    );
  }

  const meta = [
    vinyl.label && { icon: Tag, label: "Sello", value: vinyl.label },
    vinyl.genre && { icon: Music, label: "Genero", value: vinyl.genre },
    vinyl.style && { icon: Music, label: "Estilo", value: vinyl.style },
    vinyl.year && { icon: Calendar, label: "Ano", value: String(vinyl.year) },
    vinyl.bpm && { icon: Gauge, label: "BPM", value: String(vinyl.bpm) },
    vinyl.pricePaid != null && { icon: DollarSign, label: "Precio", value: `$${vinyl.pricePaid}` },
  ].filter(Boolean) as { icon: any; label: string; value: string }[];

  const searchQ = buildSearchQuery(vinyl.artist, vinyl.title);
  const discogsUrl = vinyl.discogsId ? `https://www.discogs.com/release/${vinyl.discogsId}` : null;
  const spotifySearchUrl = `https://open.spotify.com/search/${searchQ}`;
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${searchQ}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <Link href="/dashboard" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Coleccion
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row">
        {}
        <div className="aspect-square w-full shrink-0 overflow-hidden rounded-lg bg-muted shadow-md sm:w-56">
          {vinyl.coverUrl ? (
            <img src={vinyl.coverUrl} alt={vinyl.title} width={224} height={224} decoding="async" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Disc3 className="h-16 w-16 text-muted-foreground/20" />
            </div>
          )}
        </div>

        {}
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

          {}
          <div className="flex flex-wrap gap-2">
            {discogsUrl && (
              <a
                href={discogsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-accent"
              >
                <Disc3 className="h-3.5 w-3.5" /> Discogs
                <ExternalLink className="h-3 w-3 opacity-50" />
              </a>
            )}
            <a
              href={spotifySearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-accent"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              Spotify
              <ExternalLink className="h-3 w-3 opacity-50" />
            </a>
            <a
              href={youtubeSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-accent"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              YouTube
              <ExternalLink className="h-3 w-3 opacity-50" />
            </a>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Play className="h-3.5 w-3.5" />
              {showPreview ? "Ocultar preview" : "Preview"}
            </button>
          </div>

          {}
          {showPreview && (
            <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/20 p-3 shadow-sm">
              <p className="mb-2 text-center text-xs text-muted-foreground">Busca este vinilo en YouTube para escucharlo</p>
              <a
                href={youtubeSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" /><path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#fff" /></svg>
                Buscar en YouTube
              </a>
            </div>
          )}

          {}
          {vinyl.folders.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {vinyl.folders.map((fv: any) => (
                <Link
                  key={fv.folder.id}
                  href={`/folders/${fv.folder.id}` as any}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  <Folder className="h-3 w-3" />
                  {fv.folder.name}
                </Link>
              ))}
            </div>
          )}

          {}
          {vinyl.tags && vinyl.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {vinyl.tags.map((vt: any) => (
                <span
                  key={vt.tag.id}
                  className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium"
                >
                  <Tag className="h-3 w-3" />
                  {vt.tag.name}
                </span>
              ))}
            </div>
          )}

          {vinyl.notes && (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{vinyl.notes}</p>
          )}

          {}
          {vinyl.mixNotes && (
            <div className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                Notas de mezcla
              </div>
              <p className="whitespace-pre-wrap text-sm">{vinyl.mixNotes}</p>
            </div>
          )}

          {}
          {vinyl.tracks && vinyl.tracks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <ListMusic className="h-3.5 w-3.5" />
                Tracklist · {vinyl.tracks.length} tracks
              </div>
              <div className="rounded-md border border-border/60 overflow-hidden">
                {}
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

          {}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => openDrawer(vinyl.id)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Edit2 className="h-3.5 w-3.5" /> Editar
            </button>
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
            >
              <Trash2 className="h-3.5 w-3.5" /> Eliminar
            </button>
            <ExportPdf
              title={`${vinyl.artist} - ${vinyl.title}`}
              vinyls={[{
                title: vinyl.title,
                artist: vinyl.artist,
                label: vinyl.label ?? undefined,
                genre: vinyl.genre ?? undefined,
                year: vinyl.year ?? undefined,
                bpm: vinyl.bpm ?? undefined,
              }]}
            />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Eliminar vinilo"
        description={`Seguro que queres eliminar "${vinyl.title}" de ${vinyl.artist}? Esta accion no se puede deshacer.`}
        isLoading={deleteVinyl.isPending}
        onConfirm={() => deleteVinyl.mutate({ id: vinyl.id })}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
