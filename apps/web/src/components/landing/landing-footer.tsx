import { cn } from "@dallateas/ui/lib/utils";
import Link from "next/link";

import styles from "./landing.module.css";

const LICENSES = {
  by: { name: "CC BY 2.0", url: "https://creativecommons.org/licenses/by/2.0/" },
  zero: { name: "CC0", url: "https://creativecommons.org/publicdomain/zero/1.0/" },
};

const CREDITS = [
  { title: "Londres", author: "Maïlis Donnet", url: "https://www.flickr.com/photos/188361035@N08/49971870951", license: LICENSES.by },
  {
    title: "Technics SL-1200MK2 turntable",
    author: "Adrian DuMay",
    url: "https://commons.wikimedia.org/wiki/File:Technics_SL-1200MK2_turntable.jpg",
    license: LICENSES.by,
  },
  {
    title: "Person browsing collection vinyl records",
    author: null,
    url: "https://www.rawpixel.com/image/3294113/free-photo-image-sales-car-music-album",
    license: LICENSES.zero,
  },
  {
    title: "Technics SL-1200MK5",
    author: null,
    url: "https://commons.wikimedia.org/w/index.php?curid=116007854",
    license: LICENSES.zero,
  },
  {
    title: "Record shop in Heidelberg",
    author: "assillo",
    url: "https://commons.wikimedia.org/w/index.php?curid=94872310",
    license: LICENSES.by,
  },
];

const LINK_CLASS = "underline underline-offset-4";

/** The back of the page: what scrolls away uncovers it, on screens tall enough to hold it. */
export function LandingFooter() {
  return (
    <footer className={cn(styles.paper, "bottom-0 bg-background text-foreground md:sticky")}>
      <div className="px-4 pt-16 pb-8 @container md:px-8 md:pt-24">
        <p aria-hidden="true" className="font-heading text-[23.4cqw] leading-[0.78] font-bold uppercase">
          Dallateas
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-12">
          <nav aria-label="Pie de página" className="flex flex-wrap gap-x-5 gap-y-1 text-base md:col-span-4 md:flex-col">
            <Link href="/bateas" className={LINK_CLASS}>
              Explorar bateas
            </Link>
            <Link href="/herramientas" className={LINK_CLASS}>
              Herramientas
            </Link>
          </nav>
          <p className="max-w-[86ch] text-[13px] text-pretty md:col-span-8">
            Fotos de otros, pasadas a blanco y negro; ninguna muestra a Dallateas ni a sus usuarios:{" "}
            {CREDITS.map(({ title, author, url, license }, index) => (
              <span key={url}>
                <a href={url} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
                  {title}
                </a>
                {author && ` de ${author}`},{" "}
                <a href={license.url} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
                  {license.name}
                </a>
                {index < CREDITS.length - 1 ? "; " : "."}
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
