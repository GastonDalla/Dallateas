"use client";

import { Button } from "@dallateas/ui/components/button";
import { cn } from "@dallateas/ui/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef, useState, type ReactNode, type UIEvent } from "react";

const PAGE_SHARE = 0.8;
const MIN_PROGRESS = 0.08;

type ScrollRowProps = {
  /** Names the row for screen readers and its buttons: "Set de ejemplo". */
  label: string;
  /** Sits at the start of the row of controls, such as a heading. */
  heading?: ReactNode;
  showProgress?: boolean;
  className?: string;
  /** For a row that bleeds past the column its controls sit in. */
  rowClassName?: string;
  children: ReactNode;
};

/** A row that scrolls sideways, for what reads left to right. Touch swipes it; buttons do the same for a mouse. */
export function ScrollRow({ label, heading, showProgress = false, className, rowClassName, children }: ScrollRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const scroll = (direction: 1 | -1) => {
    const row = rowRef.current;
    if (!row) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollBy({ left: direction * row.clientWidth * PAGE_SHARE, behavior: reduced ? "auto" : "smooth" });
  };

  const trackScroll = ({ currentTarget }: UIEvent<HTMLDivElement>) => {
    const end = currentTarget.scrollWidth - currentTarget.clientWidth;
    setProgress(end > 0 ? currentTarget.scrollLeft / end : 0);
  };

  return (
    <div className={className}>
      <div className="flex items-end justify-between gap-4">
        {heading}
        <div className="hidden shrink-0 gap-2 md:flex">
          <Button variant="outline" size="icon" className="size-12" aria-label={`Anterior en ${label}`} onClick={() => scroll(-1)}>
            <ArrowLeft />
          </Button>
          <Button variant="outline" size="icon" className="size-12" aria-label={`Siguiente en ${label}`} onClick={() => scroll(1)}>
            <ArrowRight />
          </Button>
        </div>
      </div>

      {showProgress && (
        <div aria-hidden="true" className="mt-5 h-1.5 bg-muted">
          <div
            style={{ width: `${Math.max(progress, MIN_PROGRESS) * 100}%` }}
            className="h-full bg-foreground transition-[width] duration-100"
          />
        </div>
      )}

      <div
        ref={rowRef}
        role="group"
        aria-label={label}
        tabIndex={0}
        onScroll={trackScroll}
        className={cn(
          "no-scrollbar mt-6 flex snap-x snap-mandatory overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-ring",
          rowClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
