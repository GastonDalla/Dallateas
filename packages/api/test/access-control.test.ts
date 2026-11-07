import { beforeEach, describe, expect, test } from "bun:test";

import prisma from "@dallateas/db";

import {
  callerFor,
  cookiePair,
  createFolder,
  createUser,
  createVinyl,
  expectTrpcError,
  hasDatabase,
  resetDatabase,
  visitor,
} from "./helpers";

describe.skipIf(!hasDatabase)("folder and vinyl access control", () => {
  beforeEach(resetDatabase);

  test("anonymous visitors cannot read a vinyl inside a password-protected folder", async () => {
    const owner = await createUser();
    const folder = await createFolder(owner.id, { password: "secret-word" });
    const vinyl = await createVinyl(owner.id, [folder.id]);

    await expectTrpcError(callerFor().publicVinylGet({ id: vinyl.id, folderId: folder.id }), "NOT_FOUND");
  });

  test("anonymous visitors cannot read a vinyl inside an account-only folder", async () => {
    const owner = await createUser();
    const folder = await createFolder(owner.id, { visibility: "ACCOUNT" });
    const vinyl = await createVinyl(owner.id, [folder.id]);

    await expectTrpcError(callerFor().publicVinylGet({ id: vinyl.id, folderId: folder.id }), "NOT_FOUND");
  });

  test("a public vinyl never exposes the owner's private fields", async () => {
    const owner = await createUser();
    const folder = await createFolder(owner.id);
    const vinyl = await createVinyl(owner.id, [folder.id]);

    const result = await callerFor().publicVinylGet({ id: vinyl.id, folderId: folder.id });

    expect(result.title).toBe("Minus");
    for (const field of ["mixNotes", "pricePaid", "barcode", "userId"]) {
      expect(result).not.toHaveProperty(field);
    }
  });

  test("the public listing shows anonymous visitors only public folders", async () => {
    const owner = await createUser();
    const publicFolder = await createFolder(owner.id);
    await createFolder(owner.id, { visibility: "ACCOUNT" });
    await createFolder(owner.id, { visibility: "PRIVATE" });

    const { items } = await callerFor().publicFolders({});

    expect(items.map((folder) => folder.id)).toEqual([publicFolder.id]);
  });

  test("the public listing hides the records of a password-protected folder", async () => {
    const owner = await createUser();
    const folder = await createFolder(owner.id, { password: "secret-word" });
    await createVinyl(owner.id, [folder.id]);

    const { items } = await callerFor().publicFolders({});

    expect(items[0]?.hasPassword).toBe(true);
    expect(items[0]?.vinyls).toEqual([]);
  });

  test("the folder password hash never reaches a client", async () => {
    const owner = await createUser();
    const guest = await createUser();
    const folder = await createFolder(owner.id, { password: "secret-word" });
    await callerFor({ id: owner.id }).folderInvite({ folderId: folder.id, email: guest.email, role: "VIEWER" });

    const responses = await Promise.all([
      callerFor({ id: guest.id }).folderGet({ id: folder.id }),
      callerFor({ id: guest.id }).myCollaborations(),
      callerFor({ id: owner.id }).foldersList(),
      callerFor({ id: owner.id }).folderGet({ id: folder.id }),
      callerFor({ id: owner.id }).folderSetVisibility({ id: folder.id, visibility: "PUBLIC" }),
    ]);

    const stored = await prisma.folder.findUniqueOrThrow({ where: { id: folder.id } });
    expect(JSON.stringify(responses)).not.toContain(stored.password!);
    expect(JSON.stringify(folder)).not.toContain(stored.password!);
  });

  test("a wrong password leaves the folder locked and the right one unlocks it", async () => {
    const owner = await createUser();
    const folder = await createFolder(owner.id, { password: "secret-word" });
    const vinyl = await createVinyl(owner.id, [folder.id]);
    const { caller, setCookies } = visitor();

    await expectTrpcError(caller.folderUnlock({ id: folder.id, password: "wrong" }), "UNAUTHORIZED");
    expect(setCookies).toEqual([]);

    await caller.folderUnlock({ id: folder.id, password: "secret-word" });
    const unlocked = callerFor(undefined, cookiePair(setCookies[0]!));

    const detail = await unlocked.publicFolderDetail({ id: folder.id });
    expect(detail.locked).toBe(false);
    expect(detail.vinyls.map((v) => v.id)).toEqual([vinyl.id]);
    expect((await unlocked.publicVinylGet({ id: vinyl.id, folderId: folder.id })).id).toBe(vinyl.id);
  });

  test("changing the password invalidates earlier unlocks", async () => {
    const owner = await createUser();
    const folder = await createFolder(owner.id, { password: "secret-word" });
    const { caller, setCookies } = visitor();
    await caller.folderUnlock({ id: folder.id, password: "secret-word" });

    await callerFor({ id: owner.id }).folderUpdate({ id: folder.id, name: "Crate", type: "OTHER", password: "other-word" });

    const detail = await callerFor(undefined, cookiePair(setCookies[0]!)).publicFolderDetail({ id: folder.id });
    expect(detail.locked).toBe(true);
    expect(detail.vinyls).toEqual([]);
  });

  test("repeated wrong passwords are throttled", async () => {
    const owner = await createUser();
    const folder = await createFolder(owner.id, { password: "secret-word" });
    const { caller } = visitor();

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await expectTrpcError(caller.folderUnlock({ id: folder.id, password: "wrong" }), "UNAUTHORIZED");
    }

    await expectTrpcError(caller.folderUnlock({ id: folder.id, password: "secret-word" }), "TOO_MANY_REQUESTS");
  });

  test("one visitor past their limit cannot lock a folder for everyone else", async () => {
    const owner = await createUser();
    const folder = await createFolder(owner.id, { password: "secret-word" });
    const attacker = visitor("10.9.9.1").caller;

    for (let attempt = 0; attempt < 110; attempt += 1) {
      await attacker.folderUnlock({ id: folder.id, password: "wrong" }).catch(() => undefined);
    }

    const { caller, setCookies } = visitor("10.9.9.2");
    await caller.folderUnlock({ id: folder.id, password: "secret-word" });
    expect(setCookies).toHaveLength(1);
  });

  test("filtering the listing by genre cannot reveal what a locked folder holds", async () => {
    const owner = await createUser();
    const folder = await createFolder(owner.id, { password: "secret-word" });
    await createVinyl(owner.id, [folder.id], { genre: "Techno" });

    const { items } = await callerFor().publicFolders({ genre: "Techno" });

    expect(items).toEqual([]);
  });

  test("listings leave out inline photos, which are too heavy to send in bulk", async () => {
    const owner = await createUser();
    const folder = await createFolder(owner.id);
    await createVinyl(owner.id, [folder.id], { coverUrl: "data:image/jpeg;base64,AAAA" });

    const { items } = await callerFor().publicFolders({});

    expect(items[0]?.vinyls[0]?.coverUrl).toBeNull();
  });

  test("a view for a folder that does not exist leaves no trace", async () => {
    await callerFor().folderRecordView({ id: "missing-folder" });

    expect(await prisma.rateLimit.count()).toBe(0);
  });

  test("collaborators do not see what the owner paid or their mix notes", async () => {
    const owner = await createUser();
    const guest = await createUser();
    const folder = await createFolder(owner.id, { visibility: "PRIVATE" });
    await createVinyl(owner.id, [folder.id]);
    await callerFor({ id: owner.id }).folderInvite({ folderId: folder.id, email: guest.email, role: "VIEWER" });

    const { vinyls } = await callerFor({ id: guest.id }).folderGet({ id: folder.id });

    expect(vinyls[0]).toMatchObject({ pricePaid: null, mixNotes: null });
  });

  test("an owner can remove a collaborator and change their role", async () => {
    const owner = await createUser();
    const guest = await createUser();
    const folder = await createFolder(owner.id, { visibility: "PRIVATE" });
    const ownerCaller = callerFor({ id: owner.id });
    await ownerCaller.folderInvite({ folderId: folder.id, email: guest.email, role: "VIEWER" });

    await ownerCaller.folderUpdateCollaboratorRole({ folderId: folder.id, userId: guest.id, role: "EDITOR" });
    expect((await ownerCaller.folderCollaborators({ folderId: folder.id }))[0]?.role).toBe("EDITOR");

    await ownerCaller.folderRemoveCollaborator({ folderId: folder.id, userId: guest.id });
    await expectTrpcError(callerFor({ id: guest.id }).folderGet({ id: folder.id }), "NOT_FOUND");
  });

  test("inviting answers the same whether or not the account exists", async () => {
    const owner = await createUser();
    const guest = await createUser();
    const folder = await createFolder(owner.id, { visibility: "PRIVATE" });
    const ownerCaller = callerFor({ id: owner.id });

    const known = await ownerCaller.folderInvite({ folderId: folder.id, email: guest.email, role: "VIEWER" });
    const unknown = await ownerCaller.folderInvite({ folderId: folder.id, email: "nobody@example.com", role: "VIEWER" });

    expect(unknown).toEqual(known);
  });

  test("non-admins cannot reach admin procedures", async () => {
    const user = await createUser();
    const caller = callerFor({ id: user.id });

    await expectTrpcError(caller.adminGetUser({ userId: user.id }), "FORBIDDEN");
    await expectTrpcError(caller.adminFolders({}), "FORBIDDEN");
    await expectTrpcError(caller.adminUpdateUser({ userId: user.id, name: "x" }), "FORBIDDEN");
  });
});
