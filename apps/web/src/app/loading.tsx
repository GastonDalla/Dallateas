import { Disc3 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Disc3 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
