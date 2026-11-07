import { Loader2 } from "lucide-react";

export default function Loader() {
  return (
    <div role="status" className="flex h-full items-center justify-center py-16">
      <Loader2 aria-hidden="true" className="size-5 text-muted-foreground motion-safe:animate-spin" />
      <span className="sr-only">Cargando</span>
    </div>
  );
}
