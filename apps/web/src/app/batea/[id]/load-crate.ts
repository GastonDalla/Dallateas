import "server-only";

import { cache } from "react";

import { getServerCaller } from "@/server/trpc";

import { isAccountRequired, isMissingRecord } from "../record-errors";

/** Read once per request: the metadata and the page both need it. */
export const loadCrate = cache(async (id: string) => {
  const caller = await getServerCaller();

  try {
    return { status: "visible", folder: await caller.publicFolderDetail({ id }) } as const;
  } catch (error) {
    if (isMissingRecord(error)) return { status: "missing" } as const;
    if (isAccountRequired(error)) return { status: "account-required" } as const;
    throw error;
  }
});

export type VisibleCrate = Extract<Awaited<ReturnType<typeof loadCrate>>, { status: "visible" }>["folder"];
