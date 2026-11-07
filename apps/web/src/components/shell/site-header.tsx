import { Button } from "@dallateas/ui/components/button";
import Link from "next/link";

import { ModeToggle } from "@/components/mode-toggle";

import { Wordmark } from "./wordmark";

/** The bar for visitors without an account. */
export function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 md:px-6">
      <div className="flex items-center gap-6">
        <Wordmark />
        <nav aria-label="Principal" className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/bateas" className="transition-colors hover:text-foreground">
            Explorar
          </Link>
          <Link href="/herramientas" className="transition-colors hover:text-foreground">
            Herramientas
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <ModeToggle />
        <Link href="/login" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block">
          Ingresar
        </Link>
        <Button render={<Link href="/register" />} nativeButton={false} className="h-9 px-3 text-sm">
          Crear cuenta
        </Button>
      </div>
    </header>
  );
}
