import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import prisma from "@dallateas/db";

import { normalizeName, sameArtist, sameTitle } from "../src/bpm-lookup";
import { callerFor, createFolder, createUser, createVinyl, expectTrpcError, hasDatabase, resetDatabase } from "./helpers";

const realFetch = globalThis.fetch;

function stubDeezer(responses: Record<string, unknown>) {
  globalThis.fetch = mock(async (url: string | URL | Request) => {
    const path = String(url);
    const key = Object.keys(responses).find((fragment) => path.includes(fragment));
    return new Response(JSON.stringify(key ? responses[key] : {}), { status: key ? 200 : 404 });
  }) as unknown as typeof fetch;
}

const twoTracks = [
  { side: "A1", position: 0, title: "Minus", duration: "6:30" },
  { side: "B1", position: 1, title: "Plus", duration: "5:10" },
];

test("names are compared without Discogs suffixes or punctuation", () => {
  expect(normalizeName("Robert Hood (2)")).toBe("robert hood");
  expect(normalizeName("Pick-Up!")).toBe("pick up");
  expect(normalizeName("Beyoncé")).toBe("beyonce");
});

test("a title matches its own mix names but not a longer title", () => {
  expect(sameTitle("Minus", "Minus (Original Mix)")).toBe(true);
  expect(sameTitle("Pick Up", "Pick-Up")).toBe(true);
  expect(sameTitle("Plus", "Plus One")).toBe(false);
  expect(sameTitle("Love", "Glove")).toBe(false);
});

test("an artist matches a collaboration but not a shared word", () => {
  expect(sameArtist("Robert Hood (2)", "Robert Hood")).toBe(true);
  expect(sameArtist("Robert Hood", "Robert Hood & Floorplan")).toBe(true);
  expect(sameArtist("Hood", "Robert Hood")).toBe(false);
  expect(sameArtist("The Orb", "Orbital")).toBe(false);
});

describe.skipIf(!hasDatabase)("per-track BPM", () => {
  beforeEach(resetDatabase);
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  test("each track keeps its own tempo, key and cue notes", async () => {
    const owner = await createUser();
    const caller = callerFor({ id: owner.id });
    const vinyl = await createVinyl(owner.id, [], { tracks: twoTracks });
    const { tracks } = await caller.vinylGet({ id: vinyl.id });

    await caller.trackUpdate({ id: tracks[0]!.id, bpm: 128.5, bpmSource: "TAP", camelotKey: "Am", energy: 4, cueNotes: "Bombo en 0:16" });

    const updated = await caller.vinylGet({ id: vinyl.id });
    expect(updated.tracks[0]).toMatchObject({ bpm: 128.5, bpmSource: "TAP", camelotKey: "8A", energy: 4, cueNotes: "Bombo en 0:16" });
    expect(updated.tracks[1]).toMatchObject({ bpm: null, camelotKey: null });
  });

  test("clearing a tempo clears where it came from", async () => {
    const owner = await createUser();
    const caller = callerFor({ id: owner.id });
    const vinyl = await createVinyl(owner.id, [], { tracks: twoTracks });
    const { tracks } = await caller.vinylGet({ id: vinyl.id });
    await caller.trackUpdate({ id: tracks[0]!.id, bpm: 128, bpmSource: "MIC" });

    await caller.trackUpdate({ id: tracks[0]!.id, bpm: null });

    expect((await caller.vinylGet({ id: vinyl.id })).tracks[0]).toMatchObject({ bpm: null, bpmSource: null });
  });

  test("an unreadable key is rejected", async () => {
    const owner = await createUser();
    const caller = callerFor({ id: owner.id });
    const vinyl = await createVinyl(owner.id, [], { tracks: twoTracks });
    const { tracks } = await caller.vinylGet({ id: vinyl.id });

    await expectTrpcError(caller.trackUpdate({ id: tracks[0]!.id, camelotKey: "14Z" }), "BAD_REQUEST");
  });

  test("nobody can edit another DJ's track", async () => {
    const owner = await createUser();
    const stranger = await createUser();
    const vinyl = await createVinyl(owner.id, [], { tracks: twoTracks });
    const { tracks } = await callerFor({ id: owner.id }).vinylGet({ id: vinyl.id });

    await expectTrpcError(callerFor({ id: stranger.id }).trackUpdate({ id: tracks[0]!.id, bpm: 100 }), "NOT_FOUND");
  });

  test("editing a record keeps track ids and the tempo measured on them", async () => {
    const owner = await createUser();
    const caller = callerFor({ id: owner.id });
    const vinyl = await createVinyl(owner.id, [], { tracks: twoTracks });
    const { tracks } = await caller.vinylGet({ id: vinyl.id });
    await caller.trackUpdate({ id: tracks[0]!.id, bpm: 128, bpmSource: "TAP" });

    await caller.vinylUpdate({
      id: vinyl.id,
      title: "Minus",
      artist: "Robert Hood",
      tracks: [{ id: tracks[0]!.id, side: "A1", position: 0, title: "Minus (Edit)", bpm: 128, bpmSource: "TAP" }],
    });

    const updated = await caller.vinylGet({ id: vinyl.id });
    expect(updated.tracks).toHaveLength(1);
    expect(updated.tracks[0]).toMatchObject({ id: tracks[0]!.id, title: "Minus (Edit)", bpm: 128, bpmSource: "TAP" });
  });

  test("the public page shows a track's tempo and key, not the DJ's cue notes", async () => {
    const owner = await createUser();
    const folder = await createFolder(owner.id);
    const vinyl = await createVinyl(owner.id, [folder.id], { tracks: twoTracks });
    const { tracks } = await callerFor({ id: owner.id }).vinylGet({ id: vinyl.id });
    await callerFor({ id: owner.id }).trackUpdate({ id: tracks[0]!.id, bpm: 128, camelotKey: "8A", cueNotes: "secret" });

    const result = await callerFor().publicVinylGet({ id: vinyl.id, folderId: folder.id });

    expect(result.tracks[0]).toMatchObject({ bpm: 128, camelotKey: "8A" });
    expect(result.tracks[0]).not.toHaveProperty("cueNotes");
  });

  test("a lookup fills empty tracks, marks them approximate and leaves measured ones alone", async () => {
    const owner = await createUser();
    const caller = callerFor({ id: owner.id });
    const vinyl = await createVinyl(owner.id, [], { artist: "Robert Hood (2)", tracks: twoTracks });
    const { tracks } = await caller.vinylGet({ id: vinyl.id });
    await caller.trackUpdate({ id: tracks[1]!.id, bpm: 131, bpmSource: "TAP" });
    stubDeezer({
      "/search": { data: [{ id: 7, title: "Minus", artist: { name: "Robert Hood" } }] },
      "/track/7": { bpm: 134.26 },
    });

    const result = await caller.vinylLookupBpm({ id: vinyl.id });

    expect(result).toEqual({ searched: 1, found: 1, unavailable: false });
    const updated = await caller.vinylGet({ id: vinyl.id });
    expect(updated.tracks[0]).toMatchObject({ bpm: 134.3, bpmSource: "LOOKUP" });
    expect(updated.tracks[1]).toMatchObject({ bpm: 131, bpmSource: "TAP" });
  });

  test("a lookup stores nothing when the source has no tempo or names another artist", async () => {
    const owner = await createUser();
    const caller = callerFor({ id: owner.id });
    const vinyl = await createVinyl(owner.id, [], { tracks: twoTracks });
    stubDeezer({
      "/search": {
        data: [
          { id: 7, title: "Minus", artist: { name: "Robert Hood" } },
          { id: 8, title: "Plus", artist: { name: "Somebody Else" } },
        ],
      },
      "/track/7": { bpm: 0 },
      "/track/8": { bpm: 140 },
    });

    expect(await caller.vinylLookupBpm({ id: vinyl.id })).toEqual({ searched: 2, found: 0, unavailable: false });
    expect((await caller.vinylGet({ id: vinyl.id })).tracks.map((track) => track.bpm)).toEqual([null, null]);
  });

  test("a lookup stops at the first failure instead of waiting on every track", async () => {
    const owner = await createUser();
    const vinyl = await createVinyl(owner.id, [], { tracks: twoTracks });
    const offline = mock(async () => {
      throw new Error("offline");
    });
    globalThis.fetch = offline as unknown as typeof fetch;

    const result = await callerFor({ id: owner.id }).vinylLookupBpm({ id: vinyl.id });

    expect(result).toEqual({ searched: 1, found: 0, unavailable: true });
    expect(offline).toHaveBeenCalledTimes(1);
  });

  test("a tempo measured during a lookup is not overwritten", async () => {
    const owner = await createUser();
    const caller = callerFor({ id: owner.id });
    const vinyl = await createVinyl(owner.id, [], { tracks: [twoTracks[0]] });
    const { tracks } = await caller.vinylGet({ id: vinyl.id });
    globalThis.fetch = mock(async (url: string | URL | Request) => {
      if (String(url).includes("/search")) {
        await prisma.vinylTrack.update({ where: { id: tracks[0]!.id }, data: { bpm: 131, bpmSource: "TAP" } });
        return Response.json({ data: [{ id: 7, title: "Minus", artist: { name: "Robert Hood" } }] });
      }
      return Response.json({ bpm: 140 });
    }) as unknown as typeof fetch;

    const result = await caller.vinylLookupBpm({ id: vinyl.id });

    expect(result.found).toBe(0);
    expect((await caller.vinylGet({ id: vinyl.id })).tracks[0]).toMatchObject({ bpm: 131, bpmSource: "TAP" });
  });

  test("every searched track counts against the hourly limit", async () => {
    const owner = await createUser();
    const vinyl = await createVinyl(owner.id, [], { tracks: twoTracks });
    stubDeezer({ "/search": { data: [] } });

    await callerFor({ id: owner.id }).vinylLookupBpm({ id: vinyl.id });

    const row = await prisma.rateLimit.findUnique({ where: { key: `bpm-lookup:${owner.id}` } });
    expect(row?.count).toBe(2);
  });

  test("a cut cannot be chosen for a record that left the set", async () => {
    const owner = await createUser();
    const caller = callerFor({ id: owner.id });
    const folder = await createFolder(owner.id, { type: "SET" });
    const vinyl = await createVinyl(owner.id, [], { tracks: twoTracks });
    const { tracks } = await caller.vinylGet({ id: vinyl.id });

    await expectTrpcError(
      caller.folderSetTrack({ folderId: folder.id, vinylId: vinyl.id, trackId: tracks[0]!.id }),
      "NOT_FOUND",
    );
  });

  test("correcting an approximate tempo by hand stops calling it approximate", async () => {
    const owner = await createUser();
    const caller = callerFor({ id: owner.id });
    const vinyl = await createVinyl(owner.id, [], { tracks: twoTracks });
    const { tracks } = await caller.vinylGet({ id: vinyl.id });
    await caller.trackUpdate({ id: tracks[0]!.id, bpm: 128, bpmSource: "LOOKUP" });

    await caller.trackUpdate({ id: tracks[0]!.id, bpm: 129 });

    expect((await caller.vinylGet({ id: vinyl.id })).tracks[0]).toMatchObject({ bpm: 129, bpmSource: "MANUAL" });
    expect((await caller.trackStats()).approximateBpm).toBe(0);
  });

  test("a source without a tempo is not stored", async () => {
    const owner = await createUser();
    const caller = callerFor({ id: owner.id });
    const vinyl = await createVinyl(owner.id, [], { tracks: twoTracks });
    const { tracks } = await caller.vinylGet({ id: vinyl.id });

    await caller.trackUpdate({ id: tracks[0]!.id, bpmSource: "LOOKUP" });

    expect((await caller.vinylGet({ id: vinyl.id })).tracks[0]?.bpmSource).toBeNull();
  });

  test("the tracklist sent when editing is the whole truth, so a cleared duration clears", async () => {
    const owner = await createUser();
    const caller = callerFor({ id: owner.id });
    const vinyl = await createVinyl(owner.id, [], { tracks: [twoTracks[0]] });
    const { tracks } = await caller.vinylGet({ id: vinyl.id });

    await caller.vinylUpdate({
      id: vinyl.id,
      title: "Minus",
      artist: "Robert Hood",
      tracks: [{ id: tracks[0]!.id, side: "A1", position: 0, title: "Minus" }],
    });

    expect((await caller.vinylGet({ id: vinyl.id })).tracks[0]?.duration).toBeNull();
  });

  test("compilations are not looked up by artist", async () => {
    const owner = await createUser();
    const vinyl = await createVinyl(owner.id, [], { artist: "Various", tracks: twoTracks });
    stubDeezer({ "/search": { data: [{ id: 7, title: "Minus", artist: { name: "Various" } }] }, "/track/7": { bpm: 128 } });

    expect(await callerFor({ id: owner.id }).vinylLookupBpm({ id: vinyl.id })).toEqual({
      searched: 2,
      found: 0,
      unavailable: false,
    });
  });

  test("the mix finder searches the DJ's own records on the chosen fader", async () => {
    const owner = await createUser();
    const stranger = await createUser();
    const caller = callerFor({ id: owner.id });
    const source = await createVinyl(owner.id, [], { tracks: [twoTracks[0]] });
    const near = await createVinyl(owner.id, [], { title: "Near", tracks: [twoTracks[0]] });
    const far = await createVinyl(owner.id, [], { title: "Far", tracks: [twoTracks[0]] });
    const foreign = await createVinyl(stranger.id, [], { title: "Foreign", tracks: [twoTracks[0]] });

    const set = async (vinylId: string, userId: string, bpm: number) => {
      const { tracks } = await callerFor({ id: userId }).vinylGet({ id: vinylId });
      await callerFor({ id: userId }).trackUpdate({ id: tracks[0]!.id, bpm, camelotKey: "8A" });
      return tracks[0]!.id;
    };
    const sourceTrack = await set(source.id, owner.id, 128);
    await set(near.id, owner.id, 130);
    await set(far.id, owner.id, 150);
    await set(foreign.id, stranger.id, 128);

    const narrow = await caller.trackMixCandidates({ trackId: sourceTrack, pitchRange: 8 });
    const wide = await caller.trackMixCandidates({ trackId: sourceTrack, pitchRange: 16 });

    expect(narrow.mixes.map((mix) => mix.track.vinyl.title)).toEqual(["Near"]);
    expect(wide.mixes.map((mix) => mix.track.vinyl.title)).toEqual(["Near", "Far"]);
  });

  test("the set flow follows the folder order and the cut chosen for each record", async () => {
    const owner = await createUser();
    const caller = callerFor({ id: owner.id });
    const folder = await createFolder(owner.id, { type: "SET" });
    const first = await createVinyl(owner.id, [folder.id], { tracks: twoTracks });
    const second = await createVinyl(owner.id, [folder.id], { title: "Second", tracks: twoTracks });
    const firstTracks = (await caller.vinylGet({ id: first.id })).tracks;
    const secondTracks = (await caller.vinylGet({ id: second.id })).tracks;
    await caller.trackUpdate({ id: firstTracks[0]!.id, bpm: 124, camelotKey: "8A" });
    await caller.trackUpdate({ id: secondTracks[0]!.id, bpm: 150 });
    await caller.trackUpdate({ id: secondTracks[1]!.id, bpm: 126, camelotKey: "9A" });

    const before = await caller.folderSetFlow({ folderId: folder.id });
    expect(before.transitions[0]?.reachable).toBe(false);

    await caller.folderSetTrack({ folderId: folder.id, vinylId: second.id, trackId: secondTracks[1]!.id });

    const after = await caller.folderSetFlow({ folderId: folder.id });
    expect(after.rows.map((row) => row.id)).toEqual([first.id, second.id]);
    expect(after.transitions[0]).toMatchObject({ reachable: true, relation: "adjacent" });
    expect(after.totalSeconds).toBe(6 * 60 + 30 + 5 * 60 + 10);
  });

  test("a set stays private to its members", async () => {
    const owner = await createUser();
    const stranger = await createUser();
    const folder = await createFolder(owner.id, { type: "SET", visibility: "PRIVATE" });

    await expectTrpcError(callerFor({ id: stranger.id }).folderSetFlow({ folderId: folder.id }), "NOT_FOUND");
  });

  test("marking a record as played counts it", async () => {
    const owner = await createUser();
    const vinyl = await createVinyl(owner.id);

    await callerFor({ id: owner.id }).vinylMarkPlayed({ id: vinyl.id });

    const stored = await prisma.vinyl.findUniqueOrThrow({ where: { id: vinyl.id } });
    expect(stored.playCount).toBe(1);
    expect(stored.lastPlayedAt).toBeInstanceOf(Date);
  });

  test("records carry their speed, condition and place", async () => {
    const owner = await createUser();
    const vinyl = await createVinyl(owner.id, [], {
      rpm: 45,
      mediaCondition: "VERY_GOOD_PLUS",
      sleeveCondition: "GOOD",
      location: "Caja 3",
    });

    expect(await callerFor({ id: owner.id }).vinylGet({ id: vinyl.id })).toMatchObject({
      rpm: 45,
      mediaCondition: "VERY_GOOD_PLUS",
      sleeveCondition: "GOOD",
      location: "Caja 3",
    });
  });

  test("the collection filters by tempo and key on any cut of a record", async () => {
    const owner = await createUser();
    const caller = callerFor({ id: owner.id });
    const match = await createVinyl(owner.id, [], { title: "Match", tracks: twoTracks });
    const other = await createVinyl(owner.id, [], { title: "Other", tracks: twoTracks });
    const matchTracks = (await caller.vinylGet({ id: match.id })).tracks;
    const otherTracks = (await caller.vinylGet({ id: other.id })).tracks;
    await caller.trackUpdate({ id: matchTracks[1]!.id, bpm: 126, camelotKey: "8A" });
    await caller.trackUpdate({ id: otherTracks[0]!.id, bpm: 126, camelotKey: "2B" });

    const byTempo = await caller.vinylsList({ bpmMin: 124, bpmMax: 128 });
    const byBoth = await caller.vinylsList({ bpmMin: 124, bpmMax: 128, keys: ["8A"] });

    expect(byTempo.items).toHaveLength(2);
    expect(byBoth.items.map((vinyl) => vinyl.id)).toEqual([match.id]);
  });

  test("a tempo and a key must sit on the same cut to match", async () => {
    const owner = await createUser();
    const caller = callerFor({ id: owner.id });
    const vinyl = await createVinyl(owner.id, [], { tracks: twoTracks });
    const { tracks } = await caller.vinylGet({ id: vinyl.id });
    await caller.trackUpdate({ id: tracks[0]!.id, bpm: 126 });
    await caller.trackUpdate({ id: tracks[1]!.id, bpm: 140, camelotKey: "8A" });

    expect((await caller.vinylsList({ bpmMin: 124, bpmMax: 128, keys: ["8A"] })).items).toEqual([]);
  });

  test("listings carry the tempo that the cover sticker shows", async () => {
    const owner = await createUser();
    const caller = callerFor({ id: owner.id });
    const folder = await createFolder(owner.id);
    const vinyl = await createVinyl(owner.id, [folder.id], { tracks: twoTracks });
    const { tracks } = await caller.vinylGet({ id: vinyl.id });
    await caller.trackUpdate({ id: tracks[0]!.id, bpm: 126, bpmSource: "LOOKUP", camelotKey: "8A" });

    const expected = { bpm: 126, bpmSource: "LOOKUP", camelotKey: "8A" } as const;
    expect((await caller.vinylsList({})).items[0]?.tracks).toEqual([expected]);
    expect((await caller.folderGet({ id: folder.id })).vinyls[0]?.tracks).toEqual([expected]);
    expect((await callerFor().publicFolders({})).items[0]?.vinyls[0]?.tracks).toEqual([expected]);
  });

  test("the export lists every cut of the DJ's own records", async () => {
    const owner = await createUser();
    const stranger = await createUser();
    await createVinyl(owner.id, [], { tracks: twoTracks });
    await createVinyl(stranger.id, [], { title: "Foreign", tracks: twoTracks });

    const rows = await callerFor({ id: owner.id }).collectionExport();

    expect(rows.map((row) => row.title)).toEqual(["Minus"]);
    expect(rows[0]?.tracks.map((track) => track.side)).toEqual(["A1", "B1"]);
  });

  test("the stats describe the tracks and say how much is approximate", async () => {
    const owner = await createUser();
    const caller = callerFor({ id: owner.id });
    const vinyl = await createVinyl(owner.id, [], { tracks: twoTracks });
    const { tracks } = await caller.vinylGet({ id: vinyl.id });
    await caller.trackUpdate({ id: tracks[0]!.id, bpm: 128, bpmSource: "LOOKUP", camelotKey: "8A" });

    expect(await caller.trackStats()).toMatchObject({
      totalTracks: 2,
      tracksWithBpm: 1,
      approximateBpm: 1,
      averageBpm: 128,
      bpmHistogram: [{ bucket: 125, count: 1 }],
      keys: [{ key: "8A", count: 1 }],
    });
  });
});
