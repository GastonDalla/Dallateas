import { Disc3 } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <Disc3 className="h-16 w-16 text-muted-foreground/30" />
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">
          Pagina no encontrada. Puede que haya sido movida o eliminada.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
