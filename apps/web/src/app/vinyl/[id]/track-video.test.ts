import { describe, expect, test } from "bun:test";

import { videoForTrack, youtubeVideoId } from "./track-video";

const video = (title: string, id = "abcdefghijk") => ({ title, uri: `https://www.youtube.com/watch?v=${id}`, duration: 300 });

describe("youtubeVideoId", () => {
  test("reads both link forms", () => {
    expect(youtubeVideoId("https://www.youtube.com/watch?v=abcdefghijk")).toBe("abcdefghijk");
    expect(youtubeVideoId("https://youtu.be/abcdefghijk")).toBe("abcdefghijk");
  });

  test("gives null for anything else", () => {
    expect(youtubeVideoId("https://vimeo.com/123")).toBeNull();
  });
});

describe("videoForTrack", () => {
  test("matches a video whose title holds the track", () => {
    const videos = [video("Other"), video("Robert Hood - Museum")];
    expect(videoForTrack("Museum", 0, 3, videos)).toBe(videos[1]);
  });

  test("matches a track whose title holds the video, ignoring the artist", () => {
    const videos = [video("Robert Hood - Museum")];
    expect(videoForTrack("Museum (Original Mix)", 0, 3, videos)).toBe(videos[0]);
  });

  test("falls back to the same place when every track has a video", () => {
    const videos = [video("Uno"), video("Dos")];
    expect(videoForTrack("Otro tema", 1, 2, videos)).toBe(videos[1]);
  });

  test("finds nothing when the counts differ", () => {
    expect(videoForTrack("Otro tema", 0, 3, [video("Uno"), video("Dos")])).toBeUndefined();
  });

  test("does not match everything on a video with no name after the artist", () => {
    expect(videoForTrack("Otro tema", 0, 3, [video("Robert Hood - ")])).toBeUndefined();
  });
});
