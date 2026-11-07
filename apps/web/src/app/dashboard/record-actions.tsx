"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@dallateas/ui/components/dropdown-menu";
import { Copy, FolderPlus, MoreVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { ListedVinyl } from "./types";

type RecordActionsProps = {
  vinyl: ListedVinyl;
  onMove: () => void;
  onDelete: () => void;
};

function copyLink(id: string) {
  navigator.clipboard.writeText(`${window.location.origin}/vinyl/${id}`).then(
    () => toast.success("Link copiado"),
    () => toast.error("No se pudo copiar el link"),
  );
}

const ITEM = "min-h-11 text-[13px] md:min-h-8";

export function RecordActions({ vinyl, onMove, onDelete }: RecordActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Acciones de ${vinyl.title}`}
        className="flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors duration-[120ms] hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring md:size-8"
      >
        <MoreVertical aria-hidden="true" className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 p-1">
        <DropdownMenuItem className={ITEM} onClick={() => copyLink(vinyl.id)}>
          <Copy aria-hidden="true" /> Copiar link
        </DropdownMenuItem>
        <DropdownMenuItem className={ITEM} onClick={onMove}>
          <FolderPlus aria-hidden="true" /> Mover a carpeta
        </DropdownMenuItem>
        <DropdownMenuItem className={ITEM} variant="destructive" onClick={onDelete}>
          <Trash2 aria-hidden="true" /> Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
