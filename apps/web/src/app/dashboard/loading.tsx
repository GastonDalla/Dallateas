import { Skeleton } from "@dallateas/ui/components/skeleton";

const PLACEHOLDER_COVERS = Array.from({ length: 12 }, (_, index) => `cover-${index}`);

export default function DashboardLoading() {
  return (
    <div role="status" aria-label="Cargando la colección" className="flex flex-col gap-4 px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-11 w-full md:h-9" />
      <Skeleton className="h-11 w-full md:h-9" />
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {PLACEHOLDER_COVERS.map((id) => (
          <div key={id} className="flex flex-col gap-2">
            <Skeleton className="aspect-square w-full rounded-none" />
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3.5 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
