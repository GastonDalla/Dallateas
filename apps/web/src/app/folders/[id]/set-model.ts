const locationOrder = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

/** Index runs for the tempo line, which breaks at a record without a tempo instead of inventing one. */
export function tempoRuns(points: readonly { bpm: number | null }[]) {
  const runs: number[][] = [];

  points.forEach(({ bpm }, index) => {
    if (bpm === null) return;
    const current = runs.at(-1);
    if (current?.at(-1) === index - 1) current.push(index);
    else runs.push([index]);
  });

  return runs;
}

/** Records by the place they live, so a DJ packs shelf by shelf instead of walking the room for each one. */
export function packingGroups<T extends { vinyl: { location: string | null } }>(rows: readonly T[]) {
  const groups = new Map<string, { location: string | null; rows: T[] }>();

  for (const row of rows) {
    const location = row.vinyl.location?.trim() || null;
    const place = location?.toLocaleLowerCase("es") ?? "";
    const group = groups.get(place);
    if (group) group.rows.push(row);
    else groups.set(place, { location, rows: [row] });
  }

  return [...groups.values()].toSorted((a, b) => {
    if (a.location === null) return 1;
    if (b.location === null) return -1;
    return locationOrder.compare(a.location, b.location);
  });
}
