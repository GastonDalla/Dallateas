import { cn } from "@dallateas/ui/lib/utils";
import Link from "next/link";

import type { LandingAction } from "./landing-action";
import styles from "./landing.module.css";

type ReplyCardProps = {
  action: LandingAction;
  signedIn: boolean;
};

export function ReplyCard({ action, signedIn }: ReplyCardProps) {
  return (
    <section aria-labelledby="reply-title" className="relative z-10 overflow-hidden bg-muted px-4 pt-20 md:px-8 md:pt-32">
      <div className="mx-auto grid max-w-[75rem] items-end gap-10 md:min-h-[60svh] md:grid-cols-12 md:gap-8">
        <p className="max-w-[26ch] text-xl text-pretty md:col-span-4 md:mb-16">
          Hecho para el teléfono en la disquería y la compu en casa, antes de la fecha.
        </p>
        <div
          className={cn(
            styles.paper,
            "mx-auto -mb-6 w-[90%] rotate-1 bg-background px-6 pt-8 pb-12 text-center text-foreground md:col-span-7 md:col-start-6 md:-mb-14 md:w-full md:rotate-2 md:px-12 md:pt-12 md:pb-20",
          )}
        >
          <h2 id="reply-title" className="font-heading text-[28px] leading-none font-bold md:text-[2.5rem]">
            {signedIn ? "Seguí con tu batea" : "Empezá por un disco"}
          </h2>
          <p className="mx-auto mt-4 max-w-[38ch] text-base text-pretty md:text-lg">
            Buscalo en Discogs o escaneá el código de barras, medile un corte y ya tiene sticker.
          </p>
          <Link
            href={action.href}
            className="mt-6 flex h-14 items-center justify-center bg-foreground text-base font-semibold text-background transition-colors duration-100 hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {action.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
