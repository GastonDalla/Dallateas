"use client";

import { useMemo, useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { BarChart3, Copy, Disc3, FolderPlus, MoreVertical, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { ScannerButton } from "@/components/barcode-scanner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FilterSelect } from "@/components/filter-select";
import { VinylCard } from "@/components/vinyl-card";
import { useDebounce } from "@/hooks/use-debounce";
import { useHaptic } from "@/hooks/use-haptic";
import { queryClient, trpc } from "@/utils/trpc";

export default function Dashboard() {
  const haptic = useHaptic();
  const [search, setSearch] = useState("");
  const [activeFolderId, setActiveFolderId] = useState<string | undefined>();
  const [genreFilters, setGenreFilters] = useState<string[]>([]);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [styleFilters, setStyleFilters] = useState<string[]>([]);
  const [barcodeFilter, setBarcodeFilter] = useState<string | undefined>();
  const debouncedSearch = useDebounce(search, 300);

  const foldersQuery = useQuery(trpc.foldersList.queryOptions());
  const statsQuery = useQuery(trpc.collectionStats.queryOptions());
  const genresQuery = useQuery(trpc.userGenres.queryOptions());
  const stylesQuery = useQuery(trpc.userStyles.queryOptions());
  const tagsQuery = useQuery(trpc.tagsList.queryOptions());
  const vinylsQuery = useQuery(
    trpc.vinylsList.queryOptions({
      search: debouncedSearch || undefined,
      folderId: activeFolderId,
      genres: genreFilters.length > 0 ? genreFilters : undefined,
      styles: styleFilters.length > 0 ? styleFilters : undefined,
      tagIds: tagFilters.length > 0 ? tagFilters : undefined,
      barcode: barcodeFilter,
    }),
  );

  const folders = foldersQuery.data ?? [];
  const genres = genresQuery.data ?? [];
  const styles = stylesQuery.data ?? [];
  const tags = tagsQuery.data ?? [];
  const vinyls = vinylsQuery.data?.items ?? vinylsQuery.data ?? [];
  const [folderFilter, setFolderFilter] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteVinylId, setDeleteVinylId] = useState<string | null>(null);
  const [moveVinylId, setMoveVinylId] = useState<string | null>(null);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);

  const vinylsKey = trpc.vinylsList.queryOptions().queryKey;

  const foldersKey = trpc.foldersList.queryOptions().queryKey;

  const deleteVinyl = useMutation({
    ...trpc.vinylDelete.mutationOptions(),
    onSuccess: () => {
      haptic.trigger("success");
      queryClient.invalidateQueries({ queryKey: vinylsKey });
      queryClient.invalidateQueries({ queryKey: foldersKey });
      setDeleteVinylId(null);
      toast.success("Vinilo eliminado");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateVinyl = useMutation({
    ...trpc.vinylUpdate.mutationOptions(),
    onSuccess: () => {
      haptic.trigger("success");
      queryClient.invalidateQueries({ queryKey: vinylsKey });
      queryClient.invalidateQueries({ queryKey: foldersKey });
      setMoveVinylId(null);
      toast.success("Vinilo movido");
    },
    onError: (err) => toast.error(err.message),
  });

  const activeFolder = useMemo(
    () => folders.find((f) => f.id === activeFolderId),
    [folders, activeFolderId],
  );

  const filteredFolders = useMemo(() => {
    if (!folderFilter.trim()) return folders;
    const q = folderFilter.toLowerCase();
    return folders.filter((f) => f.name.toLowerCase().includes(q));
  }, [folders, folderFilter]);

  return (
    <div className="flex h-full flex-col gap-4 p-4 pb-20">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold">Tu coleccion</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{Array.isArray(vinyls) ? vinyls.length : 0} vinilos</span>
              {statsQuery.data?.totalValue != null && (
                <>
                  <span>·</span>
                  <span className="font-medium text-primary">${statsQuery.data.totalValue.toLocaleString()}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Link href="/import" className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Importar CSV">
              <Upload className="h-4 w-4" />
            </Link>
            <Link href="/stats" className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Estadisticas">
              <BarChart3 className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setBarcodeFilter(undefined); }}
            placeholder="Buscar por titulo, artista o sello..."
            className="flex-1 rounded-md border border-border/60 bg-card px-3 py-2.5 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          />
          <ScannerButton
            onScan={(code) => {
              setBarcodeFilter(code);
              setSearch("");
            }}
            className="shrink-0 rounded-md border border-border/60 bg-card px-3 py-2.5 text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
          />
        </div>
        {barcodeFilter && (
          <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1.5 text-xs text-primary">
            <span>Codigo: {barcodeFilter}</span>
            <button type="button" onClick={() => setBarcodeFilter(undefined)} className="hover:text-primary/70">✕</button>
          </div>
        )}

        {folders.length > 8 && (
          <input
            type="text"
            value={folderFilter}
            onChange={(e) => setFolderFilter(e.target.value)}
            placeholder="Filtrar carpetas..."
            className="rounded-md border border-border/60 bg-card px-3 py-1.5 text-xs shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary"
          />
        )}

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button
            type="button"
            onClick={() => setActiveFolderId(undefined)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              !activeFolderId
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-muted-foreground shadow-sm hover:text-foreground"
            }`}
          >
            Todas
          </button>
          {filteredFolders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() =>
                setActiveFolderId(
                  activeFolderId === folder.id ? undefined : folder.id,
                )
              }
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                activeFolderId === folder.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-muted-foreground shadow-sm hover:text-foreground"
              }`}
            >
              {folder.name}
              <span className="ml-1 opacity-60">{folder._count.vinyls}</span>
            </button>
          ))}
        </div>

        {/* Filters row */}
        {(genres.length > 0 || styles.length > 0 || tags.length > 0) && (
          <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1">
            <span className="shrink-0 text-[11px] font-medium text-muted-foreground">Filtros:</span>
            <FilterSelect
              label="Genero"
              options={genres.map((g) => ({ value: g, label: g }))}
              multi
              values={genreFilters}
              onChangeMulti={setGenreFilters}
              placeholder="Genero"
            />
            <FilterSelect
              label="Estilo"
              options={styles.map((s) => ({ value: s, label: s }))}
              multi
              values={styleFilters}
              onChangeMulti={setStyleFilters}
              placeholder="Estilo"
            />
            <FilterSelect
              label="Tag"
              options={tags.map((t: any) => ({
                value: t.id,
                label: t.name,
                count: t._count?.vinyls,
              }))}
              multi
              values={tagFilters}
              onChangeMulti={setTagFilters}
              placeholder="Tag"
            />
            {(genreFilters.length > 0 || styleFilters.length > 0 || tagFilters.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setGenreFilters([]);
                  setStyleFilters([]);
                  setTagFilters([]);
                }}
                className="shrink-0 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {activeFolder && (
          <p className="text-xs text-muted-foreground">
            Viendo:{" "}
            <span className="font-medium text-foreground">
              {activeFolder.name}
            </span>
          </p>
        )}
      </header>

      <main className="flex-1">
        {vinylsQuery.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Disc3 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : vinyls.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Disc3 className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {debouncedSearch || genreFilters.length > 0 || styleFilters.length > 0 || tagFilters.length > 0
                ? "No se encontraron vinilos con esos filtros."
                : "Aun no tenes vinilos. Apreta el boton + para agregar tu primer vinilo."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {vinyls.map((vinyl: any) => (
              <div key={vinyl.id} className="relative">
                <VinylCard
                  id={vinyl.id}
                  title={vinyl.title}
                  artist={vinyl.artist}
                  genre={vinyl.genre}
                  style={vinyl.style}
                  coverUrl={vinyl.coverUrl}
                  href={`/vinyl/${vinyl.id}`}
                />
                {/* Quick actions menu */}
                <div className="absolute right-1.5 top-1.5 z-10">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpenId(menuOpenId === vinyl.id ? null : vinyl.id); }}
                    className="rounded-full bg-black/40 p-1 text-white backdrop-blur-sm transition-opacity hover:bg-black/60"
                    aria-label="Acciones rapidas"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                  {menuOpenId === vinyl.id && (
                    <div className="absolute right-0 top-8 z-20 w-40 rounded-md border border-border/60 bg-background p-1 shadow-lg" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/vinyl/${vinyl.id}`);
                          toast.success("Link copiado");
                          setMenuOpenId(null);
                        }}
                        className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs transition-colors hover:bg-muted"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copiar link
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const v = vinyl as any;
                          const ids = (v.folders ?? []).map((f: any) => f.folderId ?? f.folder?.id).filter(Boolean);
                          setSelectedFolderIds(ids);
                          setMoveVinylId(vinyl.id);
                          setMenuOpenId(null);
                        }}
                        className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs transition-colors hover:bg-muted"
                      >
                        <FolderPlus className="h-3.5 w-3.5" /> Mover a carpeta
                      </button>
                      <button
                        type="button"
                        onClick={() => { setDeleteVinylId(vinyl.id); setMenuOpenId(null); }}
                        className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteVinylId}
        title="Eliminar vinilo"
        description="Seguro que queres eliminar este vinilo? Esta accion no se puede deshacer."
        isLoading={deleteVinyl.isPending}
        onConfirm={() => deleteVinylId && deleteVinyl.mutate({ id: deleteVinylId })}
        onCancel={() => setDeleteVinylId(null)}
      />

      {/* Move to folder modal */}
      {moveVinylId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMoveVinylId(null)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-label="Agregar a carpetas" className="relative w-full max-w-xs space-y-3 rounded-lg border border-border/60 bg-background p-5 shadow-xl">
            <h3 className="font-heading text-sm font-semibold">Agregar a carpetas</h3>
            <p className="text-[10px] text-muted-foreground">Selecciona las carpetas donde queres tener este vinilo.</p>
            {folders.length === 0 ? (
              <p className="text-xs text-muted-foreground">No tenes carpetas. Crea una primero.</p>
            ) : (
              <div className="max-h-60 space-y-1 overflow-y-auto">
                {folders.map((folder) => {
                  const isIn = selectedFolderIds.includes(folder.id);
                  return (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => {
                        setSelectedFolderIds((prev) =>
                          isIn ? prev.filter((id) => id !== folder.id) : [...prev, folder.id],
                        );
                      }}
                      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs transition-colors ${isIn ? "bg-primary/10" : "hover:bg-muted"}`}
                    >
                      <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${isIn ? "border-primary bg-primary text-primary-foreground" : "border-border/60"}`}>
                        {isIn && <span className="text-[10px]">✓</span>}
                      </div>
                      {folder.color && <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: folder.color }} />}
                      <span className="flex-1">{folder.name}</span>
                      <span className="text-muted-foreground">{folder._count.vinyls}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const vinyl = vinyls.find((v: any) => v.id === moveVinylId) as any;
                  if (!vinyl) return;
                  updateVinyl.mutate({
                    id: moveVinylId,
                    title: vinyl.title,
                    artist: vinyl.artist,
                    folderIds: selectedFolderIds,
                  });
                }}
                disabled={updateVinyl.isPending}
                className="flex-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {updateVinyl.isPending ? "Guardando..." : "Guardar"}
              </button>
              <button type="button" onClick={() => setMoveVinylId(null)} className="rounded-md border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
