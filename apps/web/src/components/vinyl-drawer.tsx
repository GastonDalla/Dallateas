"use client";

import { Button } from "@dallateas/ui/components/button";
import { Loader2, X } from "lucide-react";
import dynamic from "next/dynamic";

import { useAddVinyl } from "./add-vinyl-context";
import { Modal } from "./confirm-dialog";

const VinylForm = dynamic(() => import("./vinyl-form").then(({ VinylForm: Form }) => Form), {
  ssr: false,
  loading: () => (
    <div role="status" aria-label="Cargando el formulario" className="flex justify-center py-12">
      <Loader2 aria-hidden="true" className="size-5 animate-spin text-muted-foreground" />
    </div>
  ),
});

export function VinylDrawer() {
  const { open, editId, closeDrawer } = useAddVinyl();

  if (!open) return null;

  const title = editId ? "Editar vinilo" : "Agregar vinilo";

  return (
    <Modal
      label={title}
      onClose={closeDrawer}
      className="mt-auto mb-0 flex h-[92svh] max-h-none w-full max-w-none flex-col overflow-hidden rounded-b-none motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-200 md:my-0 md:mr-0 md:ml-auto md:h-svh md:w-[34rem] md:rounded-none md:motion-safe:slide-in-from-bottom-0 md:motion-safe:slide-in-from-right-4"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
        <h2 className="font-heading text-xl font-semibold">{title}</h2>
        <Button type="button" variant="ghost" size="icon" className="size-11 md:size-8" onClick={closeDrawer} aria-label="Cerrar">
          <X aria-hidden="true" />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        <VinylForm key={editId ?? "new"} id={editId} onSaved={closeDrawer} />
      </div>
    </Modal>
  );
}
