import { describe, expect, test } from "bun:test";

import { cratesInput } from "./crates-query";

describe("cratesInput", () => {
  test("asks for the first page with no filters", () => {
    expect(cratesInput({})).toEqual({ limit: 50 });
  });

  test("treats an empty search as no search, so it shares the first page's cache", () => {
    expect(cratesInput({ search: "" })).toEqual({ limit: 50 });
  });

  test("passes the filters on", () => {
    expect(cratesInput({ search: "house", type: "SET", genre: "Electronic" })).toEqual({
      limit: 50,
      search: "house",
      type: "SET",
      genre: "Electronic",
    });
  });
});
