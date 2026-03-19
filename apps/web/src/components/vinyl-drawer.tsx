"use client";

import { Disc3, X } from "lucide-react";
import { lazy, Suspense } from "react";

import { useAddVinyl } from "./add-vinyl-context";

const VinylForm = lazy(() =>
  import("./vinyl-form").then((m) => ({ default: m.VinylForm })),
);

export function VinylDrawer() {
  const { open, editId, closeDrawer } = useAddVinyl();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={editId ? "Editar vinilo" : "Agregar vinilo"}
        className="relative mt-auto flex max-h-[90svh] flex-col rounded-t-2xl border-t border-border/60 bg-background shadow-2xl animate-in slide-in-from-bottom duration-300"
      >
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <h2 className="font-heading text-lg font-semibold">
            {editId ? "Editar vinilo" : "Agregar vinilo"}
          </h2>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <Disc3 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <VinylForm id={editId} onSaved={closeDrawer} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
