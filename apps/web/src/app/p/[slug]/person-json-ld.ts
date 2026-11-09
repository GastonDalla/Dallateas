import { shareableImage } from "@/app/batea/seo";

type PublicPerson = {
  name: string;
  username: string;
  image: string | null;
  bio: string | null;
  location: string | null;
  websiteUrl: string | null;
  genres: string[];
  socialLinks: { url: string }[];
};

export function personJsonLd(profile: PublicPerson, pageUrl: string) {
  const image = shareableImage(profile.image);
  const sameAs = [...(profile.websiteUrl ? [profile.websiteUrl] : []), ...profile.socialLinks.map(({ url }) => url)];

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    alternateName: `@${profile.username}`,
    url: pageUrl,
    ...(image && { image }),
    ...(profile.bio && { description: profile.bio }),
    ...(profile.location && { homeLocation: { "@type": "Place", name: profile.location } }),
    ...(profile.genres.length > 0 && { knowsAbout: profile.genres }),
    ...(sameAs.length > 0 && { sameAs }),
  };
}
