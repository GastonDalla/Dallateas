import { keyLabel, parseKey } from "@dallateas/dj/camelot";

/** A key in both notations, since DJs read either: "8A Am". */
export function KeyTag({ value }: { value: string | null | undefined }) {
  const key = parseKey(value);
  if (!key) return <span className="text-muted-foreground">—</span>;

  return (
    <span className="tabular whitespace-nowrap">
      {key} <span className="text-muted-foreground">{keyLabel(key)}</span>
    </span>
  );
}
