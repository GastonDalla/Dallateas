import { keyLabel, parseKey, type CamelotKey, type KeyRelation } from "@dallateas/dj/camelot";
import { cn } from "@dallateas/ui/lib/utils";

import { CENTER, SIZE, WEDGES } from "@/components/dj/camelot-geometry";

type DialMix = {
  printed: string | null;
  sounding: CamelotKey | null;
  relation: KeyRelation | null;
};

type CamelotDialProps = {
  source: string;
  mixes: DialMix[];
  className?: string;
};

/**
 * The wheel as the mix finder reads it: the record going out in fluo, where each candidate really
 * lands once pitched, and, dashed, the key its label promised.
 */
export function CamelotDial({ source, mixes, className }: CamelotDialProps) {
  const sourceKey = parseKey(source);
  const sounding = new Map(mixes.flatMap(({ sounding: key, relation }) => (key && relation ? [[key, relation] as const] : [])));
  const printedOnly = new Set(
    mixes.flatMap(({ printed, sounding: key }) => {
      const label = parseKey(printed);
      return label && label !== key ? [label] : [];
    }),
  );

  return (
    <figure className={cn("flex flex-col gap-4", className)}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Rueda de Camelot con la tonalidad que sale y dónde caen las candidatas" className="h-auto w-full">
        {WEDGES.map(({ key, labelX, labelY, path }) => {
          const isSource = key === sourceKey;
          const relation = sounding.get(key);
          const lands = relation !== undefined;
          const good = lands && relation !== "clash";
          const promised = printedOnly.has(key);

          return (
            <g key={key}>
              <path
                d={path}
                strokeWidth={promised || (lands && !good) ? 2.5 : 2}
                strokeDasharray={promised ? "5 4" : undefined}
                className={cn(
                  isSource ? "fill-primary stroke-card" : good ? "fill-accent stroke-card" : "fill-muted stroke-card",
                  lands && !good && "stroke-clash",
                  promised && "stroke-foreground",
                )}
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="central"
                className={cn(
                  "font-heading text-[16px] font-bold",
                  isSource ? "fill-primary-foreground" : good ? "fill-accent-foreground" : lands ? "fill-clash" : "fill-muted-foreground",
                )}
              >
                {key}
              </text>
            </g>
          );
        })}
        {sourceKey && (
          <>
            <text x={CENTER} y={CENTER - 10} textAnchor="middle" dominantBaseline="central" className="readout fill-foreground text-[44px]">
              {sourceKey}
            </text>
            <text x={CENTER} y={CENTER + 24} textAnchor="middle" dominantBaseline="central" className="fill-muted-foreground text-[14px]">
              {keyLabel(sourceKey)}, sale
            </text>
          </>
        )}
      </svg>
      <figcaption className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3 bg-primary" /> La que sale
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3 bg-accent" /> Suena y mezcla
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3 border-2 border-clash" /> Suena y choca
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3 border-2 border-dashed border-foreground" /> Lo que dice la etiqueta
        </span>
      </figcaption>
    </figure>
  );
}
