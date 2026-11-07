import { beforeEach, describe, expect, test } from "bun:test";

import prisma from "@dallateas/db";

import { callerFor, createFolder, createUser, expectTrpcError, hasDatabase, resetDatabase } from "./helpers";

describe.skipIf(!hasDatabase)("collection data integrity", () => {
  beforeEach(resetDatabase);

  test("editing a folder without touching the password keeps it", async () => {
    const owner = await createUser();
    const folder = await createFolder(owner.id, { password: "secret-word" });

    const updated = await callerFor({ id: owner.id }).folderUpdate({ id: folder.id, name: "Renamed", type: "OTHER" });

    expect(updated.hasPassword).toBe(true);
    const stored = await prisma.folder.findUniqueOrThrow({ where: { id: folder.id } });
    expect(stored.password).not.toBeNull();
  });

  test("the owner can still remove a folder password on purpose", async () => {
    const owner = await createUser();
    const folder = await createFolder(owner.id, { password: "secret-word" });

    const updated = await callerFor({ id: owner.id }).folderUpdate({
      id: folder.id,
      name: "Crate",
      type: "OTHER",
      password: null,
    });

    expect(updated.hasPassword).toBe(false);
  });

  test("making a folder private keeps its password for when it goes public again", async () => {
    const owner = await createUser();
    const folder = await createFolder(owner.id, { password: "secret-word" });
    const caller = callerFor({ id: owner.id });

    await caller.folderSetVisibility({ id: folder.id, visibility: "PRIVATE" });
    const reopened = await caller.folderSetVisibility({ id: folder.id, visibility: "PUBLIC" });

    expect(reopened.hasPassword).toBe(true);
  });

  test("a whitespace-only folder password is rejected instead of stored as none", async () => {
    const owner = await createUser();

    await expectTrpcError(
      callerFor({ id: owner.id }).folderCreate({ name: "Crate", type: "OTHER", password: "      " }),
      "BAD_REQUEST",
    );
  });

  test("viewing a folder does not make it look recently updated", async () => {
    const owner = await createUser();
    const folder = await createFolder(owner.id);
    const before = await prisma.folder.findUniqueOrThrow({ where: { id: folder.id } });

    await callerFor().folderRecordView({ id: folder.id });

    const after = await prisma.folder.findUniqueOrThrow({ where: { id: folder.id } });
    expect(after.viewCount).toBe(before.viewCount + 1);
    expect(after.updatedAt).toEqual(before.updatedAt);
  });
});
