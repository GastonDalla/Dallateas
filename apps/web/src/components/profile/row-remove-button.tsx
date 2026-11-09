import { Button } from "@dallateas/ui/components/button";
import { X } from "lucide-react";

export function RowRemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      aria-label={label}
      onClick={onClick}
      className="size-11 shrink-0 text-muted-foreground hover:text-destructive md:size-9"
    >
      <X aria-hidden="true" />
    </Button>
  );
}
