import { describe, expect, test } from "bun:test";

import { mixEmbed } from "./mix-embed";

describe("mixEmbed", () => {
  test("embeds both YouTube link forms without tracking cookies", () => {
    const embed = { type: "youtube", embedUrl: "https://www.youtube-nocookie.com/embed/abcdefghijk" } as const;
    expect(mixEmbed("https://www.youtube.com/watch?v=abcdefghijk")).toEqual(embed);
    expect(mixEmbed("https://youtu.be/abcdefghijk")).toEqual(embed);
  });

  test("embeds SoundCloud with the link encoded", () => {
    const { type, embedUrl, height } = mixEmbed("https://soundcloud.com/dj/set-1");
    expect(type).toBe("soundcloud");
    expect(embedUrl).toStartWith("https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fdj%2Fset-1");
    expect(height).toBe(180);
  });

  test("embeds Mixcloud with the link encoded", () => {
    const { type, embedUrl, height } = mixEmbed("https://www.mixcloud.com/dj/set-1/");
    expect(type).toBe("mixcloud");
    expect(embedUrl).toContain("feed=https%3A%2F%2Fwww.mixcloud.com%2Fdj%2Fset-1%2F");
    expect(height).toBe(180);
  });

  test("gives a Spotify track less room than a playlist", () => {
    expect(mixEmbed("https://open.spotify.com/track/abc123")).toMatchObject({ type: "spotify", height: 152 });
    expect(mixEmbed("https://open.spotify.com/playlist/abc123")).toMatchObject({ type: "spotify", height: 352 });
  });

  test("keeps anything else as a plain link", () => {
    expect(mixEmbed("https://example.com/my-set")).toEqual({ type: "link", embedUrl: null });
  });

  test("does not embed another site that only mentions a player in its address", () => {
    expect(mixEmbed("https://example.com/soundcloud.com/set")).toEqual({ type: "link", embedUrl: null });
  });

  test("keeps a malformed address as a plain link", () => {
    expect(mixEmbed("not a url")).toEqual({ type: "link", embedUrl: null });
  });
});
