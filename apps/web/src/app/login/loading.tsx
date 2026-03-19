import { Skeleton } from "@dallateas/ui/components/skeleton";

export default function LoginLoading() {
  return (
    <div className="mx-auto mt-10 w-full max-w-md space-y-4 p-6">
      <Skeleton className="mx-auto h-7 w-40" />
      <Skeleton className="mx-auto h-4 w-56" />
      <div className="space-y-4 pt-4">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
