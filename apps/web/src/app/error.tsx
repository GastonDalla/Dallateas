"use client";

import { Button } from "@dallateas/ui/components/button";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70svh] max-w-[75rem] flex-col justify-center gap-6 px-4 py-16 md:px-8">
      <div>
        <h1 className="font-heading text-[2.5rem] leading-none font-bold text-balance md:text-[3.5rem]">Se trabó la púa</h1>
        <p className="mt-3 max-w-prose text-base text-pretty text-muted-foreground">
          Algo falló de nuestro lado. Probá de nuevo, y si sigue igual volvé al inicio.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="button" onClick={retry} className="h-11 px-4 text-sm">
          Reintentar
        </Button>
        <Link href="/" className="text-sm text-link underline underline-offset-4">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
