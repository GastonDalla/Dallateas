"use client";

import { Button } from "@dallateas/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { actionClass } from "@/components/vinyl-form/field";
import { collectionCsv } from "@/lib/collection-csv";
import { trpc } from "@/utils/trpc";

function download(csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "dallateas-coleccion.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function ExportCsvButton() {
  const queryClient = useQueryClient();

  const exportCsv = useMutation({
    // Only when asked: the whole collection with its tracks is the heaviest thing this page can load.
    mutationFn: () => queryClient.fetchQuery({ ...trpc.collectionExport.queryOptions(), staleTime: 0 }),
    onSuccess: (records) => {
      if (records.length === 0) toast.info("Todavía no hay discos para exportar");
      else download(collectionCsv(records));
    },
    onError: () => toast.error("No se pudo armar el CSV"),
  });

  return (
    <Button type="button" variant="outline" className={actionClass} disabled={exportCsv.isPending} onClick={() => exportCsv.mutate()}>
      {exportCsv.isPending ? <Loader2 aria-hidden="true" className="animate-spin" /> : <FileSpreadsheet aria-hidden="true" />}
      Exportar CSV
    </Button>
  );
}
