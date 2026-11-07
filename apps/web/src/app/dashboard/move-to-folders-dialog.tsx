"use client";

import { Button } from "@dallateas/ui/components/button";
import { Checkbox } from "@dallateas/ui/components/checkbox";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Modal } from "@/components/confirm-dialog";
import { actionClass } from "@/components/vinyl-form/field";
import { useHaptic } from "@/hooks/use-haptic";
import { useInvalidateCollection } from "@/hooks/use-invalidate-collection";
import { trpc } from "@/utils/trpc";

import type { ListedVinyl } from "./types";

type MoveToFoldersDialogProps = {
  vinyl: ListedVinyl;
  onClose: () => void;
};

export function MoveToFoldersDialog({ vinyl, onClose }: MoveToFoldersDialogProps) {
  const haptic = useHaptic();
  const titleId = useId();
  const invalidate = useInvalidateCollection();
  const { data: folders = [] } = useQuery(trpc.foldersList.queryOptions());
  const [selected, setSelected] = useState(() => vinyl.folders.map(({ folder }) => folder.id));

  const move = useMutation(
    trpc.vinylUpdate.mutationOptions({
      onSuccess: () => {
        haptic.trigger("success");
        void invalidate(vinyl.id);
        toast.success("Vinilo movido");
        onClose();
      },
    }),
  );

  function toggle(folderId: string, checked: boolean) {
    setSelected((current) => (checked ? [...current, folderId] : current.filter((id) => id !== folderId)));
  }

  return (
    <Modal labelledBy={titleId} onClose={onClose}>
      <div className="flex flex-col gap-3 p-5">
        <div className="flex flex-col gap-1">
          <h2 id={titleId} className="font-heading text-xl font-semibold">
            Agregar a carpetas
          </h2>
          <p className="truncate text-[13px] text-muted-foreground">{vinyl.title}</p>
        </div>

        {folders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no tenés carpetas</p>
        ) : (
          <ul className="flex max-h-60 flex-col overflow-y-auto overscroll-contain">
            {folders.map(({ id, name, color, _count }) => (
              <li key={id}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 text-sm transition-colors duration-[120ms] hover:bg-muted md:min-h-9">
                  <Checkbox checked={selected.includes(id)} onCheckedChange={(checked) => toggle(id, checked)} />
                  {color && <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />}
                  <span className="min-w-0 flex-1 truncate">{name}</span>
                  <span className="tabular text-[13px] text-muted-foreground">{_count.vinyls}</span>
                </label>
              </li>
            ))}
          </ul>
        )}

        {move.error && (
          <p role="alert" className="text-[13px] text-clash">
            {move.error.message}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" className={actionClass} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            className={actionClass}
            disabled={move.isPending}
            onClick={() => move.mutate({ id: vinyl.id, title: vinyl.title, artist: vinyl.artist, folderIds: selected })}
          >
            {move.isPending ? "Guardando" : "Guardar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
