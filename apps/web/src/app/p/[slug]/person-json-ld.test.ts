import { describe, expect, test } from "bun:test";

import { personJsonLd } from "./person-json-ld";

const profile = {
  name: "Ana",
  username: "ana",
  image: null,
  bio: null,
  location: null,
  websiteUrl: null,
  genres: [],
  socialLinks: [],
};

describe("personJsonLd", () => {
  test("leaves out what the DJ did not fill in", () => {
    expect(personJsonLd(profile, "https://dallateas.com/p/ana")).toEqual({
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Ana",
      alternateName: "@ana",
      url: "https://dallateas.com/p/ana",
    });
  });

  test("lists the website and social links as the same person", () => {
    const person = personJsonLd(
      { ...profile, websiteUrl: "https://ana.com", socialLinks: [{ url: "https://instagram.com/ana" }] },
      "https://dallateas.com/p/ana",
    );
    expect(person.sameAs).toEqual(["https://ana.com", "https://instagram.com/ana"]);
  });

  test("drops an inline photo, which is no address for a crawler", () => {
    expect(personJsonLd({ ...profile, image: "data:image/png;base64,AAAA" }, "https://x.com").image).toBeUndefined();
    expect(personJsonLd({ ...profile, image: "https://x.com/a.jpg" }, "https://x.com").image).toBe("https://x.com/a.jpg");
  });

  test("carries the bio, the city and the genres", () => {
    const person = personJsonLd(
      { ...profile, bio: "Deep house", location: "Rosario", genres: ["House"] },
      "https://x.com",
    );
    expect(person).toMatchObject({
      description: "Deep house",
      homeLocation: { "@type": "Place", name: "Rosario" },
      knowsAbout: ["House"],
    });
  });
});
