import { describe, expect, test } from "bun:test";

import { packingGroups, tempoRuns } from "./set-model";

describe("tempoRuns", () => {
  test("breaks the line at records without a tempo", () => {
    const points = [124, 126, null, 128, null, null, 130, 132].map((bpm) => ({ bpm }));

    expect(tempoRuns(points)).toEqual([[0, 1], [3], [6, 7]]);
  });

  test("returns nothing for a set without tempos", () => {
    expect(tempoRuns([{ bpm: null }, { bpm: null }])).toEqual([]);
  });
});

describe("packingGroups", () => {
  function row(id: string, location: string | null) {
    return { id, vinyl: { location } };
  }

  test("groups records by where they live, keeping set order inside each place", () => {
    const groups = packingGroups([row("a", "Estante 2"), row("b", "Bolsa"), row("c", "Estante 2")]);

    expect(groups.map(({ location, rows }) => [location, rows.map(({ id }) => id)])).toEqual([
      ["Bolsa", ["b"]],
      ["Estante 2", ["a", "c"]],
    ]);
  });

  test("orders numbered shelves as numbers", () => {
    const groups = packingGroups([row("a", "Estante 10"), row("b", "Estante 2")]);

    expect(groups.map(({ location }) => location)).toEqual(["Estante 2", "Estante 10"]);
  });

  test("treats spacing and case as the same place", () => {
    const groups = packingGroups([row("a", "Bolsa"), row("b", " bolsa ")]);

    expect(groups).toHaveLength(1);
    expect(groups[0]!.location).toBe("Bolsa");
  });

  test("leaves records without a location for last", () => {
    const groups = packingGroups([row("a", null), row("b", "  "), row("c", "Bolsa")]);

    expect(groups.map(({ location }) => location)).toEqual(["Bolsa", null]);
    expect(groups[1]!.rows.map(({ id }) => id)).toEqual(["a", "b"]);
  });
});
