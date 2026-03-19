"use client";

import { Disc3 } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <Disc3 className="h-16 w-16 text-destructive/30" />
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-bold">Error</h1>
        <p className="text-muted-foreground">
          Algo salio mal. Intenta de nuevo o volve al inicio.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
