"use client";

import { useQuery } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";

import { useDebounce } from "@/hooks/use-debounce";
import { trpc } from "@/utils/trpc";

const MIN_LENGTH = 2;

export function DuplicateWarning({ title, artist }: { title: string; artist: string }) {
  const debouncedTitle = useDebounce(title.trim(), 500);
  const debouncedArtist = useDebounce(artist.trim(), 500);

  const { data: duplicates = [] } = useQuery({
    ...trpc.vinylCheckDuplicate.queryOptions({ title: debouncedTitle, artist: debouncedArtist }),
    enabled: debouncedTitle.length >= MIN_LENGTH && debouncedArtist.length >= MIN_LENGTH,
  });

  if (duplicates.length === 0) return null;

  return (
    <div role="status" className="flex items-start gap-2 rounded-md border border-warn/40 bg-card p-3 text-[13px]">
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warn" />
      <div className="flex flex-col gap-1">
        <p className="font-medium">Posible duplicado</p>
        <ul className="text-muted-foreground">
          {duplicates.map(({ id, artist: duplicateArtist, title: duplicateTitle }) => (
            <li key={id}>
              {duplicateArtist}, {duplicateTitle}
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground">Podés guardarlo igual si es una copia a propósito</p>
      </div>
    </div>
  );
}
