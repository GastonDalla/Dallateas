"use client";

import { Barlow, Barlow_Condensed } from "next/font/google";
import { useEffect } from "react";

import "../index.css";

const barlow = Barlow({ variable: "--font-barlow", subsets: ["latin"], weight: ["400", "500", "600"] });
const barlowCondensed = Barlow_Condensed({ variable: "--font-barlow-condensed", subsets: ["latin"], weight: ["700"] });

/** Replaces the root layout when it fails, so it carries its own document, fonts and theme. */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es-AR" className="dark">
      <body className={`${barlow.variable} ${barlowCondensed.variable} bg-background font-sans text-foreground antialiased`}>
        <title>Se trabó la púa | Dallateas</title>
        <main className="mx-auto flex min-h-svh max-w-[75rem] flex-col justify-center gap-6 px-4 py-16 md:px-8">
          <div>
            <h1 className="font-heading text-[2.5rem] leading-none font-bold text-balance md:text-[3.5rem]">Se trabó la púa</h1>
            <p className="mt-3 max-w-prose text-base text-pretty text-muted-foreground">
              Dallateas no pudo arrancar. Probá de nuevo en un momento.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={retry}
              className="h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors duration-100 hover:bg-primary/90"
            >
              Reintentar
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
