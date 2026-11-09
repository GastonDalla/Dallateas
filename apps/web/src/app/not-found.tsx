import { Button } from "@dallateas/ui/components/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70svh] max-w-[75rem] flex-col justify-center gap-6 px-4 py-16 md:px-8">
      <p aria-hidden="true" className="tabular font-heading text-[7rem] leading-none font-bold md:text-[10rem]">
        404
      </p>
      <div>
        <h1 className="font-heading text-[28px] leading-none font-bold text-balance">Este disco no está en la batea</h1>
        <p className="mt-2 max-w-prose text-base text-pretty text-muted-foreground">
          La página se movió, la borraron o el link vino mal.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button render={<Link href="/" />} nativeButton={false} className="h-11 px-4 text-sm">
          Volver al inicio
        </Button>
        <Link href="/bateas" className="text-sm text-link underline underline-offset-4">
          Explorar bateas
        </Link>
      </div>
    </div>
  );
}
