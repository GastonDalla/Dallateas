import { cn } from "@dallateas/ui/lib/utils";
import Image from "next/image";

type AvatarProps = {
  name: string;
  src?: string | null;
  className?: string;
};

export function Avatar({ name, src, className }: AvatarProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative flex size-12 shrink-0 items-center justify-center overflow-hidden bg-muted font-heading text-xl font-bold text-muted-foreground",
        className,
      )}
    >
      {src ? <Image src={src} alt="" fill sizes="48px" unoptimized className="object-cover" /> : name.charAt(0).toUpperCase()}
    </div>
  );
}
