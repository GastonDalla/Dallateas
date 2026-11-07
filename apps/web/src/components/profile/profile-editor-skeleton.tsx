import { Skeleton } from "@dallateas/ui/components/skeleton";

import { PageHeader } from "@/components/shell/page-header";

export function ProfileEditorSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader title="Perfil DJ" description="Lo que ven los promotores y otros DJ en tu página pública" className="mb-8" />
      {[0, 1, 2].map((section) => (
        <div key={section} aria-hidden="true" className="grid gap-4 border-t border-border py-8 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-8">
          <Skeleton className="h-6 w-32 animate-none" />
          <div className="space-y-4">
            <Skeleton className="h-11 w-full animate-none md:h-9" />
            <Skeleton className="h-11 w-full animate-none md:h-9" />
          </div>
        </div>
      ))}
    </div>
  );
}
