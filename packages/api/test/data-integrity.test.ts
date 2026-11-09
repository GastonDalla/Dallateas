import { beforeEach, describe, expect, test } from "bun:test";

import prisma from "@dallateas/db";

import { callerFor, createFolder, createUser, createVinyl, expectTrpcError, hasDatabase, resetDatabase } from "./helpers";

describe.skipIf(!hasDatabase)("collection data integrity", () => {
  beforeEach(resetDatabase);

  test("filtering by style alone returns the matching records", async () => {
    const owner = await createUser();
    const vinyl = await createVinyl(owner.id, [], { style: "Techno, Minimal" });
    await createVinyl(owner.id, [], { style: "Disco" });

    const { items } = await callerFor({ id: owner.id }).vinylsList({ styles: ["Minimal"] });

    expect(items.map((v) => v.id)).toEqual([vinyl.id]);
  });

  test("search ignores case", async () => {
    const owner = await createUser();
    const vinyl = await createVinyl(owner.id);

    const { items } = await callerFor({ id: owner.id }).vinylsList({ search: "robert HOOD" });

    expect(items.map((v) => v.id)).toEqual([vinyl.id]);
  });

  test("editing a record keeps its place in the folders it stays in", async () => {
    const owner = await createUser();
    const caller = callerFor({ id: owner.id });
    const folder = await createFolder(owner.id, { type: "SET" });
    const first = await createVinyl(owner.id, [folder.id]);
    const second = await createVinyl(owner.id, [folder.id], { title: "Second" });
    await caller.folderReorderVinyls({ folderId: folder.id, vinylOrder: [second.id, first.id] });

    await caller.vinylUpdate({ id: first.id, title: "Renamed", artist: "Robert Hood", folderIds: [folder.id] });

    const { vinyls } = await caller.folderGet({ id: folder.id });
    expect(vinyls.map((v) => v.id)).toEqual([second.id, first.id]);
  });

  test("a record added to a folder lands at the end", async () => {
    const owner = await createUser();
    const caller = callerFor({ id: owner.id });
    const folder = await createFolder(owner.id, { type: "SET" });
    const first = await createVinyl(owner.id, [folder.id]);
    const second = await createVinyl(owner.id, [folder.id], { title: "Second" });
    const third = await createVinyl(owner.id, [], { title: "Third" });

    await caller.vinylUpdate({ id: third.id, title: "Third", artist: "Robert Hood", folderIds: [folder.id] });

    const { vinyls } = await caller.folderGet({ id: folder.id });
    expect(vinyls.map((v) => v.id)).toEqual([first.id, second.id, third.id]);
  });

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

  test("duplicate tag names on a record do not fail", async () => {
    const owner = await createUser();

    const vinyl = await createVinyl(owner.id, [], { tagNames: ["peak", "peak"] });

    const detail = await callerFor({ id: owner.id }).vinylGet({ id: vinyl.id });
    expect(detail.tags).toHaveLength(1);
  });

  test("renaming a tag onto an existing one reports a conflict", async () => {
    const owner = await createUser();
    const caller = callerFor({ id: owner.id });
    const first = await caller.tagCreate({ name: "warmup" });
    await caller.tagCreate({ name: "peak" });

    await expectTrpcError(caller.tagRename({ id: first.id, name: "peak" }), "CONFLICT");
  });

  test("a gig with an unreadable date is rejected", async () => {
    const owner = await createUser();
    const caller = callerFor({ id: owner.id });
    await caller.djProfileUpdate({ slug: "someone" });

    await expectTrpcError(caller.djGigCreate({ name: "Club", date: "not-a-date" }), "BAD_REQUEST");
  });

  test("links must be http or https", async () => {
    const owner = await createUser();
    const caller = callerFor({ id: owner.id });

    await expectTrpcError(caller.djProfileUpdate({ websiteUrl: "javascript:alert(1)" }), "BAD_REQUEST");
    await expectTrpcError(
      caller.djProfileUpdate({ socialLinks: [{ platform: "web", url: "javascript:alert(1)" }] }),
      "BAD_REQUEST",
    );
    await expectTrpcError(
      caller.vinylCreate({ title: "A", artist: "B", coverUrl: "javascript:alert(1)" }),
      "BAD_REQUEST",
    );
  });

  test("a link typed without a scheme is stored as https", async () => {
    const owner = await createUser();
    const caller = callerFor({ id: owner.id });

    await caller.djProfileUpdate({ websiteUrl: "example.com/me" });

    expect((await caller.djProfileGet())?.websiteUrl).toBe("https://example.com/me");
  });

  test("links saved before validation existed are dropped when shown publicly", async () => {
    const owner = await createUser();
    await prisma.djProfile.create({
      data: {
        userId: owner.id,
        slug: "legacy",
        isPublic: true,
        websiteUrl: "javascript:alert(1)",
        socialLinks: JSON.stringify([
          { platform: "web", url: "javascript:alert(1)" },
          { platform: "web", url: "https://example.com" },
        ]),
      },
    });

    const profile = await callerFor().djProfilePublic({ slug: "legacy" });

    expect(profile.websiteUrl).toBeNull();
    expect(profile.socialLinks.map((link) => link.url)).toEqual(["https://example.com"]);
  });

  test("a profile slug cannot impersonate another user's username", async () => {
    await createUser({ username: "victim" });
    const attacker = await createUser();

    await expectTrpcError(callerFor({ id: attacker.id }).djProfileUpdate({ slug: "victim" }), "CONFLICT");
  });

  test("updating one profile field leaves the others alone", async () => {
    const owner = await createUser();
    const caller = callerFor({ id: owner.id });
    await caller.djProfileUpdate({ slug: "someone", bio: "Selector", isPublic: true });

    await caller.djProfileUpdate({ location: "Rosario" });

    const profile = await caller.djProfileGet();
    expect(profile).toMatchObject({ slug: "someone", bio: "Selector", isPublic: true, location: "Rosario" });
  });
});
