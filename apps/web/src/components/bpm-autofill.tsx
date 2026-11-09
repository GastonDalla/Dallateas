"use client";

import { createContext, use, useRef } from "react";
import { toast } from "sonner";

import { useInvalidateCollection } from "@/hooks/use-invalidate-collection";
import { useVinylBpmLookup } from "@/hooks/use-vinyl-bpm-lookup";

type NewVinyl = { id: string; title: string };

const BpmAutofillContext = createContext<(vinyl: NewVinyl) => void>(() => {});

function cuts(count: number) {
  return count === 1 ? "1 corte" : `${count} cortes`;
}

/**
 * Looks up the tempo of every record as soon as it is added, one record at a time, and keeps going
 * while the DJ moves between pages. It lives above the pages for that reason.
 */
export function BpmAutofillProvider({ children }: { children: React.ReactNode }) {
  const lookupVinyl = useVinylBpmLookup();
  const invalidate = useInvalidateCollection();
  const queueRef = useRef<NewVinyl[]>([]);
  const runningRef = useRef(false);

  async function drain() {
    if (runningRef.current) return;
    runningRef.current = true;

    try {
      for (let vinyl = queueRef.current.shift(); vinyl; vinyl = queueRef.current.shift()) {
        try {
          const { searched, found } = await lookupVinyl(vinyl.id);
          await invalidate(vinyl.id);
          if (searched === 0) continue;

          if (found > 0) {
            toast.success(`BPM de ${vinyl.title}: ${found} de ${cuts(searched)}`, {
              description: "Son aproximados, confirmalos con el tap o el micrófono",
            });
          } else {
            toast(`No encontré el BPM de ${vinyl.title}`, { description: "Medilo con el tap o el micrófono" });
          }
        } catch {
          // The hourly limit or a dropped connection: the record keeps its "Buscar BPM" button.
        }
      }
    } finally {
      runningRef.current = false;
    }
  }

  function enqueue(vinyl: NewVinyl) {
    queueRef.current.push(vinyl);
    void drain();
  }

  return <BpmAutofillContext value={enqueue}>{children}</BpmAutofillContext>;
}

/** Queues a record that was just added for a tempo lookup. */
export function useBpmAutofill() {
  return use(BpmAutofillContext);
}
