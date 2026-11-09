"use client";

import { cn } from "@dallateas/ui/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { APP_NAV, isActive } from "./shell/nav-items";
import { useAddVinyl } from "./add-vinyl-context";

const [collection, folders, tools] = APP_NAV;
const PHONE_NAV = [collection!, folders!, tools!];

export function BottomNav() {
  const pathname = usePathname();
  const { openDrawer } = useAddVinyl();

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-background px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] md:hidden"
    >
      {PHONE_NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-w-16 flex-col items-center gap-0.5 py-1 text-xs transition-colors",
              active ? "font-medium text-link" : "text-muted-foreground",
            )}
          >
            <Icon aria-hidden="true" className="size-5" />
            {label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => openDrawer()}
        aria-label="Agregar vinilo"
        className="flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground transition-transform active:scale-95"
      >
        <Plus aria-hidden="true" className="size-5" />
      </button>
    </nav>
  );
}
