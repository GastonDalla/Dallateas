import { useSyncExternalStore } from "react";

type Choice = string | number;

/**
 * A small preference kept per browser. Storage can be missing or refuse a write, as in a private
 * window, so the last choice also stays in memory and the control keeps working for the visit.
 */
export function createStoredChoice<T extends Choice>(key: string, fallback: T, parse: (raw: string | null) => T | null) {
  const listeners = new Set<() => void>();
  let remembered: T | null = null;

  function read(): T {
    if (remembered !== null) return remembered;
    try {
      return parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function write(value: T) {
    remembered = value;
    try {
      localStorage.setItem(key, String(value));
    } catch {
      // The choice stays in memory for this visit.
    }
    for (const listener of listeners) listener();
  }

  function subscribe(listener: () => void) {
    function onStorage(event: StorageEvent) {
      if (event.key !== key) return;
      remembered = null;
      listener();
    }

    listeners.add(listener);
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  function useChoice() {
    const value = useSyncExternalStore(subscribe, read, () => fallback);
    return [value, write] as const;
  }

  return { read, write, useChoice };
}
