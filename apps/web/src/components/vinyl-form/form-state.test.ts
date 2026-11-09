import { describe, expect, test } from "bun:test";

import {
  emptyFormValues,
  formError,
  formValuesFromVinyl,
  mergeDiscogsTracks,
  newTrackDraft,
  toCreateInput,
  toUpdateInput,
  valuesFromRelease,
  type VinylToEdit,
} from "./form-state";

const vinyl: VinylToEdit = {
  id: "v1",
  title: "Minimal Nation",
  artist: "Robert Hood",
  label: "Axis",
  genre: "Electronic",
  style: "Techno",
  bpm: 130,
  year: 1994,
  notes: null,
  mixNotes: "Sale bien en B2",
  pricePaid: 45.5,
  discogsId: "123",
  barcode: null,
  coverUrl: "https://i.discogs.com/a.jpg",
  rpm: 33,
  mediaCondition: "VERY_GOOD_PLUS",
  sleeveCondition: null,
  location: "Estante 2",
  folders: [{ folder: { id: "f1" } }],
  tags: [{ tag: { name: "peak time" } }],
  tracks: [
    {
      id: "t1",
      side: "A1",
      position: 0,
      title: "Rhythm Of Vision",
      duration: "6:32",
      bpm: 128.25,
      bpmSource: "LOOKUP",
      camelotKey: "8A",
      energy: 4,
      cueNotes: "Entra en el break",
    },
    {
      id: "t2",
      side: "A2",
      position: 1,
      title: "Museum",
      duration: null,
      bpm: null,
      bpmSource: null,
      camelotKey: null,
      energy: null,
      cueNotes: null,
    },
  ],
};

describe("formValuesFromVinyl", () => {
  test("reads folders from the shape the API returns", () => {
    expect(formValuesFromVinyl(vinyl).folderIds).toEqual(["f1"]);
  });

  test("reads tags by name", () => {
    expect(formValuesFromVinyl(vinyl).tagNames).toEqual(["peak time"]);
  });

  test("keeps every track's identity and DJ data", () => {
    expect(formValuesFromVinyl(vinyl).tracks[0]).toMatchObject({
      id: "t1",
      bpm: "128.25",
      bpmSource: "LOOKUP",
      camelotKey: "8A",
      energy: 4,
      cueNotes: "Entra en el break",
    });
  });

  test("gives tracks a stable key from their id", () => {
    expect(formValuesFromVinyl(vinyl).tracks.map(({ key }) => key)).toEqual(["t1", "t2"]);
  });
});

describe("toUpdateInput", () => {
  test("sends back each track's id, tempo, source, key, energy and cue notes", () => {
    const { tracks } = toUpdateInput(formValuesFromVinyl(vinyl), "v1");
    expect(tracks?.[0]).toEqual({
      id: "t1",
      side: "A1",
      position: 0,
      title: "Rhythm Of Vision",
      duration: "6:32",
      bpm: 128.25,
      bpmSource: "LOOKUP",
      camelotKey: "8A",
      energy: 4,
      cueNotes: "Entra en el break",
    });
  });

  test("sends every surviving track, or the API deletes it", () => {
    expect(toUpdateInput(formValuesFromVinyl(vinyl), "v1").tracks?.map(({ id }) => id)).toEqual(["t1", "t2"]);
  });

  test("sends an empty list when the DJ removed every track, so the removal is saved", () => {
    expect(toUpdateInput({ ...formValuesFromVinyl(vinyl), tracks: [] }, "v1").tracks).toEqual([]);
  });

  test("sends an empty list when the DJ removed every tag", () => {
    expect(toUpdateInput({ ...formValuesFromVinyl(vinyl), tagNames: [] }, "v1").tagNames).toEqual([]);
  });

  test("numbers tracks by their place in the list after a removal", () => {
    const values = formValuesFromVinyl(vinyl);
    const { tracks } = toUpdateInput({ ...values, tracks: values.tracks.slice(1) }, "v1");
    expect(tracks?.[0]).toMatchObject({ id: "t2", position: 0 });
  });

  test("sends the DJ fields", () => {
    expect(toUpdateInput(formValuesFromVinyl(vinyl), "v1")).toMatchObject({
      rpm: 33,
      mediaCondition: "VERY_GOOD_PLUS",
      sleeveCondition: null,
      location: "Estante 2",
    });
  });

  test("clears a text field the DJ emptied", () => {
    const input = toUpdateInput({ ...formValuesFromVinyl(vinyl), label: " ", location: "" }, "v1");
    expect(input).toMatchObject({ label: "", location: "" });
  });

  test("clears the speed and conditions the DJ removed", () => {
    const input = toUpdateInput({ ...formValuesFromVinyl(vinyl), rpm: null, mediaCondition: null }, "v1");
    expect(input).toMatchObject({ rpm: null, mediaCondition: null });
  });

  test("sends the id of the record", () => {
    expect(toUpdateInput(formValuesFromVinyl(vinyl), "v1").id).toBe("v1");
  });
});

describe("toCreateInput", () => {
  const values = { ...emptyFormValues(), title: " Vivid ", artist: " Kerri Chandler " };

  test("trims and leaves empty fields out", () => {
    expect(toCreateInput(values)).toMatchObject({ title: "Vivid", artist: "Kerri Chandler" });
    expect(toCreateInput(values).label).toBeUndefined();
    expect(toCreateInput(values).tracks).toBeUndefined();
  });

  test("numbers a side left blank, because the API requires one", () => {
    const track = { ...newTrackDraft(), title: "Rain" };
    expect(toCreateInput({ ...values, tracks: [track] }).tracks?.[0]).toMatchObject({ side: "1", title: "Rain", position: 0 });
  });

  test("never sends an id for a new track", () => {
    const track = { ...newTrackDraft(), side: "A", title: "Rain" };
    expect(toCreateInput({ ...values, tracks: [track] }).tracks?.[0]?.id).toBeUndefined();
  });

  test("rounds the record's own tempo, which the API stores as a whole number", () => {
    expect(toCreateInput({ ...values, bpm: "124.6" }).bpm).toBe(125);
  });
});

describe("formError", () => {
  const values = { ...emptyFormValues(), title: "Vivid", artist: "Kerri Chandler" };

  test("accepts a valid form", () => {
    expect(formError(values)).toBeNull();
  });

  test("requires title and artist", () => {
    expect(formError(emptyFormValues())).toBe("Título y artista son obligatorios");
  });

  test("names the track that lacks a title", () => {
    const tracks = [{ ...newTrackDraft(), title: "Uno" }, newTrackDraft()];
    expect(formError({ ...values, tracks })).toBe("Al corte 2 le falta el título");
  });

  test("names the track with a bad tempo", () => {
    const tracks = [{ ...newTrackDraft(), title: "Uno", bpm: "9000" }];
    expect(formError({ ...values, tracks })).toBe("Corte 1: El BPM tiene que estar entre 20 y 400");
  });

  test("names the track with a bad key", () => {
    const tracks = [{ ...newTrackDraft(), title: "Uno", camelotKey: "H" }];
    expect(formError({ ...values, tracks })).toBe("Corte 1: Tonalidad inválida. Probá con 8A o Am");
  });
});

describe("valuesFromRelease", () => {
  test("splits artist and title and fills what Discogs knows", () => {
    expect(
      valuesFromRelease({
        id: 42,
        title: "Robert Hood - Minimal - Nation",
        year: 1994,
        label: ["Axis"],
        genre: ["Electronic"],
        style: ["Techno", "Minimal"],
        cover_image: "https://i.discogs.com/a.jpg",
      }),
    ).toEqual({
      artist: "Robert Hood",
      title: "Minimal - Nation",
      year: "1994",
      label: "Axis",
      genre: "Electronic",
      style: "Techno, Minimal",
      coverUrl: "https://i.discogs.com/a.jpg",
      discogsId: "42",
    });
  });

  test("keeps a title without an artist as the title", () => {
    expect(valuesFromRelease({ id: 1, title: "Vivid" })).toEqual({ title: "Vivid", discogsId: "1" });
  });
});

describe("mergeDiscogsTracks", () => {
  const current = formValuesFromVinyl(vinyl).tracks;

  test("fills an empty list from Discogs", () => {
    const merged = mergeDiscogsTracks([], [{ position: "A1", title: "Rain", duration: "5:00" }]);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ side: "A1", title: "Rain", duration: "5:00", bpm: "" });
    expect(merged[0]?.id).toBeUndefined();
  });

  test("numbers a track Discogs gives no position", () => {
    expect(mergeDiscogsTracks([], [{ position: "", title: "Rain", duration: "" }])[0]?.side).toBe("1");
  });

  test("keeps the id and DJ data of a track with the same title", () => {
    const merged = mergeDiscogsTracks(current, [{ position: "B1", title: "rhythm of vision ", duration: "6:40" }]);
    expect(merged[0]).toMatchObject({
      id: "t1",
      side: "B1",
      title: "rhythm of vision ",
      duration: "6:40",
      bpm: "128.25",
      bpmSource: "LOOKUP",
      camelotKey: "8A",
      energy: 4,
      cueNotes: "Entra en el break",
    });
  });

  test("never moves a tempo onto another track that only shares the side", () => {
    const merged = mergeDiscogsTracks(current, [{ position: "A1", title: "Otro tema", duration: "" }]);
    expect(merged[0]).toMatchObject({ title: "Otro tema", bpm: "" });
  });

  test("keeps a track Discogs does not list when it holds DJ data", () => {
    const merged = mergeDiscogsTracks(current, [{ position: "A1", title: "Otro tema", duration: "" }]);
    expect(merged.map(({ id }) => id)).toEqual([undefined, "t1"]);
  });

  test("drops an unlisted track that holds nothing of the DJ's", () => {
    const merged = mergeDiscogsTracks(current, [{ position: "A1", title: "Otro tema", duration: "" }]);
    expect(merged.some(({ id }) => id === "t2")).toBe(false);
  });

  test("gives every track a distinct key", () => {
    const merged = mergeDiscogsTracks(current, [
      { position: "A1", title: "Uno", duration: "" },
      { position: "A2", title: "Dos", duration: "" },
    ]);
    expect(new Set(merged.map(({ key }) => key)).size).toBe(merged.length);
  });
});
