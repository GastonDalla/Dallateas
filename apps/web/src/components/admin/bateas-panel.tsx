"use client";

import { Input } from "@dallateas/ui/components/input";
import { useQuery } from "@tanstack/react-query";
import { Lock, Search } from "lucide-react";
import { useState } from "react";

import { CONTROL } from "@/components/profile/fields";
import { useDebounce } from "@/hooks/use-debounce";
import { trpc } from "@/utils/trpc";

import { ADMIN_BATEAS_LIMIT } from "./admin-bateas";
import { TableSkeletonRows } from "./table-skeleton";

const TYPE_LABELS: Record<string, string> = { GENRE: "Género", SET: "Set", OTHER: "Otra" };
const VISIBILITY_LABELS: Record<string, string> = { PUBLIC: "Pública", ACCOUNT: "Con cuenta", PRIVATE: "Privada" };

const HEADER = "py-2 pr-4 text-left text-[13px] font-normal text-muted-foreground";
const NUMBER_HEADER = "py-2 pl-4 text-right text-[13px] font-normal text-muted-foreground";

export function BateasPanel() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), 300);

  const bateas = useQuery(
    trpc.adminFolders.queryOptions({ limit: ADMIN_BATEAS_LIMIT, search: debouncedSearch || undefined }),
  );
  const items = bateas.data?.items;

  return (
    <>
      <div className="relative mb-6">
        <Search aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Buscar bateas por nombre"
          placeholder="Buscar por nombre"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={`${CONTROL} pl-9`}
        />
      </div>

      <table className="w-full table-fixed border-b border-border text-sm" aria-label="Lista de bateas">
        <thead>
          <tr>
            <th scope="col" className={HEADER}>
              Batea
            </th>
            <th scope="col" className={`${HEADER} hidden md:table-cell`}>
              Dueño
            </th>
            <th scope="col" className={`${HEADER} hidden w-20 md:table-cell`}>
              Tipo
            </th>
            <th scope="col" className={`${HEADER} hidden w-32 md:table-cell`}>
              Estado
            </th>
            <th scope="col" className={`${NUMBER_HEADER} w-20`}>
              Vinilos
            </th>
            <th scope="col" className={`${NUMBER_HEADER} hidden w-20 sm:table-cell`}>
              Vistas
            </th>
          </tr>
        </thead>
        <tbody>
          {!items && <TableSkeletonRows columns={2} />}
          {items?.map((folder) => {
            const visibility = VISIBILITY_LABELS[folder.visibility] ?? folder.visibility;
            const type = TYPE_LABELS[folder.type] ?? folder.type;

            return (
              <tr key={folder.id} className="border-t border-border transition-colors hover:bg-muted/40">
                <td className="py-3 pr-4">
                  <p className="flex items-center gap-2 font-medium">
                    {folder.color && (
                      <span aria-hidden="true" className="size-2.5 shrink-0" style={{ backgroundColor: folder.color }} />
                    )}
                    <span className="truncate">{folder.name}</span>
                  </p>
                  <p className="truncate text-[13px] text-muted-foreground md:hidden">
                    {folder.owner.name} · {type} · {visibility}
                  </p>
                </td>
                <td className="hidden py-3 pr-4 md:table-cell">
                  <p className="truncate">{folder.owner.name}</p>
                  <p className="truncate text-[13px] text-muted-foreground">{folder.owner.email}</p>
                </td>
                <td className="hidden py-3 pr-4 text-muted-foreground md:table-cell">{type}</td>
                <td className="hidden py-3 pr-4 text-muted-foreground md:table-cell">
                  <span className="inline-flex items-center gap-1.5">
                    {visibility}
                    {folder.hasPassword && <Lock aria-label="Con contraseña" className="size-3.5" />}
                  </span>
                </td>
                <td className="py-3 pl-4 text-right tabular">{folder.vinylCount}</td>
                <td className="hidden py-3 pl-4 text-right text-muted-foreground tabular sm:table-cell">{folder.viewCount}</td>
              </tr>
            );
          })}
          {items?.length === 0 && (
            <tr className="border-t border-border">
              <td colSpan={6} className="py-8 text-muted-foreground">
                No se encontraron bateas
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
