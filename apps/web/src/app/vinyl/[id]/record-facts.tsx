import type { ReactNode } from "react";

import { RECORD_CONDITIONS } from "@/lib/format";

import { LocalDate } from "./local-date";
import type { Vinyl } from "./types";

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="tabular truncate text-sm">{children ?? <span className="text-muted-foreground">—</span>}</dd>
    </div>
  );
}

function plays(count: number) {
  if (count === 0) return "Todavía no sonó";
  return count === 1 ? "1 vez" : `${count} veces`;
}

export function RecordFacts({ vinyl }: { vinyl: Vinyl }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 lg:grid-cols-4">
      <Fact label="Sello">{vinyl.label || null}</Fact>
      <Fact label="Género">{vinyl.genre || null}</Fact>
      <Fact label="Estilo">{vinyl.style || null}</Fact>
      <Fact label="Año">{vinyl.year}</Fact>
      <Fact label="Velocidad">{vinyl.rpm ? `${vinyl.rpm} RPM` : null}</Fact>
      <Fact label="Estado del disco">{vinyl.mediaCondition ? RECORD_CONDITIONS[vinyl.mediaCondition].label : null}</Fact>
      <Fact label="Estado de la tapa">{vinyl.sleeveCondition ? RECORD_CONDITIONS[vinyl.sleeveCondition].label : null}</Fact>
      <Fact label="Ubicación">{vinyl.location || null}</Fact>
      <Fact label="Precio pagado">{vinyl.pricePaid === null ? null : `$${vinyl.pricePaid.toLocaleString("es-AR")}`}</Fact>
      <Fact label="Sonó">{plays(vinyl.playCount)}</Fact>
      <Fact label="Última vez">{vinyl.lastPlayedAt && <LocalDate date={vinyl.lastPlayedAt} />}</Fact>
    </dl>
  );
}
