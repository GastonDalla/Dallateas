import { buttonVariants } from "@dallateas/ui/components/button";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { MicBpm } from "@/components/dj/mic-bpm";
import { TapTempo } from "@/components/dj/tap-tempo";
import { CamelotWheel } from "@/components/dj/tools/camelot-wheel";
import { PitchCalculator } from "@/components/dj/tools/pitch-calculator";
import { SpeedConverter } from "@/components/dj/tools/speed-converter";
import { PageHeader } from "@/components/shell/page-header";
import { getSession } from "@/server/session";

const TITLE = "Tap tempo, calculadora de pitch y rueda de Camelot";
const DESCRIPTION =
  "Medí el BPM con tap tempo o el micrófono, calculá el pitch en bandejas y encontrá tonalidades compatibles en la rueda de Camelot. Sin cuenta.";

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
  ],
  alternates: { canonical: "/herramientas" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/herramientas", type: "website" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

type ToolHeadingProps = {
  id: string;
  title: string;
  children: ReactNode;
};

function ToolHeading({ id, title, children }: ToolHeadingProps) {
  return (
    <div className="mb-5 max-w-prose">
      <h2 id={id} className="font-heading text-[28px] font-bold leading-none text-balance">
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

      <section aria-labelledby="tool-camelot" className="border-t border-border pt-8">
        <ToolHeading id="tool-camelot" title="Rueda de Camelot">
          Elegí la tonalidad del disco que suena y mirá con cuáles mezcla
        </ToolHeading>
        <CamelotWheel />
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
