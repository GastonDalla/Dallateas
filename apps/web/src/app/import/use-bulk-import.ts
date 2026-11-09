"use client";

import type { AppRouter } from "@dallateas/api/routers/index";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { inferRouterInputs } from "@trpc/server";
import { toast } from "sonner";

import { inBatches } from "@/lib/csv-import";
import { trpc } from "@/utils/trpc";

type ImportableVinyl = inferRouterInputs<AppRouter>["vinylBulkCreate"]["vinyls"][number];

function recordCount(count: number) {
  return count === 1 ? "1 vinilo" : `${count} vinilos`;
}

/** Imports in batches the API accepts, and reports what actually got in if a batch fails halfway. */
export function useBulkImport() {
  const queryClient = useQueryClient();
  const bulkCreate = useMutation(trpc.vinylBulkCreate.mutationOptions());

  async function importVinyls(vinyls: ImportableVinyl[]) {
    let imported = 0;

    try {
      for (const batch of inBatches(vinyls)) {
        const { count } = await bulkCreate.mutateAsync({ vinyls: batch });
        imported += count;
      }
      toast.success(`Se importaron ${recordCount(imported)}`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "No se pudo importar";
      toast.error(imported > 0 ? `Se importaron ${imported} de ${vinyls.length}. ${reason}` : reason);
    }

    void queryClient.invalidateQueries({ queryKey: trpc.vinylsList.pathKey() });
    void queryClient.invalidateQueries({ queryKey: trpc.collectionStats.queryKey() });

    return imported;
  }

  return { importVinyls, isImporting: bulkCreate.isPending };
}
