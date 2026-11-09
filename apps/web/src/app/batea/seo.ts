import { parseDuration } from "@dallateas/dj/tempo";

const DESCRIPTION_LIMIT = 160;
const WEB_ADDRESS = /^https?:\/\//;
const FALLBACK_IMAGE = { url: "/favicon/web-app-manifest-512x512.png", width: 512, height: 512, alt: "Dallateas" };

export const SITE_URL = process.env.BETTER_AUTH_URL ?? "https://dallateas.com";

/** Photos taken in the app are stored inline, and a crawler or a chat preview needs an address. */
export function shareableImage(url: string | null | undefined) {
  return url && WEB_ADDRESS.test(url) ? url : undefined;
}

type SocialCard = {
  title: string;
  description: string;
  type?: "website" | "profile" | "music.album";
  image?: string;
};

/** A page's `openGraph` replaces the layout's whole, so what they share is repeated here. */
export function socialCard({ title, description, type = "website", image }: SocialCard) {
  return {
    openGraph: { title, description, type, siteName: "Dallateas", locale: "es_AR", images: [image ?? FALLBACK_IMAGE] },
    twitter: { card: "summary" as const, title, description },
  };
}

export function metaDescription(text: string) {
  const line = text.replace(/\s+/g, " ").trim();
  if (line.length <= DESCRIPTION_LIMIT) return line;

  const cut = line.slice(0, DESCRIPTION_LIMIT - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

function isoDuration(value: string | null) {
  const seconds = parseDuration(value);
  return seconds === null ? undefined : `PT${Math.floor(seconds / 60)}M${seconds % 60}S`;
}

function artist(name: string) {
  return { "@type": "MusicGroup", name };
}

type CrateForSearch = {
  id: string;
  name: string;
  description: string | null;
  locked: boolean;
  user: { name: string };
  vinyls: { id: string; title: string; artist: string }[];
};

export function crateJsonLd(crate: CrateForSearch, siteUrl: string) {
  const url = `${siteUrl}/batea/${crate.id}`;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: crate.name,
    url,
    author: { "@type": "Person", name: crate.user.name },
    ...(crate.description && { description: crate.description }),
    ...(!crate.locked && {
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: crate.vinyls.length,
        itemListElement: crate.vinyls.map((vinyl, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${url}/vinyl/${vinyl.id}`,
          item: { "@type": "MusicAlbum", name: vinyl.title, byArtist: artist(vinyl.artist) },
        })),
      },
    }),
  };
}

type RecordForSearch = {
  title: string;
  artist: string;
  label: string | null;
  year: number | null;
  genre: string | null;
  coverUrl: string | null;
  tracks: { title: string; duration: string | null }[];
};

export function recordJsonLd(record: RecordForSearch, pageUrl: string) {
  const image = shareableImage(record.coverUrl);

  return {
    "@context": "https://schema.org",
    "@type": "MusicAlbum",
    name: record.title,
    url: pageUrl,
    byArtist: artist(record.artist),
    numTracks: record.tracks.length,
    track: record.tracks.map((track) => {
      const duration = isoDuration(track.duration);
      return { "@type": "MusicRecording", name: track.title, ...(duration && { duration }) };
    }),
    ...(record.label && { recordLabel: { "@type": "Organization", name: record.label } }),
    ...(record.year && { datePublished: String(record.year) }),
    ...(record.genre && { genre: record.genre }),
    ...(image && { image }),
  };
}
