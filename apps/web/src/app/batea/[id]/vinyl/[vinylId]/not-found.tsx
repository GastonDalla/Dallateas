"use client";

import type { Route } from "next";
import Link from "next/link";
import { useParams } from "next/navigation";

import { EmptyState } from "@/components/shell/empty-state";

export default function VinylNotFound() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="mx-auto max-w-[75rem] px-4 py-8 md:px-8 md:py-12">
      <EmptyState
        title="Vinilo no encontrado"
        description="Puede que ya no esté en esta batea, o que la batea tenga contraseña."
        action={
          <Link href={`/batea/${id}` as Route} className="text-sm text-link underline underline-offset-4">
            Volver a la batea
          </Link>
        }
      />
    </div>
  );
}
