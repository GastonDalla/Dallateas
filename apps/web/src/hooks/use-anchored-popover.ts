"use client";

import { useEffect, useId, useRef, useState, type RefObject, type ToggleEvent } from "react";

const GAP = 4;
const EDGE = 8;

function place(triggerRef: RefObject<HTMLButtonElement | null>, panelRef: RefObject<HTMLDivElement | null>) {
  const trigger = triggerRef.current;
  const panel = panelRef.current;
  if (!trigger || !panel) return;

  const anchor = trigger.getBoundingClientRect();
  const { offsetWidth: width, offsetHeight: height } = panel;
  const below = anchor.bottom + GAP;
  const fitsBelow = below + height <= window.innerHeight - EDGE;

  panel.style.minWidth = `${anchor.width}px`;
  panel.style.left = `${Math.max(EDGE, Math.min(anchor.left, window.innerWidth - width - EDGE))}px`;
  panel.style.top = `${fitsBelow ? below : Math.max(EDGE, anchor.top - GAP - height)}px`;
}

type Callbacks = {
  onOpen?: () => void;
  onClose?: () => void;
};

/**
 * A dropdown on the browser's popover layer: closing on an outside click or Escape comes for free,
 * and it shows above dialogs and past any scrolling row, which a positioned element cannot do.
 */
export function useAnchoredPopover({ onOpen, onClose }: Callbacks = {}) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const follow = () => place(triggerRef, panelRef);
    window.addEventListener("scroll", follow, { capture: true, passive: true });
    window.addEventListener("resize", follow);
    return () => {
      window.removeEventListener("scroll", follow, { capture: true });
      window.removeEventListener("resize", follow);
    };
  }, [open]);

  function handleToggle(event: ToggleEvent<HTMLDivElement>) {
    const opened = event.newState === "open";
    setOpen(opened);
    if (opened) {
      // The panel has a size only once it shows, so this corrects the position set before opening.
      place(triggerRef, panelRef);
      onOpen?.();
    } else {
      onClose?.();
    }
  }

  return {
    open,
    close: () => panelRef.current?.hidePopover(),
    triggerProps: { ref: triggerRef, popoverTarget: id, "aria-expanded": open },
    panelProps: {
      ref: panelRef,
      id,
      popover: "auto" as const,
      onBeforeToggle: () => place(triggerRef, panelRef),
      onToggle: handleToggle,
    },
  };
}
