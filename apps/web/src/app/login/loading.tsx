import { Skeleton } from "@dallateas/ui/components/skeleton";

export default function LoginLoading() {
  return (
    <div aria-hidden="true" className="mx-auto w-full max-w-sm px-4 py-12 md:py-20">
      <Skeleton className="h-8 w-44 animate-none" />
      <Skeleton className="mt-2 h-5 w-56 animate-none" />
      <Skeleton className="mt-8 h-11 w-full animate-none md:h-9" />
      <div className="mt-6 space-y-4">
        <Skeleton className="h-11 w-full animate-none md:h-9" />
        <Skeleton className="h-11 w-full animate-none md:h-9" />
        <Skeleton className="h-11 w-full animate-none md:h-9" />
      </div>
    </div>
  );
}
