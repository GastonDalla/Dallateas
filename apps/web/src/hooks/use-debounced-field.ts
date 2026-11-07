"use client";

import { useEffect, useRef, useState } from "react";

/** Text someone is typing, committed after a pause. It follows the committed value when that changes from outside. */
export function useDebouncedField(value: string, commit: (text: string) => void, delay = 300) {
  const [text, setText] = useState(value);
  const [committed, setCommitted] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  if (value !== committed) {
    setCommitted(value);
    setText(value);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  function change(next: string) {
    setText(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(next), delay);
  }

  return [text, change] as const;
}
