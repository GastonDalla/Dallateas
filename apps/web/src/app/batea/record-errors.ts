import { TRPCError } from "@trpc/server";

/** A malformed id can never match a record, so it reads the same as one that does not exist. */
export function isMissingRecord(error: unknown) {
  return error instanceof TRPCError && (error.code === "NOT_FOUND" || error.code === "BAD_REQUEST");
}

export function isAccountRequired(error: unknown) {
  return error instanceof TRPCError && error.code === "UNAUTHORIZED";
}
