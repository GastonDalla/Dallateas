"use client";

import { Button } from "@dallateas/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shell/empty-state";
import { useHaptic } from "@/hooks/use-haptic";
import { trpc } from "@/utils/trpc";

import { Field, FormSection } from "./fields";
import { RowRemoveButton } from "./row-remove-button";

export type Gig = {
  id: string;
  name: string;
  venue: string | null;
  city: string | null;
  date: Date;
};

const EMPTY_GIG = { name: "", venue: "", city: "", date: "", ticketUrl: "" };

function useRefreshProfile() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: trpc.djProfileGet.queryKey() });
}

function GigForm({ onClose }: { onClose: () => void }) {
  const haptic = useHaptic();
  const refreshProfile = useRefreshProfile();
  const [gig, setGig] = useState(EMPTY_GIG);

  function update(changes: Partial<typeof EMPTY_GIG>) {
    setGig((current) => ({ ...current, ...changes }));
  }

  const create = useMutation({
    ...trpc.djGigCreate.mutationOptions(),
    onSuccess: async () => {
      haptic.trigger("success");
      await refreshProfile();
      toast.success("Fecha agregada");
      onClose();
    },
    onError: (error) => toast.error(error.message),
  });

  function submit() {
    create.mutate({
      name: gig.name.trim(),
      venue: gig.venue.trim() || undefined,
      city: gig.city.trim() || undefined,
      // The field holds the DJ's local time, and the server would read it in its own zone.
      date: new Date(gig.date).toISOString(),
      ticketUrl: gig.ticketUrl.trim() || undefined,
    });
  }

  return (
    <form
      noValidate
      className="space-y-4 border-t border-border pt-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <Field
        id="gig-name"
        label="Nombre del evento"
        maxLength={200}
        value={gig.name}
        onChange={(event) => update({ name: event.target.value })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="gig-venue"
          label="Lugar"
          optional
          maxLength={200}
          value={gig.venue}
          onChange={(event) => update({ venue: event.target.value })}
        />
        <Field
          id="gig-city"
          label="Ciudad"
          optional
          maxLength={100}
          value={gig.city}
          onChange={(event) => update({ city: event.target.value })}
        />
      </div>
      <Field
        id="gig-date"
        label="Fecha y hora"
        type="datetime-local"
        value={gig.date}
        onChange={(event) => update({ date: event.target.value })}
      />
      <Field
        id="gig-tickets"
        label="Link de entradas"
        optional
        type="url"
        inputMode="url"
        placeholder="https://"
        maxLength={500}
        value={gig.ticketUrl}
        onChange={(event) => update({ ticketUrl: event.target.value })}
      />
      <div className="flex gap-2">
        <Button
          type="submit"
          variant="outline"
          disabled={!gig.name.trim() || !gig.date || create.isPending}
          className="h-11 px-3 text-sm md:h-9"
        >
          {create.isPending && <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />}
          Agregar fecha
        </Button>
        <Button type="button" variant="ghost" onClick={onClose} className="h-11 px-3 text-sm md:h-9">
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function GigRow({ gig }: { gig: Gig }) {
  const haptic = useHaptic();
  const refreshProfile = useRefreshProfile();

  const remove = useMutation({
    ...trpc.djGigDelete.mutationOptions(),
    onSuccess: async () => {
      haptic.trigger("success");
      await refreshProfile();
      toast.success("Fecha eliminada");
    },
    onError: (error) => toast.error(error.message),
  });

  const date = new Date(gig.date);
  const place = [gig.venue, gig.city].filter(Boolean).join(", ");

  return (
    <li className="flex items-center gap-4 py-3">
      {/* The server renders this in its own time zone, the browser in the DJ's. */}
      <time
        dateTime={date.toISOString()}
        suppressHydrationWarning
        className="w-14 shrink-0 font-heading text-base font-semibold tabular"
      >
        {date.toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
      </time>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{gig.name}</p>
        {place && <p className="truncate text-[13px] text-muted-foreground">{place}</p>}
      </div>
      <RowRemoveButton label={`Eliminar ${gig.name}`} onClick={() => remove.mutate({ id: gig.id })} />
    </li>
  );
}

type GigsSectionProps = {
  gigs: Gig[];
  /** Dates hang off the profile, so it has to exist first. */
  canAdd: boolean;
};

export function GigsSection({ gigs, canAdd }: GigsSectionProps) {
  const [adding, setAdding] = useState(false);

  return (
    <FormSection title="Próximas fechas" description="Se guardan apenas las agregás">
      {gigs.length > 0 ? (
        <ul className="divide-y divide-border">
          {gigs.map((gig) => (
            <GigRow key={gig.id} gig={gig} />
          ))}
        </ul>
      ) : (
        !adding && (
          <EmptyState
            title="Sin fechas por ahora"
            description={canAdd ? "Sumá la próxima y aparece en tu perfil" : "Guardá tu perfil para agregar fechas"}
          />
        )
      )}

      {adding ? (
        <GigForm onClose={() => setAdding(false)} />
      ) : (
        canAdd && (
          <Button type="button" variant="outline" onClick={() => setAdding(true)} className="h-11 px-3 text-sm md:h-9">
            <Plus aria-hidden="true" />
            Agregar fecha
          </Button>
        )
      )}
    </FormSection>
  );
}
