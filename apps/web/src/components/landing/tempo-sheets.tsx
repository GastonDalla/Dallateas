import { cn } from "@dallateas/ui/lib/utils";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { BpmSticker } from "@/components/dj/bpm-sticker";

import styles from "./landing.module.css";

type Sheet = {
  name: string;
  body: string;
  sticker: ReactNode;
  stickerNote: string;
  tone: string;
  image: { src: string; alt: string; width: number; height: number };
};

const BIG_STICKER = "px-4 py-3 text-[56px] md:px-5 md:py-4 md:text-[5.5rem]";

const SHEETS: Sheet[] = [
  {
    name: "Tap",
    body: "Tocá al ritmo del bombo. Con cuatro golpes ya hay tempo, y un golpe fuera de tiempo no lo arruina.",
    sticker: <BpmSticker tempo="124" className={BIG_STICKER} />,
    stickerNote: "Lleno: medido en tu disco",
    tone: cn(styles.paper, "bg-background text-foreground"),
    image: {
      src: "/images/landing/hands-in-the-bins.jpg",
      alt: "Dos manos revisando una batea con separadores escritos a mano",
      width: 1024,
      height: 609,
    },
  },
  {
    name: "Micrófono",
    body: "Acercá el teléfono al parlante y dejá sonar 12 segundos. Probado con 42 loops de tempo conocido: acertó 38, no contestó en 2 y erró 2.",
    sticker: <BpmSticker tempo="126.5" className={BIG_STICKER} />,
    stickerNote: "Lleno: lo escuchó tu teléfono",
    tone: "bg-muted text-foreground",
    image: {
      src: "/images/landing/sl-1200-mk2.jpg",
      alt: "Bandeja Technics SL-1200 con un disco girando y el fader de pitch a la derecha",
      width: 1600,
      height: 1200,
    },
  },
  {
    name: "Búsqueda",
    body: "Buscamos el corte en Deezer y traemos el BPM que tengan. Ese número no salió de tu disco, así que queda hueco hasta que lo midas.",
    sticker: <BpmSticker tempo="128" approximate className={BIG_STICKER} />,
    stickerNote: "Hueco: aproximado, de una búsqueda",
    tone: cn(styles.paper, "bg-card text-foreground"),
    image: {
      src: "/images/landing/browsing-crates.jpg",
      alt: "Una persona revisando discos en un cajón",
      width: 1024,
      height: 631,
    },
  },
];

export function TempoSheets() {
  return (
    <section aria-labelledby="tempo-title" className="mt-32 md:mt-48">
      <div className="mx-auto mb-12 flex max-w-[75rem] flex-col gap-4 px-4 md:flex-row md:items-end md:justify-between md:px-8">
        <h2 id="tempo-title" className="font-heading text-[clamp(2.5rem,1.6rem+3vw,3.5rem)] leading-none font-bold text-balance uppercase">
          Tres maneras de sacar el tempo
        </h2>
        <p className="max-w-[34ch] text-lg text-pretty">
          Cada número dice de dónde salió. Si no hay dato, no hay sticker.{" "}
          <Link href="/herramientas" className="text-link underline underline-offset-4">
            Probá el tap y el micrófono
          </Link>
        </p>
      </div>

      <ol>
        {SHEETS.map((sheet, index) => (
          <li
            key={sheet.name}
            style={{ "--sheet": index } as CSSProperties}
            className={cn(
              "sticky top-[calc(var(--sheet)*3.25rem)] min-h-[70svh] md:top-[calc(var(--sheet)*4.5rem)] md:min-h-[86svh]",
              sheet.tone,
            )}
          >
            <div className="grid min-h-[inherit] grid-rows-[auto_1fr] md:grid-cols-2">
              <h3 className="font-heading px-4 text-[1.375rem] leading-[3.25rem] font-bold md:col-span-2 md:px-8 md:text-[2.5rem] md:leading-[4.5rem]">
                {sheet.name}
              </h3>
              <div className="order-last flex flex-col justify-between gap-8 px-4 pt-5 pb-8 md:order-none md:px-8 md:pt-8 md:pb-10">
                <div>
                  {sheet.sticker}
                  <p className="mt-3 text-sm">{sheet.stickerNote}</p>
                </div>
                <p className="max-w-[40ch] text-lg text-pretty">{sheet.body}</p>
              </div>
              <div className="relative aspect-[4/3] md:aspect-auto">
                <Image
                  src={sheet.image.src}
                  alt={sheet.image.alt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
