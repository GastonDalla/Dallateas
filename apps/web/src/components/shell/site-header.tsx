import { Button } from "@dallateas/ui/components/button";
import Link from "next/link";

import { ModeToggle } from "@/components/mode-toggle";

import { Wordmark } from "./wordmark";

/** The bar for visitors without an account. On a phone the links drop to their own row. */
export function SiteHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border px-4 py-3 md:px-6">
      <Wordmark />
      <nav
        aria-label="Principal"
        className="order-last flex w-full items-center gap-5 text-sm text-muted-foreground sm:order-none sm:mr-auto sm:w-auto"
      >
        <Link href="/bateas" className="transition-colors hover:text-foreground">
          Explorar
        </Link>
        <Link href="/herramientas" className="transition-colors hover:text-foreground">
          Herramientas
        </Link>
      </nav>
      <div className="flex items-center gap-2 sm:gap-3">
        <ModeToggle />
        <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          Ingresar
        </Link>
        <Button render={<Link href="/register" />} nativeButton={false} className="h-9 px-3 text-sm">
          Crear cuenta
        </Button>
      </div>
    </header>
  );
}
