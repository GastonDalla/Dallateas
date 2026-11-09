import type { AppRouter } from "@dallateas/api/routers/index";
import { profileSlug, safeHttpUrl } from "@dallateas/api/schemas";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { z } from "zod";

type Profile = NonNullable<inferRouterOutputs<AppRouter>["djProfileGet"]>;
type ProfileUpdate = inferRouterInputs<AppRouter>["djProfileUpdate"];

/** What the editor reads from a saved profile. */
export type SavedProfile = Pick<
  Profile,
  | "slug"
  | "bio"
  | "location"
  | "genres"
  | "isPublic"
  | "showViewCount"
  | "websiteUrl"
  | "socialLinks"
  | "featuredVinylId"
  | "featuredMixUrl"
  | "featuredMixTitle"
  | "mixes"
  | "mixesLayout"
  | "bookingEmail"
  | "bookingPhone"
  | "bookingInfo"
  | "pressKitUrl"
>;

export type Layout = "slider" | "card";
export type SocialRow = { id: string; platform: string; url: string; label: string };
export type MixRow = { id: string; title: string; url: string };

export type ProfileForm = {
  slug: string;
  bio: string;
  location: string;
  genres: string;
  websiteUrl: string;
  isPublic: boolean;
  showViewCount: boolean;
  featuredVinylId: string | null;
  socialLinks: SocialRow[];
  featuredMixTitle: string;
  featuredMixUrl: string;
  mixes: MixRow[];
  mixesLayout: Layout;
  bookingEmail: string;
  bookingPhone: string;
  bookingInfo: string;
  pressKitUrl: string;
};

/** Field names, plus `social:<row id>` and `mix:<row id>` for the rows of a list. */
export type ProfileErrors = Record<string, string>;

const INVALID_LINK = "Ingresá un link válido (http o https)";

let lastRowId = 0;

/** A key for a row added in the editor. Rows have no id of their own until they are saved. */
export function newRowId() {
  lastRowId += 1;
  return `new-${lastRowId}`;
}

export function toProfileForm(profile: SavedProfile | null): ProfileForm {
  return {
    slug: profile?.slug ?? "",
    bio: profile?.bio ?? "",
    location: profile?.location ?? "",
    genres: profile?.genres ?? "",
    websiteUrl: profile?.websiteUrl ?? "",
    isPublic: profile?.isPublic ?? false,
    showViewCount: profile?.showViewCount ?? true,
    featuredVinylId: profile?.featuredVinylId ?? null,
    socialLinks: (profile?.socialLinks ?? []).map(({ platform, url, label }, index) => ({
      id: `saved-${index}`,
      platform,
      url,
      label: label ?? "",
    })),
    featuredMixTitle: profile?.featuredMixTitle ?? "",
    featuredMixUrl: profile?.featuredMixUrl ?? "",
    mixes: (profile?.mixes ?? []).map(({ title, url }, index) => ({ id: `saved-${index}`, title, url })),
    mixesLayout: profile?.mixesLayout === "slider" ? "slider" : "card",
    bookingEmail: profile?.bookingEmail ?? "",
    bookingPhone: profile?.bookingPhone ?? "",
    bookingInfo: profile?.bookingInfo ?? "",
    pressKitUrl: profile?.pressKitUrl ?? "",
  };
}

/**
 * The API keeps whatever it does not receive, so every field goes out and a blank one goes as "" to
 * clear it. The slug is the exception: it cannot be cleared, so a blank one stays out.
 */
export function toProfileUpdate(form: ProfileForm): ProfileUpdate {
  return {
    slug: form.slug || undefined,
    bio: form.bio.trim(),
    location: form.location.trim(),
    genres: form.genres.trim(),
    websiteUrl: form.websiteUrl.trim(),
    isPublic: form.isPublic,
    showViewCount: form.showViewCount,
    featuredVinylId: form.featuredVinylId,
    socialLinks: form.socialLinks
      .filter(({ url }) => url.trim())
      .map(({ platform, url, label }) => ({
        platform,
        url: url.trim(),
        label: platform === "custom" ? label.trim() || undefined : undefined,
      })),
    featuredMixTitle: form.featuredMixTitle.trim(),
    featuredMixUrl: form.featuredMixUrl.trim(),
    mixes: form.mixes.filter(({ url }) => url.trim()).map(({ title, url }) => ({ title: title.trim(), url: url.trim() })),
    mixesLayout: form.mixesLayout,
    bookingEmail: form.bookingEmail.trim(),
    bookingPhone: form.bookingPhone.trim(),
    bookingInfo: form.bookingInfo.trim(),
    pressKitUrl: form.pressKitUrl.trim(),
  };
}

function slugError(slug: string, saved: SavedProfile | null) {
  if (!slug) return saved?.slug ? "Se puede cambiar, pero no quitar" : undefined;
  if (slug.length < 3) return "Mínimo 3 caracteres";
  return profileSlug.safeParse(slug).success
    ? undefined
    : "Solo letras minúsculas, números y guiones, sin guion en los extremos";
}

function linkError(url: string) {
  return url.trim() && !safeHttpUrl(url) ? INVALID_LINK : undefined;
}

/** Catches what the API would reject, so the message lands on the field instead of in a toast. */
export function profileFormErrors(form: ProfileForm, saved: SavedProfile | null): ProfileErrors {
  const checks: [string, string | undefined][] = [
    ["slug", slugError(form.slug, saved)],
    ["websiteUrl", linkError(form.websiteUrl)],
    ["featuredMixUrl", linkError(form.featuredMixUrl)],
    ["pressKitUrl", linkError(form.pressKitUrl)],
    [
      "bookingEmail",
      form.bookingEmail.trim() && !z.email().safeParse(form.bookingEmail.trim()).success ? "Email inválido" : undefined,
    ],
    ...form.socialLinks.map(({ id, url }): [string, string | undefined] => [`social:${id}`, linkError(url)]),
    ...form.mixes.map(({ id, title, url }): [string, string | undefined] => [
      `mix:${id}`,
      title.trim() && !url.trim() ? "Falta el link" : linkError(url),
    ]),
  ];

  return Object.fromEntries(checks.filter((check): check is [string, string] => check[1] !== undefined));
}

function withoutRowIds(form: ProfileForm) {
  return {
    ...form,
    socialLinks: form.socialLinks.map(({ platform, url, label }) => ({ platform, url, label })),
    mixes: form.mixes.map(({ title, url }) => ({ title, url })),
  };
}

export function isDirty(form: ProfileForm, baseline: ProfileForm) {
  return JSON.stringify(withoutRowIds(form)) !== JSON.stringify(withoutRowIds(baseline));
}
