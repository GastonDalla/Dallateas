import { cn } from "@dallateas/ui/lib/utils";
import Image from "next/image";

const OPTIMIZED_HOSTS = new Set(["i.discogs.com", "st.discogs.com"]);

function canOptimize(src: string) {
  try {
    return OPTIMIZED_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

type CoverProps = {
  src?: string | null;
  alt: string;
  /** The rendered width, so the browser downloads the right size. */
  sizes: string;
  priority?: boolean;
  className?: string;
};

/** A plain sleeve with its die-cut hole, for records without a cover. */
function BlankSleeve() {
  return (
    <svg viewBox="0 0 100 100" className="size-full text-muted-foreground/40" aria-hidden="true">
      <circle cx="50" cy="50" r="17" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="50" cy="50" r="1.6" fill="currentColor" />
    </svg>
  );
}

/** A record cover. Sleeves are square, so this never gets a radius. */
export function Cover({ src, alt, sizes, priority, className }: CoverProps) {
  return (
    <div className={cn("relative aspect-square overflow-hidden bg-muted", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={!canOptimize(src)}
          className="object-cover"
        />
      ) : (
        <BlankSleeve />
      )}
    </div>
  );
}
