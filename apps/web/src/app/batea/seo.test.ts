import { describe, expect, test } from "bun:test";

import { crateJsonLd, metaDescription, recordJsonLd, shareableImage, socialCard } from "./seo";

describe("shareableImage", () => {
  test("keeps a web address", () => {
    expect(shareableImage("https://i.discogs.com/a.jpg")).toBe("https://i.discogs.com/a.jpg");
  });

  test("drops an inline photo and a missing one", () => {
    expect(shareableImage("data:image/png;base64,AAAA")).toBeUndefined();
    expect(shareableImage(null)).toBeUndefined();
  });

  test("drops a name that only looks like an address", () => {
    expect(shareableImage("httpfoo.jpg")).toBeUndefined();
  });
});

describe("socialCard", () => {
  const page = { title: "Domingos", description: "Discos de la casa" };

  test("keeps what the layout sets, since a page's Open Graph replaces it whole", () => {
    expect(socialCard(page).openGraph).toMatchObject({ siteName: "Dallateas", locale: "es_AR", type: "website" });
  });

  test("uses the page's picture when it has one", () => {
    expect(socialCard({ ...page, image: "https://x.com/a.jpg" }).openGraph.images).toEqual(["https://x.com/a.jpg"]);
  });

  test("falls back to the app icon, so a shared link never goes without a picture", () => {
    expect(socialCard(page).openGraph.images).toEqual([
      { url: "/favicon/web-app-manifest-512x512.png", width: 512, height: 512, alt: "Dallateas" },
    ]);
  });

  test("gives covers the square card", () => {
    expect(socialCard(page).twitter).toEqual({ card: "summary", ...page });
  });
});

describe("metaDescription", () => {
  test("keeps a short text whole, on one line", () => {
    expect(metaDescription("Discos\n\nde la casa")).toBe("Discos de la casa");
  });

  test("cuts a long text at a word and says it was cut", () => {
    const text = metaDescription(`${"palabra ".repeat(40)}final`);
    expect(text.length).toBeLessThanOrEqual(160);
    expect(text.endsWith("palabra…")).toBe(true);
  });
});

describe("crateJsonLd", () => {
  const crate = {
    id: "c1",
    name: "Domingos",
    description: null,
    locked: false,
    user: { name: "Ana" },
    vinyls: [{ id: "v1", title: "Museum", artist: "Robert Hood" }],
  };

  test("lists each record with its page", () => {
    const data = crateJsonLd(crate, "https://dallateas.com");
    expect(data.url).toBe("https://dallateas.com/batea/c1");
    expect(data.mainEntity).toEqual({
      "@type": "ItemList",
      numberOfItems: 1,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          url: "https://dallateas.com/batea/c1/vinyl/v1",
          item: { "@type": "MusicAlbum", name: "Museum", byArtist: { "@type": "MusicGroup", name: "Robert Hood" } },
        },
      ],
    });
  });

  test("says nothing about the records of a locked crate", () => {
    expect(crateJsonLd({ ...crate, locked: true, vinyls: [] }, "https://dallateas.com").mainEntity).toBeUndefined();
  });
});

describe("recordJsonLd", () => {
  const record = {
    title: "Museum",
    artist: "Robert Hood",
    label: null,
    year: null,
    genre: null,
    coverUrl: null,
    tracks: [{ title: "Museum", duration: "6:12" }],
  };

  test("gives each cut its name and an ISO duration", () => {
    const data = recordJsonLd(record, "https://dallateas.com/batea/c1/vinyl/v1");
    expect(data.track).toEqual([{ "@type": "MusicRecording", name: "Museum", duration: "PT6M12S" }]);
    expect(data.numTracks).toBe(1);
  });

  test("leaves a duration out when the record has none", () => {
    const data = recordJsonLd({ ...record, tracks: [{ title: "Museum", duration: null }] }, "https://x.com");
    expect(data.track).toEqual([{ "@type": "MusicRecording", name: "Museum" }]);
  });

  test("carries label, year, genre and a web cover", () => {
    const data = recordJsonLd(
      { ...record, label: "M-Plant", year: 1994, genre: "Techno", coverUrl: "https://i.discogs.com/a.jpg" },
      "https://x.com",
    );
    expect(data).toMatchObject({
      recordLabel: { "@type": "Organization", name: "M-Plant" },
      datePublished: "1994",
      genre: "Techno",
      image: "https://i.discogs.com/a.jpg",
    });
  });
});
