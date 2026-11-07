import { cn } from "@dallateas/ui/lib/utils";
import Link from "next/link";

import styles from "./landing.module.css";

const LINK_CLASS = "underline underline-offset-4";

/** The back of the page: what scrolls away uncovers it, on screens tall enough to hold it. */
export function LandingFooter() {
  return (
    <footer className={cn(styles.paper, "bottom-0 bg-background text-foreground md:sticky")}>
      <div className="px-4 pt-16 pb-8 @container md:px-8 md:pt-24">
        <p aria-hidden="true" className="font-heading text-[23.4cqw] leading-[0.78] font-bold uppercase">
          Dallateas
        </p>
        <nav aria-label="Pie de página" className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-base">
          <Link href="/bateas" className={LINK_CLASS}>
            Explorar bateas
          </Link>
          <Link href="/herramientas" className={LINK_CLASS}>
            Herramientas
          </Link>
          <Link href="/herramientas#tool-trainer" className={LINK_CLASS}>
            Entrenador de beatmatching
          </Link>
        </nav>
      </div>
    </footer>
  );
}
