import { cn } from "@dallateas/ui/lib/utils";
import QRCode from "qrcode";

import styles from "./landing.module.css";

type QrStickerProps = {
  url: string;
  title: string;
  className?: string;
};

/** The sticker a DJ tapes next to the mixer: a real QR, drawn module by module so it stays sharp. */
export function QrSticker({ url, title, className }: QrStickerProps) {
  const { modules } = QRCode.create(url, { errorCorrectionLevel: "M" });
  const size = modules.size;
  const quiet = 2;
  let path = "";
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (modules.get(x, y)) path += `M${x + quiet} ${y + quiet}h1v1h-1z`;
    }
  }

  return (
    <figure className={cn(styles.paper, "bg-card p-4 text-foreground sm:p-6", className)}>
      <svg viewBox={`0 0 ${size + quiet * 2} ${size + quiet * 2}`} role="img" aria-label={`Código QR que abre ${url}`} className="h-auto w-full" shapeRendering="crispEdges">
        <path d={path} className="fill-foreground" />
      </svg>
      <figcaption className="mt-3 flex items-baseline justify-between gap-3">
        <span className="font-heading text-xl leading-none font-bold">{title}</span>
        <span className="truncate text-sm text-muted-foreground">{new URL(url).host}</span>
      </figcaption>
    </figure>
  );
}
