import { buttonVariants } from "@dallateas/ui/components/button";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { MicBpm } from "@/components/dj/mic-bpm";
import { TapTempo } from "@/components/dj/tap-tempo";
import { BeatTrainer } from "@/components/dj/tools/beat-trainer";
import { CamelotWheel } from "@/components/dj/tools/camelot-wheel";
import { PitchCalculator } from "@/components/dj/tools/pitch-calculator";
import { SetRamp } from "@/components/dj/tools/set-ramp";
import { SpeedConverter } from "@/components/dj/tools/speed-converter";
import { TempoTable } from "@/components/dj/tools/tempo-table";
import { PageHeader } from "@/components/shell/page-header";
import { getSession } from "@/server/session";

const TITLE = "Tap tempo, pitch, Camelot y entrenador de beatmatching";
const DESCRIPTION =
  "Medí el BPM con tap tempo o el micrófono, calculá el pitch, practicá beatmatching de oído, sacá frases y delays por BPM y armá la rampa de tempo del set. Sin cuenta.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "tap tempo",
    "calculadora de pitch",
    "rueda de Camelot",
    "medir BPM",
    "BPM de un vinilo",
    "armonía para DJ",
    "33 a 45 RPM",
    "beatmatching",
    "delay por BPM",
    "frases de 32 compases",
  ],
  alternates: { canonical: "/herramientas" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/herramientas", type: "website" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

const TOOLS = [
  { id: "tool-tap", name: "Tap tempo" },
  { id: "tool-mic", name: "Micrófono" },
  { id: "tool-pitch", name: "Pitch" },
  { id: "tool-trainer", name: "Beatmatching" },
  { id: "tool-camelot", name: "Camelot" },
  { id: "tool-table", name: "Frases y delays" },
  { id: "tool-ramp", name: "Rampa del set" },
  { id: "tool-speed", name: "33 y 45" },
] as const;

type ToolHeadingProps = {
  id: string;
  title: string;
  children: ReactNode;
};

function ToolHeading({ id, title, children }: ToolHeadingProps) {
  return (
    <div className="mb-5 max-w-prose">
      <h2 id={id} className="scroll-mt-24 font-heading text-[28px] font-bold leading-none text-balance">
        {title}
      </h2>
      <p className="mt-2 text-sm text-pretty text-muted-foreground">{children}</p>
    </div>
  );
}

export default async function ToolsPage() {
  const session = await getSession();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-8 md:gap-24 md:px-8 md:py-12">
      <PageHeader
        title="Herramientas para DJ de vinilo"
        description="En bandejas no hay sync ni key lock. Tempo, pitch y tonalidad, sin cuenta y desde el teléfono"
        className="[&_h1]:text-5xl [&_h1]:uppercase md:[&_h1]:text-7xl"
      />

      <nav aria-label="Herramientas en esta página" className="-mt-8 md:-mt-14">
        <ul className="flex flex-wrap gap-x-1 gap-y-2">
          {TOOLS.map(({ id, name }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="flex h-11 items-center border border-border px-4 text-sm font-medium transition-colors duration-100 hover:border-foreground md:h-9"
              >
                {name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
        <section aria-labelledby="tool-tap">
          <ToolHeading id="tool-tap" title="Tap tempo">
            Tocá al ritmo del bombo. Con cuatro golpes ya da un tempo, y un golpe fuera de tiempo no lo arruina
          </ToolHeading>
          <TapTempo />
        </section>

        <section aria-labelledby="tool-mic">
          <ToolHeading id="tool-mic" title="BPM con el micrófono">
            Es una estimación: escucha 12 segundos y puede leer el doble, la mitad o un tempo falso. Lo confirmás vos,
            de oído
          </ToolHeading>
          <MicBpm />
        </section>
      </div>

      <section aria-labelledby="tool-pitch" className="border-t border-border pt-8">
        <ToolHeading id="tool-pitch" title="Calculadora de pitch">
          Cuánto mover el fader para llegar a un tempo, si tu bandeja llega y qué le pasa a la tonalidad
        </ToolHeading>
        <PitchCalculator />
      </section>

      <section aria-labelledby="tool-trainer" className="border-t border-border pt-8">
        <ToolHeading id="tool-trainer" title="Entrenador de beatmatching">
          La pista suena a un tempo escondido. Movés el fader y empujás o frenás el plato hasta que los dos bombos suenen
          como uno, de oído
        </ToolHeading>
        <BeatTrainer />
      </section>

      <section aria-labelledby="tool-camelot" className="border-t border-border pt-8">
        <ToolHeading id="tool-camelot" title="Rueda de Camelot">
          Elegí la tonalidad del disco que suena y mirá con cuáles mezcla
        </ToolHeading>
        <CamelotWheel />
      </section>

      <section aria-labelledby="tool-table" className="border-t border-border pt-8">
        <ToolHeading id="tool-table" title="Frases y delays por BPM">
          Cuánto dura una frase de 16 o 32 compases y en cuántos milisegundos poner el delay o el eco del mixer
        </ToolHeading>
        <TempoTable />
      </section>

      <section aria-labelledby="tool-ramp" className="border-t border-border pt-8">
        <ToolHeading id="tool-ramp" title="Rampa del set">
          De qué tempo arrancás, a cuál querés llegar y en cuánto tiempo. Te dice cuántos discos llevar y cuánto subir en
          cada mezcla
        </ToolHeading>
        <SetRamp />
      </section>

      <section aria-labelledby="tool-speed" className="border-t border-border pt-8">
        <ToolHeading id="tool-speed" title="De 33 a 45 y de vuelta">
          Un disco a la otra velocidad cambia mucho más de lo que da el fader
        </ToolHeading>
        <SpeedConverter />
      </section>

      {!session?.user && (
        <p className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-8 text-sm text-muted-foreground">
          Lo que medís acá no se guarda. Con una cuenta queda en cada track de tu colección
          <Link href="/register" className={buttonVariants({ size: "lg", className: "h-11 px-4 md:h-9" })}>
            Crear cuenta
          </Link>
        </p>
      )}
    </div>
  );
}
