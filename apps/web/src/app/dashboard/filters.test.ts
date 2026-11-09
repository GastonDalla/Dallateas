import { describe, expect, test } from "bun:test";

import { hasFilters, NO_FILTERS, paramsFromPage, parseFilters, serializeFilters, toVinylsListInput } from "./filters";

describe("parseFilters", () => {
  test("gives no filters for an empty address", () => {
    expect(parseFilters(new URLSearchParams())).toEqual(NO_FILTERS);
  });

  test("reads every filter", () => {
    const params = new URLSearchParams(
      "q=hood&barcode=123&folder=f1&genre=Electronic&genre=Rock&style=Techno&tag=t1&key=8A&key=9A&bpmMin=120&bpmMax=128",
    );
    expect(parseFilters(params)).toEqual({
      search: "hood",
      barcode: "123",
      folderId: "f1",
      genres: ["Electronic", "Rock"],
      styles: ["Techno"],
      tagIds: ["t1"],
      keys: ["8A", "9A"],
      bpmMin: 120,
      bpmMax: 128,
    });
  });

  test("drops a tempo the API would reject", () => {
    const filters = parseFilters(new URLSearchParams("bpmMin=5&bpmMax=rapido"));
    expect(filters.bpmMin).toBeUndefined();
    expect(filters.bpmMax).toBeUndefined();
  });

  test("drops a key it cannot read and normalizes the rest", () => {
    expect(parseFilters(new URLSearchParams("key=Am&key=nada")).keys).toEqual(["8A"]);
  });

  test("caps what the API caps, so a long link cannot break the page", () => {
    const params = new URLSearchParams(Array.from({ length: 30 }, (_, index) => ["genre", `g${index}`]));
    expect(parseFilters(params).genres).toHaveLength(20);
    expect(parseFilters(new URLSearchParams(`q=${"a".repeat(300)}`)).search).toHaveLength(200);
  });

  test("drops an id longer than the API accepts", () => {
    expect(parseFilters(new URLSearchParams(`folder=${"f".repeat(31)}`)).folderId).toBeUndefined();
  });
});

describe("serializeFilters", () => {
  test("gives an empty string without filters", () => {
    expect(serializeFilters(NO_FILTERS)).toBe("");
  });

  test("round trips through parseFilters", () => {
    const filters = {
      ...NO_FILTERS,
      search: "hood",
      genres: ["Electronic", "Rock"],
      keys: ["8A"],
      bpmMin: 120.5,
      bpmMax: 128,
      folderId: "f1",
    };
    expect(parseFilters(new URLSearchParams(serializeFilters(filters)))).toEqual(filters);
  });
});

describe("toVinylsListInput", () => {
  test("gives an empty input without filters, the same key on server and client", () => {
    expect(toVinylsListInput(NO_FILTERS)).toEqual({});
  });

  test("passes the filters the API takes", () => {
    expect(
      toVinylsListInput({
        ...NO_FILTERS,
        search: "hood",
        barcode: "123",
        folderId: "f1",
        genres: ["Rock"],
        styles: ["Techno"],
        tagIds: ["t1"],
        keys: ["8A"],
        bpmMin: 120,
        bpmMax: 128,
      }),
    ).toEqual({
      search: "hood",
      barcode: "123",
      folderId: "f1",
      genres: ["Rock"],
      styles: ["Techno"],
      tagIds: ["t1"],
      keys: ["8A"],
      bpmMin: 120,
      bpmMax: 128,
    });
  });

  test("swaps a range typed backwards", () => {
    expect(toVinylsListInput({ ...NO_FILTERS, bpmMin: 130, bpmMax: 120 })).toEqual({ bpmMin: 120, bpmMax: 130 });
  });

  test("keeps an open range open", () => {
    expect(toVinylsListInput({ ...NO_FILTERS, bpmMin: 130 })).toEqual({ bpmMin: 130 });
  });
});

describe("hasFilters", () => {
  test("is false with nothing set", () => {
    expect(hasFilters(NO_FILTERS)).toBe(false);
  });

  test("is true with a search, a barcode, a folder, a list or a tempo", () => {
    expect(hasFilters({ ...NO_FILTERS, search: "a" })).toBe(true);
    expect(hasFilters({ ...NO_FILTERS, barcode: "1" })).toBe(true);
    expect(hasFilters({ ...NO_FILTERS, folderId: "f" })).toBe(true);
    expect(hasFilters({ ...NO_FILTERS, keys: ["8A"] })).toBe(true);
    expect(hasFilters({ ...NO_FILTERS, bpmMax: 120 })).toBe(true);
  });
});

describe("paramsFromPage", () => {
  test("turns a page's search params into URLSearchParams, repeated values included", () => {
    const params = paramsFromPage({ q: "hood", genre: ["Rock", "Pop"], folder: undefined });
    expect(params.get("q")).toBe("hood");
    expect(params.getAll("genre")).toEqual(["Rock", "Pop"]);
    expect(params.has("folder")).toBe(false);
  });
});
