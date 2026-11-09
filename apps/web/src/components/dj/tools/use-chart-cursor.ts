"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";

/** "points" reads a line, where marks sit on the edges. "slots" reads bars, each in its own equal column. */
type CursorMode = "points" | "slots";

/** The position a reader is pointing at on a chart, by mouse, finger or arrow keys. */
export function useChartCursor(count: number, mode: CursorMode) {
  const [cursor, setCursor] = useState<number | null>(null);
  const last = count - 1;
  const index = cursor === null ? null : Math.min(cursor, last);

  function followPointer(event: PointerEvent<HTMLElement>) {
    const { left, width } = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - left) / width));
    setCursor(mode === "points" ? Math.round(ratio * last) : Math.min(last, Math.floor(ratio * count)));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    setCursor(Math.max(0, Math.min(last, (index ?? (step > 0 ? -1 : count)) + step)));
  }

  return {
    index,
    surfaceProps: {
      tabIndex: 0,
      onPointerMove: followPointer,
      onPointerDown: followPointer,
      onPointerLeave: () => setCursor(null),
      onBlur: () => setCursor(null),
      onKeyDown: handleKeyDown,
    },
  };
}
