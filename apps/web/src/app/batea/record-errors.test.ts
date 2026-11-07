import { describe, expect, test } from "bun:test";
import { TRPCError } from "@trpc/server";

import { isAccountRequired, isMissingRecord } from "./record-errors";

describe("isMissingRecord", () => {
  test("reads a missing record and a malformed id as missing", () => {
    expect(isMissingRecord(new TRPCError({ code: "NOT_FOUND" }))).toBe(true);
    expect(isMissingRecord(new TRPCError({ code: "BAD_REQUEST" }))).toBe(true);
  });

  test("leaves real failures alone, so they reach the error page", () => {
    expect(isMissingRecord(new TRPCError({ code: "INTERNAL_SERVER_ERROR" }))).toBe(false);
    expect(isMissingRecord(new Error("database down"))).toBe(false);
  });
});

describe("isAccountRequired", () => {
  test("is true only for a crate that asks for an account", () => {
    expect(isAccountRequired(new TRPCError({ code: "UNAUTHORIZED" }))).toBe(true);
    expect(isAccountRequired(new TRPCError({ code: "NOT_FOUND" }))).toBe(false);
  });
});
