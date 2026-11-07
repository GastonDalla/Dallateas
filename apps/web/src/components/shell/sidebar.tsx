"use client";

import { Button } from "@dallateas/ui/components/button";
import { cn } from "@dallateas/ui/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAddVinyl } from "@/components/add-vinyl-context";
import { ModeToggle } from "@/components/mode-toggle";
import UserMenu from "@/components/user-menu";

import { APP_NAV, isActive } from "./nav-items";
import { Wordmark } from "./wordmark";

export function Sidebar() {
  const pathname = usePathname();
  const { openDrawer } = useAddVinyl();

  return (
    <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col gap-6 border-r border-border p-4 md:flex">
      <Wordmark />

      <Button onClick={() => openDrawer()} className="h-9 justify-start gap-2 px-3 text-sm">
        <Plus aria-hidden="true" className="size-4" />
        Agregar vinilo
      </Button>

      <nav aria-label="Principal" className="flex flex-col gap-0.5">
        {APP_NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-9 items-center gap-2.5 rounded-md px-3 text-sm transition-colors",
                active ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center justify-between gap-2">
        <UserMenu />
        <ModeToggle />
      </div>
    </aside>
  );
}
