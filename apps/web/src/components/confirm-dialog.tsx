"use client";

import { Button } from "@dallateas/ui/components/button";
import { cn } from "@dallateas/ui/lib/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useId, useRef, type MouseEvent, type ReactNode, type SyntheticEvent } from "react";

import { useHaptic } from "@/hooks/use-haptic";

type ModalProps = {
  onClose: () => void;
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  role?: "dialog" | "alertdialog";
  className?: string;
  children: ReactNode;
};

/**
 * The browser's modal dialog, which traps focus, closes on Escape and makes the page inert by itself.
 * It opens above everything, toasts included, so whatever goes wrong inside it has to be said inside it.
 */
export function Modal({ onClose, label, labelledBy, describedBy, role, className, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const { style } = document.documentElement;
    const previousOverflow = style.overflow;
    style.overflow = "hidden";
    dialog.showModal();

    return () => {
      dialog.close();
      style.overflow = previousOverflow;
    };
  }, []);

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    onClose();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      role={role}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className={cn(
        "m-auto max-h-[calc(100svh-2rem)] w-[calc(100vw-2rem)] max-w-sm overflow-y-auto rounded-xl bg-background p-0 text-foreground shadow-lg backdrop:bg-black/50",
        className,
      )}
    >
      {children}
    </dialog>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmPanel({
  title,
  description,
  confirmLabel = "Eliminar",
  isLoading = false,
  onConfirm,
  onCancel,
}: Omit<ConfirmDialogProps, "open">) {
  const haptic = useHaptic();
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    haptic.trigger("warning");
  }, [haptic]);

  return (
    <Modal role="alertdialog" labelledBy={titleId} describedBy={descriptionId} onClose={onCancel}>
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-1.5">
          <h2 id={titleId} className="font-heading text-xl font-semibold">
            {title}
          </h2>
          <p id={descriptionId} className="text-sm text-pretty text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" className="h-11 px-3 text-[13px] md:h-8" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" className="h-11 px-3 text-[13px] md:h-8" onClick={onConfirm} disabled={isLoading}>
            {isLoading && <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function ConfirmDialog({ open, ...panel }: ConfirmDialogProps) {
  return open ? <ConfirmPanel {...panel} /> : null;
}
