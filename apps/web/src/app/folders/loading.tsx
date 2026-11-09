import { Skeleton } from "@dallateas/ui/components/skeleton";

const ROWS = ["first", "second", "third", "fourth", "fifth"];

export default function FoldersLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="divide-y divide-border border-y border-border">
        {ROWS.map((row) => (
          <div key={row} className="flex items-center gap-3 py-3">
            <Skeleton className="size-5" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
