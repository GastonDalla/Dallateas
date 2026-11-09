import { cn } from "@dallateas/ui/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

import { SITE_URL } from "@/app/batea/seo";
import { getServerCaller } from "@/server/trpc";

import { CrateTile } from "./crate-tile";
import styles from "./landing.module.css";
import { QrSticker } from "./qr-sticker";

const CRATES_ON_LANDING = 6;
const CRATES_TO_FETCH = 12;

async function loadCrates() {
  try {
    const caller = await getServerCaller();
    const { items } = await caller.publicFolders({ limit: CRATES_TO_FETCH });
    return items.filter(({ vinyls }) => vinyls.length > 0).slice(0, CRATES_ON_LANDING);
  } catch (error) {
    // The rest of the landing needs no database, so a failure here must not take it down.
    console.error("Public crates not loaded", error);
    return [];
  }
}

async function PublicCrates() {
  const crates = await loadCrates();
  if (crates.length === 0) return null;

  return (
    <div className="mt-16 md:mt-24">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-heading text-[28px] leading-none font-bold">Bateas de la gente</h3>
        <Link href="/bateas" className="text-base text-link underline underline-offset-4">
          Ver todas
        </Link>
      </div>
      <div className="mt-6 grid gap-x-6 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
        {crates.map((crate) => (
          <CrateTile key={crate.id} crate={crate} />
        ))}
      </div>
    </div>
  );
}

export function SharedSection() {
  const cratesUrl = new URL("/bateas", SITE_URL);

  return (
    <section
      aria-labelledby="shared-title"
      className={cn(styles.paper, "mt-32 bg-background px-4 py-16 text-foreground md:mt-48 md:px-8 md:py-24")}
    >
      <div className="mx-auto max-w-[75rem]">
        <div className="grid items-end gap-8 md:grid-cols-12 md:gap-12">
          <div className="dark grid items-center gap-6 bg-background p-6 text-foreground sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)] sm:p-10 md:col-span-7">
            <dl className="flex flex-col gap-5">
              <div>
                <dt className="text-sm text-muted-foreground">Link</dt>
                <dd className="mt-1 truncate border border-border px-3 py-2.5 text-base">
                  {cratesUrl.host}/batea/…
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Contraseña</dt>
                <dd aria-label="Contraseña oculta" className="mt-1 border border-border px-3 py-2.5 text-base tracking-[0.25em]">
                  ••••••
                </dd>
              </div>
            </dl>
            <QrSticker url={cratesUrl.toString()} title="Bateas" className="mx-auto w-full max-w-[14rem] rotate-2" />
          </div>
          <div className="md:col-span-5">
            <h2 id="shared-title" className="font-heading text-[clamp(2.5rem,1.6rem+3vw,3.5rem)] leading-none font-bold text-balance uppercase">
              Bateas que se comparten
            </h2>
            <ul className="mt-6 grid gap-2 text-lg">
              <li>Un link para mandar por chat</li>
              <li>Contraseña si es para pocos</li>
              <li>Un QR para pegar en la cabina</li>
            </ul>
          </div>
        </div>

        <Suspense fallback={null}>
          <PublicCrates />
        </Suspense>
      </div>
    </section>
  );
}
