"use client";

import { Button } from "@dallateas/ui/components/button";
import { skipToken, useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Folder, Pencil, Tag, Trash2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useAddVinyl } from "@/components/add-vinyl-context";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Cover } from "@/components/dj/cover";
import { RecordSticker } from "@/components/dj/track-tempo";
import { ExportPdf } from "@/components/export-pdf";
import { EmptyState } from "@/components/shell/empty-state";
import { actionClass } from "@/components/vinyl-form/field";
import { useHaptic } from "@/hooks/use-haptic";
import { useInvalidateCollection } from "@/hooks/use-invalidate-collection";
import { fetchReleaseDetail } from "@/lib/discogs";
import { trpc } from "@/utils/trpc";

import VinylLoading from "./loading";
import { RecordFacts } from "./record-facts";
import { RecordLinks } from "./record-links";
import { Tracklist } from "./tracklist";
import type { Vinyl } from "./types";

const RELEASE_CACHE_MS = 60 * 60_000;

const CHIP = "inline-flex min-h-8 items-center gap-1.5 rounded-sm bg-muted px-2.5 text-[13px] font-medium";

function BackLink() {
  return (
    <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-1.5 self-start text-[13px] text-muted-foreground transition-colors duration-[120ms] hover:text-foreground md:min-h-0">
      <ArrowLeft aria-hidden="true" className="size-4" />
      Colección
    </Link>
  );
}

function RecordPage({ vinyl }: { vinyl: Vinyl }) {
  const router = useRouter();
  const haptic = useHaptic();
  const invalidate = useInvalidateCollection();
  const { openDrawer } = useAddVinyl();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const { discogsId } = vinyl;
  const release = useQuery({
    queryKey: ["discogs-release", discogsId],
    queryFn: discogsId ? () => fetchReleaseDetail(discogsId) : skipToken,
    staleTime: RELEASE_CACHE_MS,
  });
  const videos = release.data?.videos ?? [];

  const deleteVinyl = useMutation(
    trpc.vinylDelete.mutationOptions({
      onSuccess: () => {
        haptic.trigger("success");
        void invalidate();
        toast.success("Vinilo eliminado");
        router.push("/dashboard");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const markPlayed = useMutation(
    trpc.vinylMarkPlayed.mutationOptions({
      onSuccess: () => {
        haptic.trigger("success");
        void invalidate(vinyl.id);
        toast.success("Anotado");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:px-8 md:py-8">
      <BackLink />

      <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4 gap-y-6 [grid-template-areas:'cover_head'_'actions_actions'_'tracks_tracks'_'facts_facts'_'extra_extra'] md:grid-cols-[14rem_minmax(0,1fr)] md:gap-x-8 md:[grid-template-areas:'cover_head'_'cover_actions'_'cover_facts'_'tracks_tracks'_'extra_extra'] md:grid-rows-[auto_auto_1fr]">
        <div className="relative self-start [grid-area:cover]">
          <Cover src={vinyl.coverUrl} alt={`Tapa de ${vinyl.title}`} sizes="(min-width: 768px) 224px, 112px" priority />
          <RecordSticker tracks={vinyl.tracks} bpm={vinyl.bpm} size="md" className="absolute top-1.5 left-1.5" />
        </div>

        <header className="min-w-0 [grid-area:head]">
          <h1 className="font-heading text-3xl leading-none font-bold text-balance md:text-4xl">{vinyl.title}</h1>
          <p className="mt-1 text-base text-muted-foreground">{vinyl.artist}</p>
        </header>

        <div className="flex flex-wrap gap-2 [grid-area:actions]">
          <Button type="button" variant="outline" className={actionClass} onClick={() => openDrawer(vinyl.id)}>
            <Pencil aria-hidden="true" />
            Editar
          </Button>
          <Button
            type="button"
            variant="outline"
            className={actionClass}
            disabled={markPlayed.isPending}
            onClick={() => markPlayed.mutate({ id: vinyl.id })}
          >
            <Check aria-hidden="true" />
            Sonó hoy
          </Button>
          <ExportPdf
            title={`${vinyl.artist} - ${vinyl.title}`}
            vinyls={[
              {
                title: vinyl.title,
                artist: vinyl.artist,
                label: vinyl.label ?? undefined,
                genre: vinyl.genre ?? undefined,
                year: vinyl.year ?? undefined,
                bpm: vinyl.bpm ?? undefined,
                tracks: vinyl.tracks,
              },
            ]}
          />
          <Button type="button" variant="destructive" className={actionClass} onClick={() => setConfirmingDelete(true)}>
            <Trash2 aria-hidden="true" />
            Eliminar
          </Button>
        </div>

        <div className="min-w-0 [grid-area:facts]">
          <RecordFacts vinyl={vinyl} />
        </div>

        <div className="min-w-0 [grid-area:tracks]">
          <Tracklist vinyl={vinyl} videos={videos} />
        </div>

        <div className="flex min-w-0 flex-col gap-5 [grid-area:extra]">
          {(vinyl.folders.length > 0 || vinyl.tags.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {vinyl.folders.map(({ folder }) => (
                <Link
                  key={folder.id}
                  href={`/folders/${folder.id}` as Route}
                  className={`${CHIP} transition-colors duration-[120ms] hover:bg-accent hover:text-accent-foreground`}
                >
                  <Folder aria-hidden="true" className="size-3.5" />
                  {folder.name}
                </Link>
              ))}
              {vinyl.tags.map(({ tag }) => (
                <span key={tag.id} className={CHIP}>
                  <Tag aria-hidden="true" className="size-3.5" />
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {vinyl.mixNotes && (
            <section aria-label="Notas de mezcla">
              <h2 className="font-sans text-[13px] text-muted-foreground">Notas de mezcla</h2>
              <p className="mt-1 max-w-prose text-sm whitespace-pre-wrap">{vinyl.mixNotes}</p>
            </section>
          )}

          {vinyl.notes && (
            <section aria-label="Notas">
              <h2 className="font-sans text-[13px] text-muted-foreground">Notas</h2>
              <p className="mt-1 max-w-prose text-sm whitespace-pre-wrap">{vinyl.notes}</p>
            </section>
          )}

          <RecordLinks vinyl={vinyl} videos={videos} />
        </div>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Eliminar vinilo"
        description={`¿Seguro que querés eliminar "${vinyl.title}" de ${vinyl.artist}? No se puede deshacer.`}
        isLoading={deleteVinyl.isPending}
        onConfirm={() => deleteVinyl.mutate({ id: vinyl.id })}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}

export default function VinylDetail({ id }: { id: string }) {
  const { data: vinyl, isLoading } = useQuery(trpc.vinylGet.queryOptions({ id }));

  if (isLoading) return <VinylLoading />;

  if (!vinyl) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:px-8 md:py-8">
        <BackLink />
        <EmptyState title="Vinilo no encontrado" description="Puede que lo hayas eliminado, o que el link no sea tuyo" />
      </div>
    );
  }

  return <RecordPage vinyl={vinyl} />;
}
