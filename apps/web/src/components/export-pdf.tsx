"use client";

import { Button } from "@dallateas/ui/components/button";
import { useMutation } from "@tanstack/react-query";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { pdfTrackRow } from "@/lib/collection-csv";

type PdfVinyl = {
  title: string;
  artist: string;
  label?: string;
  genre?: string;
  year?: number;
  bpm?: number;
  tracks?: readonly Parameters<typeof pdfTrackRow>[0][];
};

type ExportPdfProps = {
  title: string;
  vinyls: PdfVinyl[];
};

const MARGIN = 14;
const TABLE_STYLES = {
  styles: { fontSize: 9, cellPadding: 3 },
  headStyles: { fillColor: [30, 30, 30] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontStyle: "bold" as const },
};

async function writePdf({ title, vinyls }: ExportPdfProps) {
  // Loaded on click: together they weigh more than the rest of the page.
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);

  const doc: InstanceType<typeof jsPDF> & { lastAutoTable?: { finalY?: number } } = new jsPDF();

  doc.setFontSize(18);
  doc.text(`Dallateas: ${title}`, MARGIN, 22);

  autoTable(doc, {
    ...TABLE_STYLES,
    startY: 32,
    head: [["Título", "Artista", "Sello", "Género", "Año", "BPM"]],
    body: vinyls.map(({ title: name, artist, label, genre, year, bpm }) => [
      name,
      artist,
      label ?? "",
      genre ?? "",
      year ? String(year) : "",
      bpm ? String(bpm) : "",
    ]),
  });

  for (const vinyl of vinyls) {
    if (!vinyl.tracks?.length) continue;

    const startY = (doc.lastAutoTable?.finalY ?? 32) + 12;
    doc.setFontSize(11);
    doc.text(`${vinyl.artist}: ${vinyl.title}`, MARGIN, startY - 3);

    autoTable(doc, {
      ...TABLE_STYLES,
      startY,
      head: [["Lado", "Corte", "Duración", "BPM", "Tonalidad"]],
      body: vinyl.tracks.map(pdfTrackRow),
    });
  }

  doc.save(`${title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}

export function ExportPdf({ title, vinyls }: ExportPdfProps) {
  const exportPdf = useMutation({
    mutationFn: writePdf,
    onError: () => toast.error("No se pudo armar el PDF"),
  });

  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 gap-1.5 px-3 text-[13px] md:h-8"
      disabled={exportPdf.isPending}
      onClick={() => exportPdf.mutate({ title, vinyls })}
    >
      {exportPdf.isPending ? <Loader2 aria-hidden="true" className="animate-spin" /> : <FileDown aria-hidden="true" />}
      Exportar PDF
    </Button>
  );
}
