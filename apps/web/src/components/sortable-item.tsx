"use client";

import { KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@dallateas/ui/lib/utils";
import { GripVertical } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";

export type DragHandleProps = ButtonHTMLAttributes<HTMLButtonElement> & { ref: Ref<HTMLButtonElement> };

/** Mouse and touch instead of pointer events, so a finger scrolling the list never starts a drag by accident. */
export function useSortSensors() {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

type SortableHandleItemProps = {
  id: string;
  children: (handleProps: DragHandleProps) => ReactNode;
  disabled?: boolean;
  className?: string;
  role?: string;
};

export function SortableHandleItem({ id, children, disabled, className, role }: SortableHandleItemProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      role={role}
      className={className}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : undefined,
        position: "relative",
        zIndex: isDragging ? 10 : undefined,
      }}
    >
      {children({ ...attributes, ...listeners, ref: setActivatorNodeRef })}
    </div>
  );
}

type DragHandleButtonProps = {
  /** What gets moved, for screen readers. */
  label: string;
  handleProps: DragHandleProps;
  className?: string;
};

export function DragHandle({ label, handleProps, className }: DragHandleButtonProps) {
  return (
    <button
      type="button"
      {...handleProps}
      aria-label={label}
      className={cn(
        "flex size-11 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring active:cursor-grabbing md:h-9 md:w-8",
        className,
      )}
    >
      <GripVertical aria-hidden="true" className="size-4" />
    </button>
  );
}
