"use client";

import { Button } from "@dallateas/ui/components/button";
import { Input } from "@dallateas/ui/components/input";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Check, Disc3, FileUp, Loader2, Upload } from "lucide-react";
import Link from "next/link";
import Papa from "papaparse";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { CustomSelect } from "@/components/custom-select";
import { Pagination } from "@/components/pagination";
import { queryClient, trpc } from "@/utils/trpc";

type ParsedRow = Record<string, string>;
type DiscogsRelease = {
  id: number;
  title: string;
  artist: string;
  year: number | null;
  label: string | null;
  genre: string | null;
  coverUrl: string | null;
  discogsId: string;
};

const KNOWN_FIELDS = ["title", "artist", "label", "genre", "year", "bpm"] as const;
type KnownField = (typeof KNOWN_FIELDS)[number];
const FIELD_LABELS: Record<KnownField, string> = {
  title: "Titulo", artist: "Artista", label: "Sello", genre: "Genero", year: "Ano", bpm: "BPM",
};

function guessMapping(headers: string[]): Record<KnownField, string> {
  const mapping: Record<string, string> = {};
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const field of KNOWN_FIELDS) {
    const idx = lower.findIndex((h) => {
      if (field === "title") return h === "title" || h === "titulo" || h === "nombre";
      if (field === "artist") return h === "artist" || h === "artista";
      if (field === "label") return h === "label" || h === "sello";
      if (field === "genre") return h === "genre" || h === "genero";
      if (field === "year") return h === "year" || h === "ano" || h === "año";
      if (field === "bpm") return h === "bpm" || h === "tempo";
      return false;
    });
    mapping[field] = idx >= 0 ? headers[idx]! : "";
  }
  return mapping as Record<KnownField, string>;
}

export default function ImportPage() {
  const [tab, setTab] = useState<"csv" | "discogs">("csv");

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<KnownField, string>>({} as any);
  const [fileName, setFileName] = useState("");

  const [discogsUsername, setDiscogsUsername] = useState("");
  const [discogsReleases, setDiscogsReleases] = useState<DiscogsRelease[]>([]);
  const [discogsLoading, setDiscogsLoading] = useState(false);
  const [discogsTotal, setDiscogsTotal] = useState(0);
  const [discogsPage, setDiscogsPage] = useState(1);
  const [discogsPages, setDiscogsPages] = useState(1);
  const [discogsPerPage, setDiscogsPerPage] = useState(25);
  const [selectedDiscogs, setSelectedDiscogs] = useState<Set<number>>(new Set());
  const [discogsSearch, setDiscogsSearch] = useState("");
  const [discogsFetched, setDiscogsFetched] = useState(false);
  const [importingAll, setImportingAll] = useState(false);

  const bulkCreate = useMutation({
    ...trpc.vinylBulkCreate.mutationOptions(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: trpc.vinylsList.queryOptions().queryKey });
      toast.success(`Se importaron ${data.count} vinilos`);
    },
    onError: () => toast.error("Error al importar"),
  });

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    Papa.parse<ParsedRow>(file, {
      header: true,
      complete: (results) => {
        const data = results.data.filter((row) => Object.values(row).some((v) => v?.trim()));
        setRows(data);
        const headers = results.meta.fields ?? [];
        setCsvHeaders(headers);
        setMapping(guessMapping(headers));
      },
    });
  }, []);

  const mappedVinyls = useMemo(() => {
    if (!mapping.title || !mapping.artist) return [];
    return rows
      .filter((row) => row[mapping.title]?.trim() && row[mapping.artist]?.trim())
      .map((row) => ({
        title: row[mapping.title]!.trim(),
        artist: row[mapping.artist]!.trim(),
        label: mapping.label ? row[mapping.label]?.trim() || undefined : undefined,
        genre: mapping.genre ? row[mapping.genre]?.trim() || undefined : undefined,
        year: mapping.year ? parseInt(row[mapping.year] ?? "", 10) || undefined : undefined,
        bpm: mapping.bpm ? parseInt(row[mapping.bpm] ?? "", 10) || undefined : undefined,
      }));
  }, [rows, mapping]);

  async function fetchDiscogsPage(page: number, perPage?: number) {
    const pp = perPage ?? discogsPerPage;
    if (!discogsUsername.trim()) { toast.error("Ingresa tu usuario de Discogs"); return; }
    setDiscogsLoading(true);
    try {
      const res = await fetch(`/api/discogs/collection?username=${encodeURIComponent(discogsUsername.trim())}&page=${page}&per_page=${pp}`);
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error al obtener coleccion"); return; }
      setDiscogsReleases(data.releases);
      setDiscogsTotal(data.pagination.items);
      setDiscogsPage(data.pagination.page);
      setDiscogsPages(data.pagination.pages);
      setDiscogsFetched(true);
      setDiscogsSearch("");
      setSelectedDiscogs(new Set(data.releases.map((r: DiscogsRelease) => r.id)));
    } catch { toast.error("Error de conexion"); } finally { setDiscogsLoading(false); }
  }

  function toggleDiscogsSelect(id: number) {
    setSelectedDiscogs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleImportSelected() {
    const selected = discogsReleases.filter((r) => selectedDiscogs.has(r.id));
    if (selected.length === 0) { toast.error("Selecciona al menos un vinilo"); return; }
    bulkCreate.mutate({
      vinyls: selected.map((r) => ({
        title: r.title,
        artist: r.artist,
        label: r.label || undefined,
        genre: r.genre || undefined,
        year: r.year || undefined,
        discogsId: r.discogsId,
        coverUrl: r.coverUrl || undefined,
      })),
    });
  }

  async function handleImportAll() {
    if (!discogsUsername.trim() || discogsTotal === 0) return;
    setImportingAll(true);
    const allReleases: DiscogsRelease[] = [];
    try {
      for (let p = 1; p <= discogsPages; p++) {
        toast.info(`Cargando pagina ${p}/${discogsPages}...`);
        const res = await fetch(`/api/discogs/collection?username=${encodeURIComponent(discogsUsername.trim())}&page=${p}&per_page=100`);
        const data = await res.json();
        if (!res.ok) break;
        allReleases.push(...data.releases);
      }
      if (allReleases.length === 0) { toast.error("No se encontraron vinilos"); return; }
      toast.info(`Importando ${allReleases.length} vinilos...`);
      for (let i = 0; i < allReleases.length; i += 50) {
        const batch = allReleases.slice(i, i + 50);
        await new Promise<void>((resolve, reject) => {
          bulkCreate.mutate({
            vinyls: batch.map((r) => ({
              title: r.title, artist: r.artist,
              label: r.label || undefined, genre: r.genre || undefined,
              year: r.year || undefined, discogsId: r.discogsId,
              coverUrl: r.coverUrl || undefined,
            })),
          }, { onSuccess: () => resolve(), onError: () => reject() });
        });
      }
      toast.success(`Se importaron ${allReleases.length} vinilos`);
    } catch { toast.error("Error al importar coleccion completa"); }
    finally { setImportingAll(false); }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24">
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver al dashboard
      </Link>

      <h1 className="font-heading mb-6 text-2xl font-bold">Importar vinilos</h1>

      {}
      <div className="mb-6 flex gap-1 rounded-md bg-muted p-1">
        <button type="button" onClick={() => setTab("csv")} className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-2 text-xs font-medium transition-colors ${tab === "csv" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
          <Upload className="h-3.5 w-3.5" /> Archivo CSV
        </button>
        <button type="button" onClick={() => setTab("discogs")} className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-2 text-xs font-medium transition-colors ${tab === "discogs" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
          <Disc3 className="h-3.5 w-3.5" /> Discogs
        </button>
      </div>

      {}
      {tab === "csv" && (
        <>
          <div className="mb-6 rounded-lg border border-border/60 bg-card p-6 shadow-sm">
            <label htmlFor="csv-upload" className="flex cursor-pointer flex-col items-center gap-3 rounded-md border-2 border-dashed border-border/60 px-6 py-10 transition-colors hover:border-primary/40">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{fileName || "Selecciona un archivo CSV"}</span>
              <input id="csv-upload" type="file" accept=".csv" onChange={handleFile} className="hidden" />
            </label>
          </div>

          {csvHeaders.length > 0 && (
            <div className="mb-6 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
              <h2 className="font-heading mb-3 text-lg font-semibold">Mapeo de columnas</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {KNOWN_FIELDS.map((field) => (
                  <div key={field}>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      {FIELD_LABELS[field]}{(field === "title" || field === "artist") && <span className="text-red-500"> *</span>}
                    </label>
                    <CustomSelect
                      value={mapping[field] ?? ""}
                      onChange={(v) => setMapping((prev) => ({ ...prev, [field]: v }))}
                      options={[
                        { value: "", label: "— Sin mapear —" },
                        ...csvHeaders.map((h) => ({ value: h, label: h })),
                      ]}
                      placeholder="— Sin mapear —"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {rows.length > 0 && (
            <Button type="button" onClick={() => { if (mappedVinyls.length === 0) { toast.error("Mapea titulo y artista"); return; } bulkCreate.mutate({ vinyls: mappedVinyls }); }} disabled={bulkCreate.isPending || mappedVinyls.length === 0}>
              {bulkCreate.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importando...</> : <><FileUp className="mr-2 h-4 w-4" />Importar {mappedVinyls.length} vinilos</>}
            </Button>
          )}
        </>
      )}

      {}
      {tab === "discogs" && (
        <>
          <div className="mb-6 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
            <h2 className="font-heading mb-3 font-semibold">Importar desde Discogs</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Ingresa tu nombre de usuario de Discogs para importar tu coleccion. Tu coleccion debe ser publica en Discogs.
            </p>
            <div className="flex gap-2">
              <Input value={discogsUsername} onChange={(e) => setDiscogsUsername(e.target.value)} placeholder="Tu usuario de Discogs" onKeyDown={(e) => { if (e.key === "Enter") fetchDiscogsPage(1); }} />
              <Button type="button" onClick={() => fetchDiscogsPage(1)} disabled={discogsLoading || !discogsUsername.trim()}>
                {discogsLoading && !importingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
              </Button>
            </div>
          </div>

          {}
          {discogsFetched && discogsReleases.length === 0 && !discogsLoading && (
            <div className="rounded-lg border border-border/60 bg-card p-8 text-center shadow-sm">
              <Disc3 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Este usuario no tiene vinilos en su coleccion de Discogs, o la coleccion es privada.</p>
            </div>
          )}

          {discogsReleases.length > 0 && (
            <>
              {}
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {discogsTotal} vinilos en Discogs · {selectedDiscogs.size} seleccionados
                </p>
                <div className="flex items-center gap-3">
                  {selectedDiscogs.size > 0 && (
                    <button type="button" onClick={() => setSelectedDiscogs(new Set())} className="text-xs text-destructive hover:underline">
                      Deseleccionar todos ({selectedDiscogs.size})
                    </button>
                  )}
                  <button type="button" onClick={() => {
                    const pageIds = discogsReleases.map((r) => r.id);
                    const allPageSelected = pageIds.every((id) => selectedDiscogs.has(id));
                    setSelectedDiscogs((prev) => {
                      const next = new Set(prev);
                      if (allPageSelected) { for (const id of pageIds) next.delete(id); }
                      else { for (const id of pageIds) next.add(id); }
                      return next;
                    });
                  }} className="text-xs text-primary hover:underline">
                    {discogsReleases.every((r) => selectedDiscogs.has(r.id)) ? "Deseleccionar pagina" : "Seleccionar pagina"}
                  </button>
                </div>
              </div>

              {}
              <div className="mb-3">
                <Input value={discogsSearch} onChange={(e) => setDiscogsSearch(e.target.value)} placeholder="Filtrar en esta pagina..." className="text-sm" />
              </div>

              {}
              <div className="mb-4 space-y-1.5">
                {discogsReleases
                  .filter((r) => {
                    if (!discogsSearch.trim()) return true;
                    const q = discogsSearch.toLowerCase();
                    return r.title.toLowerCase().includes(q) || r.artist.toLowerCase().includes(q) || (r.label?.toLowerCase().includes(q) ?? false);
                  })
                  .map((r) => (
                  <button key={r.id} type="button" onClick={() => toggleDiscogsSelect(r.id)} className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${selectedDiscogs.has(r.id) ? "border-primary/40 bg-primary/5" : "border-border/60 bg-card"}`}>
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selectedDiscogs.has(r.id) ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                      {selectedDiscogs.has(r.id) && <Check className="h-3 w-3" />}
                    </div>
                    {r.coverUrl && <img src={r.coverUrl} alt="" className="h-10 w-10 shrink-0 rounded object-cover" width={40} height={40} loading="lazy" decoding="async" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.artist} — {r.title}</p>
                      <p className="text-[11px] text-muted-foreground">{[r.year, r.label, r.genre].filter(Boolean).join(" · ")}</p>
                    </div>
                  </button>
                ))}
              </div>

              {}
              <div className="mb-6">
                <Pagination
                  page={discogsPage}
                  totalPages={discogsPages}
                  totalItems={discogsTotal}
                  pageSize={discogsPerPage}
                  onPageChange={(p) => fetchDiscogsPage(p)}
                  onPageSizeChange={(size) => { setDiscogsPerPage(size); fetchDiscogsPage(1, size); }}
                  pageSizeOptions={[10, 25, 50, 100]}
                />
              </div>

              {}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" onClick={handleImportSelected} disabled={bulkCreate.isPending || importingAll || selectedDiscogs.size === 0} className="flex-1">
                  {bulkCreate.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importando...</> : <><FileUp className="mr-2 h-4 w-4" />Importar {selectedDiscogs.size} seleccionados</>}
                </Button>
                {discogsTotal > discogsReleases.length && (
                  <Button type="button" variant="outline" onClick={handleImportAll} disabled={bulkCreate.isPending || importingAll}>
                    {importingAll ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importando toda la coleccion...</> : <><Disc3 className="mr-2 h-4 w-4" />Importar toda la coleccion ({discogsTotal})</>}
                  </Button>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
