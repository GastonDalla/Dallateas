"use client";

import { FileDown } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useCallback } from "react";

interface Vinyl {
  title: string;
  artist: string;
  label?: string;
  genre?: string;
  year?: number;
  bpm?: number;
}

interface ExportPdfProps {
  title: string;
  vinyls: Vinyl[];
}

export function ExportPdf({ title, vinyls }: ExportPdfProps) {
  const handleExport = useCallback(() => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`Dallateas — ${title}`, 14, 22);

    autoTable(doc, {
      startY: 32,
      head: [["Titulo", "Artista", "Sello", "Genero", "Ano", "BPM"]],
      body: vinyls.map((v) => [
        v.title,
        v.artist,
        v.label ?? "",
        v.genre ?? "",
        v.year ? String(v.year) : "",
        v.bpm ? String(v.bpm) : "",
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [30, 30, 30],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
    });

    doc.save(`${title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  }, [title, vinyls]);

  return (
    <button
      type="button"
      onClick={handleExport}
      className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-card px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground"
    >
      <FileDown className="h-4 w-4" />
      Exportar PDF
    </button>
  );
}
