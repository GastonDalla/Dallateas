"use client";

import { Button } from "@dallateas/ui/components/button";
import { skipToken, useMutation, useQuery } from "@tanstack/react-query";
import { Barcode, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useHaptic } from "@/hooks/use-haptic";
import { useBpmAutofill } from "@/components/bpm-autofill";
import { useInvalidateCollection } from "@/hooks/use-invalidate-collection";
import { fetchReleaseDetail, type DiscogsSearchRelease } from "@/lib/discogs";
import { trpc } from "@/utils/trpc";

import { BarcodeLookup } from "./vinyl-form/barcode-lookup";
import { CrateTags } from "./vinyl-form/crate-tags";
import { DiscogsResults } from "./vinyl-form/discogs-results";
import { DuplicateWarning } from "./vinyl-form/duplicate-warning";
import { actionClass, controlClass, Field, FormSection } from "./vinyl-form/field";
import {
  emptyFormValues,
  formError,
  formValuesFromVinyl,
  mergeDiscogsTracks,
  toCreateInput,
  toUpdateInput,
  valuesFromRelease,
  type VinylFormValues,
} from "./vinyl-form/form-state";
import { CrateFields, IdentifierFields, NotesFields, SleeveFields } from "./vinyl-form/record-fields";
import { Segmented } from "./vinyl-form/segmented";
import { TracksEditor } from "./vinyl-form/tracks-editor";
import { useDiscogsSearch, type SearchMode } from "./vinyl-form/use-discogs-search";

const SEARCH_MODES = [
  { value: "title", label: <><Search aria-hidden="true" className="size-3.5" /> Por título</> },
  { value: "barcode", label: <><Barcode aria-hidden="true" className="size-3.5" /> Por código</> },
] satisfies { value: SearchMode; label: React.ReactNode }[];

type VinylFormBodyProps = {
  id?: string;
  initialValues: VinylFormValues;
  onSaved: () => void;
};

function VinylFormBody({ id, initialValues, onSaved }: VinylFormBodyProps) {
  const haptic = useHaptic();
  const invalidate = useInvalidateCollection();
  const autofillBpm = useBpmAutofill();
  const discogs = useDiscogsSearch();
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState<string | null>(null);

  function change(changes: Partial<VinylFormValues>) {
    setValues((current) => ({ ...current, ...changes }));
  }

  function handleSaved(message: string) {
    haptic.trigger("success");
    void invalidate(id);
    toast.success(message);
    onSaved();
  }

  function handleFailed(failure: { message: string }) {
    haptic.trigger("error");
    setError(failure.message);
  }

  const createVinyl = useMutation(
    trpc.vinylCreate.mutationOptions({
      onSuccess: (vinyl) => {
        // Its tracks get their tempo while the DJ carries on: a record is added, not looked up by hand.
        if (values.tracks.length > 0) autofillBpm({ id: vinyl.id, title: vinyl.title });
        handleSaved("Vinilo guardado");
      },
      onError: handleFailed,
    }),
  );
  const updateVinyl = useMutation(
    trpc.vinylUpdate.mutationOptions({ onSuccess: () => handleSaved("Vinilo actualizado"), onError: handleFailed }),
  );
  const isSaving = createVinyl.isPending || updateVinyl.isPending;

  const releaseDetail = useMutation({
    mutationFn: fetchReleaseDetail,
    onSuccess: ({ tracklist, barcode }) => {
      setValues((current) => ({
        ...current,
        tracks: tracklist.length > 0 ? mergeDiscogsTracks(current.tracks, tracklist) : current.tracks,
        barcode: current.barcode || barcode || "",
      }));
    },
  });

  function applyRelease(release: DiscogsSearchRelease) {
    change(valuesFromRelease(release));
    discogs.clear();
    releaseDetail.mutate(release.id);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const problem = formError(values);
    setError(problem);
    if (problem) return;

    if (id) updateVinyl.mutate(toUpdateInput(values, id));
    else createVinyl.mutate(toCreateInput(values));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!id && (
        <Segmented label="Buscar en Discogs" options={SEARCH_MODES} value={discogs.mode} onChange={discogs.changeMode} className="flex" />
      )}

      {!id && discogs.mode === "barcode" && (
        <BarcodeLookup
          isSearching={discogs.isSearching}
          onSearch={discogs.searchBarcode}
          onScan={(barcode) => {
            change({ barcode });
            discogs.searchBarcode(barcode);
          }}
        />
      )}

      <DiscogsResults
        results={discogs.results}
        isSearching={discogs.isSearching}
        failed={discogs.failed}
        foundNothing={discogs.foundNothing}
        onPick={applyRelease}
      />

      <div className="flex flex-col gap-3">
        <Field label="Título" htmlFor="title">
          <input
            id="title"
            type="text"
            required
            value={values.title}
            onChange={(event) => {
              change({ title: event.target.value });
              if (discogs.mode === "title") discogs.searchTitle(event.target.value);
            }}
            maxLength={500}
            autoComplete="off"
            className={controlClass}
          />
        </Field>
        <Field label="Artista" htmlFor="artist">
          <input
            id="artist"
            type="text"
            required
            value={values.artist}
            onChange={(event) => change({ artist: event.target.value })}
            maxLength={500}
            autoComplete="off"
            className={controlClass}
          />
        </Field>
        {!id && <DuplicateWarning title={values.title} artist={values.artist} />}
        <SleeveFields values={values} onChange={change} />
      </div>

      <FormSection title="En la batea">
        <CrateFields values={values} onChange={change} />
      </FormSection>

      <TracksEditor tracks={values.tracks} isLoading={releaseDetail.isPending} onChange={(tracks) => change({ tracks })} />

      <FormSection title="Código y portada">
        <IdentifierFields values={values} onChange={change} />
      </FormSection>

      <CrateTags
        folderIds={values.folderIds}
        onChange={(folderIds) => change({ folderIds })}
        tagNames={values.tagNames}
        onTagsChange={(tagNames) => change({ tagNames })}
      />

      <NotesFields values={values} onChange={change} />

      <div className="sticky bottom-0 -mx-4 -mb-4 flex flex-col gap-2 border-t border-border bg-background p-4">
        {error && (
          <p role="alert" className="text-[13px] font-medium text-clash">
            {error}
          </p>
        )}
        <Button type="submit" disabled={isSaving} className={`${actionClass} w-full md:h-9`}>
          {isSaving && <Loader2 aria-hidden="true" className="animate-spin" />}
          {isSaving ? "Guardando" : id ? "Guardar cambios" : "Guardar vinilo"}
        </Button>
      </div>
    </form>
  );
}

type VinylFormProps = {
  id?: string;
  onSaved: () => void;
};

export function VinylForm({ id, onSaved }: VinylFormProps) {
  const vinylQuery = useQuery(trpc.vinylGet.queryOptions(id ? { id } : skipToken));

  if (!id) return <VinylFormBody initialValues={emptyFormValues()} onSaved={onSaved} />;

  if (vinylQuery.isLoading) {
    return (
      <div role="status" aria-label="Cargando el vinilo" className="flex justify-center py-12">
        <Loader2 aria-hidden="true" className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!vinylQuery.data) return <p className="py-12 text-sm text-muted-foreground">No pudimos cargar este vinilo</p>;

  return <VinylFormBody key={id} id={id} initialValues={formValuesFromVinyl(vinylQuery.data)} onSaved={onSaved} />;
}
