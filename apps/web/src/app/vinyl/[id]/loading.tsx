import { Skeleton } from "@dallateas/ui/components/skeleton";

const PLACEHOLDER_TRACKS = ["a1", "a2", "b1", "b2"];

export default function VinylLoading() {
  return (
    <div role="status" aria-label="Cargando el vinilo" className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <Skeleton className="h-4 w-24" />
      <div className="flex gap-4 md:gap-8">
        <Skeleton className="size-28 shrink-0 rounded-none md:size-56" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {PLACEHOLDER_TRACKS.map((id) => (
          <Skeleton key={id} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
