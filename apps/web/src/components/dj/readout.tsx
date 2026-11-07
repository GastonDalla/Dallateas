import { cn } from "@dallateas/ui/lib/utils";
import { Fragment } from "react";

/** Characters Doto draws in a way that misleads next to digits: its point is a cross, so "124.5" reads "124+5". */
const TEXT_FACE = /([.−-])/;

/** Dot-matrix figures, like a mixer or CDJ screen. The point and the minus are set in the text face. */
export function Readout({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn("readout", className)}>
      {value.split(TEXT_FACE).map((part, index) =>
        index % 2 === 1 ? (
          <span key={index} className="font-sans font-semibold">
            {part}
          </span>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </span>
  );
}
