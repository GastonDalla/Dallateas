import { describe, expect, test } from "bun:test";

import { isDirty, newRowId, profileFormErrors, toProfileForm, toProfileUpdate, type ProfileForm, type SavedProfile } from "./profile-form";

const blank = toProfileForm(null);

function form(overrides: Partial<ProfileForm>): ProfileForm {
  return { ...blank, ...overrides };
}

const saved = {
  slug: "dj-chicho",
  bio: "Techno en vinilo",
  location: null,
  genres: "Techno",
  isPublic: true,
  showViewCount: false,
  websiteUrl: null,
  socialLinks: [{ platform: "custom", url: "https://ra.co/dj", label: "RA" }],
  featuredVinylId: "vinyl1",
  featuredMixUrl: null,
  featuredMixTitle: null,
  mixes: [{ title: "Live", url: "https://soundcloud.com/dj/live" }],
  mixesLayout: "slider",
  bookingEmail: null,
  bookingPhone: null,
  bookingInfo: null,
  pressKitUrl: null,
} satisfies SavedProfile;

describe("toProfileForm", () => {
  test("starts a first profile blank, private and showing its visits", () => {
    expect(blank.slug).toBe("");
    expect(blank.isPublic).toBe(false);
    expect(blank.showViewCount).toBe(true);
    expect(blank.mixesLayout).toBe("card");
    expect(blank.socialLinks).toEqual([]);
  });

  test("turns missing values into empty fields and keeps the rest", () => {
    const loaded = toProfileForm(saved);
    expect(loaded.location).toBe("");
    expect(loaded.bio).toBe("Techno en vinilo");
    expect(loaded.mixesLayout).toBe("slider");
    expect(loaded.socialLinks[0]).toMatchObject({ platform: "custom", url: "https://ra.co/dj", label: "RA" });
  });

  test("gives every saved row its own id", () => {
    const loaded = toProfileForm({
      ...saved,
      mixes: [
        { title: "A", url: "https://a.com" },
        { title: "B", url: "https://b.com" },
      ],
    });
    expect(new Set(loaded.mixes.map((mix) => mix.id)).size).toBe(2);
  });
});

describe("toProfileUpdate", () => {
  test("sends a cleared text field as an empty string, so the server clears it", () => {
    const update = toProfileUpdate(form({ bio: "   ", location: "", genres: "" }));
    expect(update.bio).toBe("");
    expect(update.location).toBe("");
    expect(update.genres).toBe("");
  });

  test("sends empty lists, so removing the last row clears them", () => {
    const update = toProfileUpdate(form({ socialLinks: [], mixes: [] }));
    expect(update.socialLinks).toEqual([]);
    expect(update.mixes).toEqual([]);
  });

  test("omits an empty slug, the one field the API cannot clear", () => {
    expect(toProfileUpdate(form({ slug: "" })).slug).toBeUndefined();
    expect(toProfileUpdate(form({ slug: "dj-chicho" })).slug).toBe("dj-chicho");
  });

  test("clears the featured record with null", () => {
    expect(toProfileUpdate(form({ featuredVinylId: null })).featuredVinylId).toBeNull();
  });

  test("drops rows without a link and does not send the row ids", () => {
    const update = toProfileUpdate(
      form({
        socialLinks: [
          { id: "1", platform: "instagram", url: "  ", label: "" },
          { id: "2", platform: "instagram", url: "instagram.com/dj", label: "" },
        ],
        mixes: [
          { id: "3", title: "Sin link", url: "" },
          { id: "4", title: " Live ", url: " soundcloud.com/dj " },
        ],
      }),
    );
    expect(update.socialLinks).toEqual([{ platform: "instagram", url: "instagram.com/dj", label: undefined }]);
    expect(update.mixes).toEqual([{ title: "Live", url: "soundcloud.com/dj" }]);
  });

  test("keeps a label only on custom links", () => {
    const update = toProfileUpdate(
      form({
        socialLinks: [
          { id: "1", platform: "custom", url: "ra.co/dj", label: " RA " },
          { id: "2", platform: "youtube", url: "youtube.com/dj", label: "sobra" },
        ],
      }),
    );
    expect(update.socialLinks?.map((link) => link.label)).toEqual(["RA", undefined]);
  });

  test("leaves the media lists out, so the server keeps them", () => {
    const update = toProfileUpdate(blank);
    expect("youtubeVideos" in update).toBe(false);
    expect("spotifyTracks" in update).toBe(false);
  });
});

describe("profileFormErrors", () => {
  test("accepts a blank form and links typed without a scheme", () => {
    expect(profileFormErrors(blank, null)).toEqual({});
    expect(profileFormErrors(form({ websiteUrl: "dallateas.com" }), null)).toEqual({});
  });

  test("checks the slug the way the API does", () => {
    expect(profileFormErrors(form({ slug: "dj" }), null).slug).toBe("Mínimo 3 caracteres");
    expect(profileFormErrors(form({ slug: "-dj-" }), null).slug).toBe(
      "Solo letras minúsculas, números y guiones, sin guion en los extremos",
    );
  });

  test("does not let a saved slug be emptied", () => {
    expect(profileFormErrors(form({ slug: "" }), saved).slug).toBe("Se puede cambiar, pero no quitar");
    expect(profileFormErrors(form({ slug: "" }), null).slug).toBeUndefined();
  });

  test("flags links that are not http", () => {
    const errors = profileFormErrors(form({ pressKitUrl: "javascript:alert(1)", featuredMixUrl: "ftp://a.com" }), null);
    expect(errors.pressKitUrl).toBe("Ingresá un link válido (http o https)");
    expect(errors.featuredMixUrl).toBe("Ingresá un link válido (http o https)");
  });

  test("flags an invalid booking email", () => {
    expect(profileFormErrors(form({ bookingEmail: "no-es-mail" }), null).bookingEmail).toBe("Email inválido");
    expect(profileFormErrors(form({ bookingEmail: "booking@dj.com" }), null).bookingEmail).toBeUndefined();
  });

  test("points at the row that holds a bad link", () => {
    const errors = profileFormErrors(
      form({ socialLinks: [{ id: "a", platform: "website", url: "mailto:dj@dj.com", label: "" }] }),
      null,
    );
    expect(errors["social:a"]).toBe("Ingresá un link válido (http o https)");
  });

  test("asks for the link of a named mix instead of losing it", () => {
    const errors = profileFormErrors(form({ mixes: [{ id: "m", title: "Live", url: "" }] }), null);
    expect(errors["mix:m"]).toBe("Falta el link");
  });

  test("ignores rows left completely empty", () => {
    const errors = profileFormErrors(
      form({
        mixes: [{ id: "m", title: "", url: "" }],
        socialLinks: [{ id: "s", platform: "instagram", url: "", label: "" }],
      }),
      null,
    );
    expect(errors).toEqual({});
  });
});

describe("isDirty", () => {
  test("sees no change in a fresh copy of the same data", () => {
    expect(isDirty(toProfileForm(saved), toProfileForm(saved))).toBe(false);
  });

  test("sees a changed field", () => {
    expect(isDirty(form({ bio: "Nueva" }), blank)).toBe(true);
    expect(isDirty(form({ isPublic: true }), blank)).toBe(true);
    expect(isDirty(form({ mixesLayout: "slider" }), blank)).toBe(true);
  });

  test("ignores row ids", () => {
    const before = form({ mixes: [{ id: "saved-0", title: "A", url: "https://a.com" }] });
    const after = form({ mixes: [{ id: "new-1", title: "A", url: "https://a.com" }] });
    expect(isDirty(after, before)).toBe(false);
  });
});

describe("newRowId", () => {
  test("never repeats", () => {
    expect(newRowId()).not.toBe(newRowId());
  });
});
