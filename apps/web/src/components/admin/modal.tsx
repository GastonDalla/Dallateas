"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type ModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/** Mounted only while open. `showModal` brings the focus trap, Escape and the inert page with it. */
export function Modal({ title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl border-0 bg-popover text-popover-foreground shadow-xl backdrop:bg-black/50"
    >
      <div className="space-y-4 p-6">
        <h2 id={titleId} className="font-heading text-xl font-bold">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}

/** Toasts sit under an open dialog, so a failed action says so inside it. */
export function ModalError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-[13px] text-destructive">
      {message}
    </p>
  );
}
