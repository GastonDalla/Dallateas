"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

function formatDate(date: Date, timeZone?: string) {
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric", timeZone }).format(date);
}

/** A date in the reader's time zone. The server does not know it, so it renders UTC and the browser corrects it. */
export function LocalDate({ date }: { date: Date }) {
  const text = useSyncExternalStore(
    subscribe,
    () => formatDate(date),
    () => formatDate(date, "UTC"),
  );

  return <time dateTime={date.toISOString()}>{text}</time>;
}
