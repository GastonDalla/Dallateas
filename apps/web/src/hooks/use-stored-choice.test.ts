import { afterEach, describe, expect, test } from "bun:test";

import { createStoredChoice } from "./use-stored-choice";

const parse = (raw: string | null) => (raw === "a" || raw === "b" ? raw : null);

afterEach(() => {
  Reflect.deleteProperty(globalThis, "localStorage");
});

function stubStorage(storage: Pick<Storage, "getItem" | "setItem">) {
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
}

describe("createStoredChoice", () => {
  test("gives the fallback when nothing is stored", () => {
    stubStorage({ getItem: () => null, setItem: () => {} });
    expect(createStoredChoice<"a" | "b">("k", "a", parse).read()).toBe("a");
  });

  test("reads what is stored", () => {
    stubStorage({ getItem: () => "b", setItem: () => {} });
    expect(createStoredChoice<"a" | "b">("k", "a", parse).read()).toBe("b");
  });

  test("ignores a stored value it does not recognize", () => {
    stubStorage({ getItem: () => "z", setItem: () => {} });
    expect(createStoredChoice<"a" | "b">("k", "a", parse).read()).toBe("a");
  });

  test("stores what is written", () => {
    const stored = new Map<string, string>();
    stubStorage({ getItem: (key) => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) });
    createStoredChoice<"a" | "b">("k", "a", parse).write("b");
    expect(stored.get("k")).toBe("b");
  });

  test("survives storage that throws, and keeps the choice for this visit", () => {
    const fail = () => {
      throw new Error("denied");
    };
    stubStorage({ getItem: fail, setItem: fail });
    const choice = createStoredChoice<"a" | "b">("k", "a", parse);
    expect(choice.read()).toBe("a");
    choice.write("b");
    expect(choice.read()).toBe("b");
  });

  test("survives a browser with no storage at all", () => {
    expect(createStoredChoice<"a" | "b">("k", "a", parse).read()).toBe("a");
  });
});
