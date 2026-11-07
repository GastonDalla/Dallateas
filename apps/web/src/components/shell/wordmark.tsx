import Link from "next/link";

/** The name on a sticker: the product's one mark. */
export function Wordmark() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 font-heading text-xl font-bold leading-none">
      <span aria-hidden="true" className="inline-block size-3.5 rounded-full bg-primary" />
      Dallateas
    </Link>
  );
}
