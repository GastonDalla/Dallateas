"use client";

import { useEffect, useRef, useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Barcode, Camera, Disc3, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { ScannerButton } from "@/components/barcode-scanner";
import { CameraCapture } from "@/components/camera-capture";
import { useDebounce } from "@/hooks/use-debounce";
import { useHaptic } from "@/hooks/use-haptic";
import { fetchReleaseDetail, searchReleases, type DiscogsSearchRelease } from "@/lib/discogs";
import { queryClient, trpc } from "@/utils/trpc";

type TrackEntry = { side: string; position: number; title: string; duration?: string };

type VinylFormProps = {
  id?: string;
  onSaved?: () => void;
};

export function VinylForm({ id, onSaved }: VinylFormProps) {
  const haptic = useHaptic();
  const isEditMode = Boolean(id);

  const vinylQuery = useQuery({
    ...trpc.vinylGet.queryOptions({ id: id! }),
    enabled: isEditMode,
  });

  const foldersQuery = useQuery(trpc.foldersList.queryOptions());
  const vinylsKey = trpc.vinylsList.queryOptions().queryKey;

  const createVinyl = useMutation({
    ...trpc.vinylCreate.mutationOptions(),
    onSuccess: () => {
      haptic.trigger("success");
      queryClient.invalidateQueries({ queryKey: vinylsKey });
      toast.success("Vinilo guardado");
      onSaved?.();
    },
    onError: (err) => { haptic.trigger("error"); toast.error(err.message); },
  });

  const updateVinyl = useMutation({
    ...trpc.vinylUpdate.mutationOptions(),
    onSuccess: () => {
      haptic.trigger("success");
      queryClient.invalidateQueries({ queryKey: vinylsKey });
      if (id) queryClient.invalidateQueries({ queryKey: trpc.vinylGet.queryOptions({ id }).queryKey });
      toast.success("Vinilo actualizado");
      onSaved?.();
    },
    onError: (err) => toast.error(err.message),
  });

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [label, setLabel] = useState("");
  const [genre, setGenre] = useState("");
  const [style, setStyle] = useState("");
  const [bpm, setBpm] = useState("");
  const [year, setYear] = useState("");
  const [notes, setNotes] = useState("");
  const [mixNotes, setMixNotes] = useState("");
  const [pricePaid, setPricePaid] = useState("");
  const [discogsId, setDiscogsId] = useState("");
  const [barcode, setBarcode] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [folderIds, setFolderIds] = useState<string[]>([]);
  const [tagNames, setTagNames] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tracks, setTracks] = useState<TrackEntry[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [populated, setPopulated] = useState(false);

  const tagsQuery = useQuery(trpc.tagsList.queryOptions());

  const debouncedTitle = useDebounce(title, 500);
  const debouncedArtist = useDebounce(artist, 500);
  const duplicateQuery = useQuery({
    ...trpc.vinylCheckDuplicate.queryOptions({
      title: debouncedTitle.trim(),
      artist: debouncedArtist.trim(),
    }),
    enabled: !isEditMode && debouncedTitle.trim().length >= 2 && debouncedArtist.trim().length >= 2,
  });

  const [barcodeInput, setBarcodeInput] = useState("");
  const [searchMode, setSearchMode] = useState<"title" | "barcode">("title");

  const [discogsResults, setDiscogsResults] = useState<DiscogsSearchRelease[]>([]);
  const [isSearchingDiscogs, setIsSearchingDiscogs] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!vinylQuery.data || populated) return;
    const v = vinylQuery.data;
    setTitle(v.title);
    setArtist(v.artist);
    setLabel(v.label ?? "");
    setGenre(v.genre ?? "");
    setStyle(v.style ?? "");
    setBpm(v.bpm ? String(v.bpm) : "");
    setYear(v.year ? String(v.year) : "");
    setNotes(v.notes ?? "");
    setMixNotes(v.mixNotes ?? "");
    setPricePaid(v.pricePaid != null ? String(v.pricePaid) : "");
    setDiscogsId(v.discogsId ?? "");
    setBarcode(v.barcode ?? "");
    setCoverUrl(v.coverUrl ?? "");
    setFolderIds(v.folders.map((fv: any) => fv.folderId));
    setTagNames(v.tags?.map((vt: any) => vt.tag.name) ?? []);
    setTracks(v.tracks?.map((t: any) => ({ side: t.side, position: t.position, title: t.title, duration: t.duration ?? "" })) ?? []);
    setPopulated(true);
  }, [vinylQuery.data, populated]);

  const isSubmitting = createVinyl.isPending || updateVinyl.isPending;

  function toggleFolder(folderId: string) {
    setFolderIds((prev) =>
      prev.includes(folderId) ? prev.filter((f) => f !== folderId) : [...prev, folderId],
    );
  }

  function debouncedSearch(searchFn: () => Promise<DiscogsSearchRelease[]>) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;
      setIsSearchingDiscogs(true);
      try {
        const results = await searchFn();
        if (mountedRef.current) setDiscogsResults(results);
      } finally {
        if (mountedRef.current) setIsSearchingDiscogs(false);
      }
    }, 400);
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    if (value.trim().length < 3) {
      setDiscogsResults([]);
      return;
    }
    if (searchMode === "title") {
      debouncedSearch(() => searchReleases(value));
    }
  }

  function handleBarcodeSearch() {
    const code = barcodeInput.trim();
    if (!code) return;
    setIsSearchingDiscogs(true);
    searchReleases({ barcode: code })
      .then(setDiscogsResults)
      .finally(() => setIsSearchingDiscogs(false));
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function applyDiscogsRelease(release: DiscogsSearchRelease) {
    if (release.title) {
      const parts = release.title.split(" - ");
      if (parts.length >= 2) {
        setArtist(parts[0]!.trim());
        setTitle(parts.slice(1).join(" - ").trim());
      } else {
        setTitle(release.title);
      }
    }
    if (release.year) setYear(String(release.year));
    if (release.cover_image) setCoverUrl(release.cover_image);
    if (release.label?.[0]) setLabel(release.label[0]);
    if (release.genre?.[0]) setGenre(release.genre[0]);
    if (release.style?.length) setStyle(release.style.join(", "));
    if (release.id) setDiscogsId(String(release.id));
    setDiscogsResults([]);
    setBarcodeInput("");

    if (release.id) {
      setIsLoadingTracks(true);
      fetchReleaseDetail(release.id)
        .then((detail) => {
          if (!mountedRef.current) return;
          if (detail.tracklist.length > 0) {
            setTracks(detail.tracklist.map((t, i) => ({
              side: t.position || `${i + 1}`,
              position: i,
              title: t.title,
              duration: t.duration || undefined,
            })));
          }
          if (detail.barcode && !barcode) {
            setBarcode(detail.barcode);
          }
        })
        .finally(() => {
          if (mountedRef.current) setIsLoadingTracks(false);
        });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) {
      toast.error("Titulo y artista son requeridos");
      return;
    }
    const payload = {
      title: title.trim(),
      artist: artist.trim(),
      label: label.trim() || undefined,
      genre: genre.trim() || undefined,
      style: style.trim() || undefined,
      bpm: bpm ? Number(bpm) : undefined,
      year: year ? Number(year) : undefined,
      notes: notes.trim() || undefined,
      mixNotes: mixNotes.trim() || undefined,
      pricePaid: pricePaid ? Number(pricePaid) : undefined,
      discogsId: discogsId.trim() || undefined,
      barcode: barcode.trim() || undefined,
      coverUrl: coverUrl.trim() || undefined,
      folderIds,
      tagNames: tagNames.length > 0 ? tagNames : undefined,
      tracks: tracks.length > 0 ? tracks : undefined,
    };
    if (isEditMode && id) {
      updateVinyl.mutate({ ...payload, id });
    } else {
      createVinyl.mutate(payload, {
        onSuccess: () => {
          setTitle(""); setArtist(""); setLabel(""); setGenre(""); setStyle("");
          setBpm(""); setYear(""); setNotes(""); setMixNotes(""); setPricePaid(""); setBarcode(""); setCoverUrl("");
          setFolderIds([]); setTagNames([]); setTagInput(""); setTracks([]); setDiscogsResults([]); setBarcodeInput("");
        },
      });
    }
  }

  if (isEditMode && vinylQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Disc3 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const inputCls =
    "min-w-0 w-full rounded-md border border-border/60 bg-card px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 overflow-hidden">
      {}
      {!isEditMode && (
        <div className="flex gap-1 rounded-md bg-muted p-1">
          <button
            type="button"
            onClick={() => { setSearchMode("title"); setDiscogsResults([]); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${searchMode === "title" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            <Search className="h-3 w-3" /> Por titulo
          </button>
          <button
            type="button"
            onClick={() => { setSearchMode("barcode"); setDiscogsResults([]); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${searchMode === "barcode" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            <Barcode className="h-3 w-3" /> Por barcode
          </button>
        </div>
      )}

      {}
      {searchMode === "barcode" && !isEditMode && (
        <div className="grid gap-2">
          <label className="text-xs font-medium">Codigo de barras</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleBarcodeSearch(); } }}
              placeholder="Escanea o escribi el codigo..."
              inputMode="numeric"
              className={inputCls}
            />
            <ScannerButton
              onScan={(code) => {
                setBarcodeInput(code);
                setBarcode(code);
                setIsSearchingDiscogs(true);
                searchReleases({ barcode: code })
                  .then(setDiscogsResults)
                  .finally(() => setIsSearchingDiscogs(false));
              }}
            />
            <button
              type="button"
              onClick={handleBarcodeSearch}
              disabled={!barcodeInput.trim() || isSearchingDiscogs}
              className="shrink-0 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {isSearchingDiscogs ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
            </button>
          </div>
        </div>
      )}

      {}
      {discogsResults.length > 0 && (
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border/60 bg-card p-2">
          <p className="mb-1 text-[11px] font-medium text-muted-foreground">
            {discogsResults.length} resultados de Discogs
          </p>
          {discogsResults.map((release) => (
            <button
              key={release.id}
              type="button"
              onClick={() => applyDiscogsRelease(release)}
              className="flex w-full items-start gap-2 rounded-md bg-background p-2 text-left text-xs transition-colors hover:bg-accent"
            >
              {release.cover_image && (
                <img src={release.cover_image} alt="Portada" width={40} height={40} loading="lazy" decoding="async" className="h-10 w-10 shrink-0 rounded object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug">{release.title}</p>
                <div className="flex flex-wrap gap-x-2 text-[10px] text-muted-foreground">
                  {release.year && <span>{release.year}</span>}
                  {release.label?.[0] && <span>{release.label[0]}</span>}
                  {release.genre?.[0] && <span>{release.genre[0]}</span>}
                  {release.country && <span>{release.country}</span>}
                  {release.format?.[0] && <span>{release.format[0]}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isSearchingDiscogs && discogsResults.length === 0 && (
        <div className="flex items-center gap-2 rounded-md border border-border/60 bg-card px-3 py-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Buscando en Discogs...
        </div>
      )}

      <div className="grid gap-2">
        <label className="text-xs font-medium" htmlFor="title">Titulo *</label>
        <input id="title" type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)} maxLength={500} className={inputCls} placeholder="Nombre del vinilo" />
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-medium" htmlFor="artist">Artista *</label>
        <input id="artist" type="text" value={artist} onChange={(e) => setArtist(e.target.value)} maxLength={500} className={inputCls} />
      </div>

      {}
      {!isEditMode && duplicateQuery.data && duplicateQuery.data.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
          <div className="space-y-1">
            <p className="text-xs font-medium text-yellow-700">Posible duplicado</p>
            <p className="text-[11px] text-yellow-600">
              Ya tenes {duplicateQuery.data.length === 1 ? "un vinilo" : `${duplicateQuery.data.length} vinilos`} con datos similares:
            </p>
            <div className="space-y-1">
              {duplicateQuery.data.map((d: any) => (
                <p key={d.id} className="text-[11px] font-medium text-yellow-700">
                  {d.artist} — {d.title}
                </p>
              ))}
            </div>
            <p className="text-[10px] text-yellow-600">Podes guardarlo igual si es una copia intencional.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <label className="text-xs font-medium" htmlFor="label">Sello</label>
          <input id="label" type="text" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={500} className={inputCls} />
        </div>
        <div className="grid gap-2">
          <label className="text-xs font-medium" htmlFor="genre">Genero</label>
          <input id="genre" type="text" value={genre} onChange={(e) => setGenre(e.target.value)} maxLength={100} className={inputCls} />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-medium" htmlFor="style">Estilo</label>
        <input id="style" type="text" value={style} onChange={(e) => setStyle(e.target.value)} maxLength={200} placeholder="Techno, House, Minimal..." className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <label className="text-xs font-medium" htmlFor="bpm">BPM</label>
          <input id="bpm" type="number" inputMode="numeric" value={bpm} onChange={(e) => setBpm(e.target.value)} min={1} max={999} className={inputCls} />
        </div>
        <div className="grid gap-2">
          <label className="text-xs font-medium" htmlFor="year">Ano</label>
          <input id="year" type="number" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} min={1900} max={2100} className={inputCls} />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-medium" htmlFor="pricePaid">Precio pagado</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
          <input id="pricePaid" type="number" inputMode="decimal" step="0.01" value={pricePaid} onChange={(e) => setPricePaid(e.target.value)} min={0} max={999999} placeholder="0.00" className={`${inputCls} pl-7`} />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-medium" htmlFor="barcode">Codigo de barras</label>
        <div className="flex gap-2">
          <input id="barcode" type="text" inputMode="numeric" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="EAN / UPC" maxLength={50} className={inputCls} />
          <ScannerButton onScan={(code) => setBarcode(code)} />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-medium" htmlFor="coverUrl">Portada</label>
        <div className="flex gap-2">
          <input id="coverUrl" type="url" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="URL de imagen o toma una foto" maxLength={2000} className={inputCls} />
          <button
            type="button"
            onClick={() => setShowCamera(true)}
            className="shrink-0 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Tomar foto"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>
        {showCamera && (
          <CameraCapture
            onCapture={(dataUrl) => setCoverUrl(dataUrl)}
            onClose={() => setShowCamera(false)}
          />
        )}
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-medium">Carpetas</label>
        <div className="flex flex-wrap gap-2">
          {foldersQuery.data?.map((folder) => (
            <button key={folder.id} type="button" onClick={() => toggleFolder(folder.id)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${folderIds.includes(folder.id) ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              {folder.name}
            </button>
          ))}
          {(!foldersQuery.data || foldersQuery.data.length === 0) && (
            <p className="text-[11px] text-muted-foreground">Crea carpetas primero.</p>
          )}
        </div>
      </div>

      {}
      <div className="grid gap-2">
        <label className="text-xs font-medium">Tags</label>
        <div className="flex flex-wrap gap-1.5">
          {tagNames.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => setTagNames((prev) => prev.filter((t) => t !== tag))}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const name = tagInput.trim();
                if (name && !tagNames.includes(name)) {
                  setTagNames((prev) => [...prev, name]);
                  setTagInput("");
                }
              }
            }}
            placeholder="warm up, peak time, vocal..."
            maxLength={50}
            className={inputCls}
          />
        </div>
        {}
        {tagsQuery.data && tagsQuery.data.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tagsQuery.data
              .filter((t: any) => !tagNames.includes(t.name))
              .slice(0, 10)
              .map((t: any) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTagNames((prev) => [...prev, t.name])}
                  className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  + {t.name}
                </button>
              ))}
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-medium" htmlFor="notes">Notas</label>
        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={5000} className={inputCls} />
      </div>

      {}
      <div className="grid gap-2">
        <label className="text-xs font-medium" htmlFor="mixNotes">Notas de mezcla</label>
        <textarea
          id="mixNotes"
          value={mixNotes}
          onChange={(e) => setMixNotes(e.target.value)}
          rows={3}
          maxLength={5000}
          placeholder="Punto de entrada, punto de salida, con que mezcla bien, EQ tips..."
          className={inputCls}
        />
        <p className="text-[10px] text-muted-foreground">Anota lo que anotarias en el sleeve.</p>
      </div>

      {}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">Tracklist</label>
          {isLoadingTracks && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
        {tracks.length > 0 && (
          <div className="space-y-3">
            {tracks.map((track, i) => (
              <div key={i} className="rounded-md border border-border/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-muted-foreground">Track {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => setTracks(tracks.filter((_, j) => j !== i))}
                    aria-label={`Eliminar track ${i + 1}`}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
                <div className="grid grid-cols-[4rem_1fr] gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] text-muted-foreground">Posicion</label>
                    <input
                      type="text"
                      value={track.side}
                      onChange={(e) => {
                        const next = [...tracks];
                        next[i] = { ...next[i]!, side: e.target.value };
                        setTracks(next);
                      }}
                      aria-label={`Posicion del track ${i + 1}`}
                      placeholder="A1"
                      maxLength={10}
                      className={`${inputCls} text-center text-xs font-bold`}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-muted-foreground">Titulo</label>
                    <input
                      type="text"
                      value={track.title}
                      onChange={(e) => {
                        const next = [...tracks];
                        next[i] = { ...next[i]!, title: e.target.value };
                        setTracks(next);
                      }}
                      aria-label={`Titulo del track ${i + 1}`}
                      placeholder="Nombre del track"
                      maxLength={500}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-muted-foreground">Duracion</label>
                  <input
                    type="text"
                    value={track.duration ?? ""}
                    onChange={(e) => {
                      const next = [...tracks];
                      next[i] = { ...next[i]!, duration: e.target.value };
                      setTracks(next);
                    }}
                    aria-label={`Duracion del track ${i + 1}`}
                    placeholder="3:45"
                    maxLength={20}
                    className={`${inputCls} w-20 text-center text-xs`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() =>
            setTracks([...tracks, { side: "", position: tracks.length, title: "", duration: "" }])
          }
          className="inline-flex items-center gap-1.5 self-start rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> Agregar track
        </button>
      </div>

      <button type="submit" disabled={isSubmitting || !title.trim() || !artist.trim()} className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60">
        {isSubmitting ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
        ) : isEditMode ? "Guardar cambios" : "Guardar vinilo"}
      </button>
    </form>
  );
}
