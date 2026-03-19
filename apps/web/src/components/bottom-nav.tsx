"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LayoutDashboard, ListMusic, PlusCircle } from "lucide-react";

import { useAddVinyl } from "./add-vinyl-context";

export function BottomNav() {
  const pathname = usePathname();
  const { openDrawer } = useAddVinyl();

  const isDashboard = pathname.startsWith("/dashboard");
  const isFolders = pathname.startsWith("/folders");

  if (!isDashboard && !isFolders) return null;

  return (
    <nav aria-label="Navegacion principal" className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background pb-[env(safe-area-inset-bottom)] md:static md:border-t-0 md:pb-0">
      <div className="mx-auto flex max-w-md items-center justify-around px-[max(1rem,env(safe-area-inset-left))] py-1.5 pr-[max(1rem,env(safe-area-inset-right))]">
        <Link
          href="/dashboard"
          aria-current={isDashboard ? "page" : undefined}
          className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
            isDashboard ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
          <span>Coleccion</span>
        </Link>

        <button
          type="button"
          onClick={() => openDrawer()}
          aria-label="Agregar vinilo"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
        >
          <PlusCircle className="h-5 w-5" aria-hidden="true" />
        </button>

        <Link
          href="/folders"
          aria-current={isFolders ? "page" : undefined}
          className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
            isFolders ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <ListMusic className="h-5 w-5" aria-hidden="true" />
          <span>Carpetas</span>
        </Link>
      </div>
    </nav>
  );
}
