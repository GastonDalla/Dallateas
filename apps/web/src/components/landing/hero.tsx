import { Button } from "@dallateas/ui/components/button";
import Link from "next/link";

import { PitchSleeve } from "./pitch-sleeve";
import type { LandingAction } from "./landing-action";

export function Hero({ action }: { action: LandingAction }) {
  return (
    <section aria-labelledby="hero-title" className="overflow-x-clip px-3 pt-4 @container sm:px-8 sm:pt-10">
      <PitchSleeve>
        <h1
          id="hero-title"
          className="font-heading text-[min(14cqw,6rem)] leading-[0.92] font-bold tracking-[-0.01em] uppercase"
        >
          <span className="block">Tu batea con el</span>{" "}
          <span className="block">BPM de cada corte</span>
        </h1>
        <div className="mt-4 flex flex-col gap-4 sm:mt-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <p className="max-w-[46ch] text-base text-pretty sm:text-lg sm:leading-snug">
            Cargás tus vinilos, medís cada corte y sabés qué mezcla con qué antes de sacar el disco de la funda.
          </p>
          <Button render={<Link href={action.href} />} nativeButton={false} className="h-12 px-6 text-base">
            {action.label}
          </Button>
        </div>
      </PitchSleeve>
    </section>
  );
}
