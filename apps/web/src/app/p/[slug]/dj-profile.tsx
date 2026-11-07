import type { AppRouter } from "@dallateas/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";
import {
  Disc3,
  Download,
  ExternalLink,
  Globe,
  Link2,
  type LucideIcon,
  Mail,
  MessageCircle,
  Music,
  Phone,
  Play,
  Send,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { SITE_URL } from "@/app/batea/seo";
import { InstagramIcon, YoutubeIcon } from "@/components/brand-icons";
import { Cover } from "@/components/dj/cover";
import { ScrollRow } from "@/components/landing/scroll-row";
import { serializeJsonLd } from "@/lib/json-ld";

import { mixEmbed } from "./mix-embed";
import { personJsonLd } from "./person-json-ld";

type Profile = inferRouterOutputs<AppRouter>["djProfilePublic"];

const PLATFORMS: Record<string, { label: string; icon: typeof InstagramIcon | LucideIcon }> = {
  instagram: { label: "Instagram", icon: InstagramIcon },
  youtube: { label: "YouTube", icon: YoutubeIcon },
  soundcloud: { label: "SoundCloud", icon: Music },
  mixcloud: { label: "Mixcloud", icon: Music },
  bandcamp: { label: "Bandcamp", icon: Music },
  spotify: { label: "Spotify", icon: Music },
  discogs: { label: "Discogs", icon: Disc3 },
  tiktok: { label: "TikTok", icon: Music },
  twitter: { label: "X / Twitter", icon: MessageCircle },
  facebook: { label: "Facebook", icon: Globe },
  whatsapp: { label: "WhatsApp", icon: Phone },
  telegram: { label: "Telegram", icon: Send },
  website: { label: "Sitio web", icon: Globe },
  custom: { label: "Link", icon: Link2 },
};

const EXTERNAL = { target: "_blank", rel: "noopener noreferrer" } as const;
const TEXT_LINK = "inline-flex min-h-11 items-center gap-1.5 text-sm font-medium underline-offset-4 transition-colors duration-100 hover:text-link hover:underline md:min-h-0";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12 md:mt-16">
      <h2 className="font-heading text-[28px] leading-none font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MixPlayer({ url, title }: { url: string; title: string | null }) {
  const embed = mixEmbed(url);

  if (!embed.embedUrl) {
    return (
      <a href={url} {...EXTERNAL} className="flex min-h-14 items-center gap-3 bg-card px-4 py-3 transition-colors duration-100 hover:bg-muted">
        <Play aria-hidden="true" className="size-4 text-link" />
        <span className="flex-1 text-sm font-medium">{title || "Escuchar mix"}</span>
        <ExternalLink aria-hidden="true" className="size-3.5 text-muted-foreground" />
      </a>
    );
  }

  const video = embed.type === "youtube";

  return (
    <div>
      <div className={video ? "relative aspect-video" : undefined}>
        <iframe
          src={embed.embedUrl}
          title={title || "Mix"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
          width="100%"
          height={video ? undefined : (embed.height ?? 180)}
          className={video ? "absolute inset-0 size-full" : "border-0"}
        />
      </div>
      {title && <p className="mt-2 text-sm font-medium">{title}</p>}
    </div>
  );
}

type MediaItem = { url: string; title: string | null };

function MediaGroup({ items, layout, label }: { items: MediaItem[]; layout: Profile["mixesLayout"]; label: string }) {
  const players = items.map((item) => (
    <div key={item.url} className={layout === "slider" ? "w-75 shrink-0 snap-start pr-3 sm:w-85" : undefined}>
      <MixPlayer url={item.url} title={item.title} />
    </div>
  ));

  if (layout === "slider") return <ScrollRow label={label}>{players}</ScrollRow>;
  return <div className="grid gap-6 sm:grid-cols-2">{players}</div>;
}

function untitled(urls: string[]): MediaItem[] {
  return urls.map((url) => ({ url, title: null }));
}

function GigRow({ gig }: { gig: Profile["gigs"][number] }) {
  // Saved from a datetime field with no zone and read here on the same server, so this is the hour the DJ typed.
  const date = new Date(gig.date);
  const place = [gig.venue, gig.city].filter(Boolean).join(", ");

  return (
    <li className="flex items-center gap-4 py-3">
      <span className="w-12 shrink-0 text-center">
        <span className="tabular block font-heading text-[28px] leading-none font-bold">{date.getDate()}</span>
        <span className="block text-[13px] text-muted-foreground">{date.toLocaleDateString("es-AR", { month: "short" })}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-medium">{gig.name}</span>
        <span className="tabular block truncate text-sm text-muted-foreground">
          {[place, date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })].filter(Boolean).join(" · ")}
        </span>
      </span>
      {gig.ticketUrl && (
        <a href={gig.ticketUrl} {...EXTERNAL} className="shrink-0 text-sm font-medium text-link underline underline-offset-4">
          Entradas
        </a>
      )}
    </li>
  );
}

export default function DjProfile({ profile, slug }: { profile: Profile; slug: string }) {
  const genres = profile.genres?.split(",").map((genre) => genre.trim()).filter(Boolean) ?? [];
  const memberSince = new Date(profile.memberSince).toLocaleDateString("es-AR", { year: "numeric", month: "long" });
  const details = [
    `@${profile.username}`,
    profile.location,
    `Desde ${memberSince}`,
    ...(profile.viewCount ? [`${profile.viewCount.toLocaleString("es-AR")} visitas`] : []),
  ].filter(Boolean);
  const { featuredVinyl } = profile;
  const hasBooking = profile.bookingEmail || profile.bookingPhone || profile.pressKitUrl;

  return (
    <div className="mx-auto max-w-[60rem] px-4 py-8 md:px-8 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(personJsonLd({ ...profile, genres }, `${SITE_URL}/p/${slug}`)),
        }}
      />

      <header className="grid gap-6 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-end md:grid-cols-[16rem_minmax(0,1fr)] md:gap-8">
        <Cover src={profile.image} alt={profile.name} sizes="(min-width: 768px) 256px, (min-width: 640px) 192px, 100vw" priority />
        <div className="min-w-0">
          <h1 className="font-heading text-[3rem] leading-[0.95] font-bold text-balance md:text-[4.5rem]">{profile.name}</h1>
          <p className="tabular mt-3 text-sm text-muted-foreground">{details.join(" · ")}</p>
          {genres.length > 0 && <p className="mt-1 text-sm">{genres.join(" · ")}</p>}
        </div>
      </header>

      {profile.bio && <p className="mt-8 max-w-prose text-lg whitespace-pre-wrap text-pretty">{profile.bio}</p>}

      {(profile.socialLinks.length > 0 || profile.websiteUrl) && (
        <nav aria-label="Redes" className="mt-5 flex flex-wrap gap-x-5">
          {profile.websiteUrl && (
            <a href={profile.websiteUrl} {...EXTERNAL} className={TEXT_LINK}>
              <Globe aria-hidden="true" className="size-4 text-link" />
              Sitio web
            </a>
          )}
          {profile.socialLinks.map((link) => {
            const platform = PLATFORMS[link.platform] ?? PLATFORMS.custom!;
            const Icon = platform.icon;
            return (
              <a key={link.url} href={link.url} {...EXTERNAL} className={TEXT_LINK}>
                <Icon aria-hidden="true" className="size-4 text-link" />
                {link.platform === "custom" && link.label ? link.label : platform.label}
              </a>
            );
          })}
        </nav>
      )}

      {profile.featuredMixUrl && (
        <Section title={profile.featuredMixTitle || "Mix destacado"}>
          <MixPlayer url={profile.featuredMixUrl} title={null} />
        </Section>
      )}

      {profile.gigs.length > 0 && (
        <Section title="Próximas fechas">
          <ol className="divide-y divide-border">
            {profile.gigs.map((gig) => (
              <GigRow key={gig.id} gig={gig} />
            ))}
          </ol>
        </Section>
      )}

      {profile.mixes.length > 0 && (
        <Section title="Sets y mixes">
          <MediaGroup items={profile.mixes} layout={profile.mixesLayout} label="Sets y mixes" />
        </Section>
      )}

      {profile.youtubeVideos.length > 0 && (
        <Section title="Videos">
          <MediaGroup items={untitled(profile.youtubeVideos)} layout={profile.youtubeLayout} label="Videos" />
        </Section>
      )}

      {profile.spotifyTracks.length > 0 && (
        <Section title="En Spotify">
          <MediaGroup items={untitled(profile.spotifyTracks)} layout={profile.spotifyLayout} label="Spotify" />
        </Section>
      )}

      {featuredVinyl && (
        <Section title="Vinilo favorito">
          <div className="flex items-center gap-4">
            <Cover
              src={featuredVinyl.coverUrl}
              alt={`${featuredVinyl.title}, ${featuredVinyl.artist}`}
              sizes="96px"
              className="w-24 shrink-0"
            />
            <div className="min-w-0">
              <p className="truncate text-base font-medium">{featuredVinyl.title}</p>
              <p className="truncate text-sm text-muted-foreground">{featuredVinyl.artist}</p>
              <p className="tabular mt-1 truncate text-[13px] text-muted-foreground">
                {[featuredVinyl.genre, featuredVinyl.style?.split(",")[0]?.trim(), featuredVinyl.year, featuredVinyl.label]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>
        </Section>
      )}

      {profile.folders.length > 0 && (
        <Section title="Bateas públicas">
          <ul className="divide-y divide-border">
            {profile.folders.map((folder) => (
              <li key={folder.id}>
                <Link
                  href={`/batea/${folder.id}` as Route}
                  className="group flex min-h-14 items-center gap-3 py-3 transition-colors duration-100 hover:bg-muted"
                >
                  {folder.color && (
                    <span aria-hidden="true" style={{ backgroundColor: folder.color }} className="size-3 shrink-0 rounded-sm" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-base font-medium group-hover:text-link">{folder.name}</span>
                  <span className="tabular shrink-0 text-sm text-muted-foreground">
                    {folder._count.vinyls} {folder._count.vinyls === 1 ? "vinilo" : "vinilos"}
                    {folder.type === "SET" && " · Set"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {hasBooking && (
        <Section title="Contrataciones">
          <div className="grid gap-1 bg-card p-5">
            {profile.bookingEmail && (
              <a href={`mailto:${profile.bookingEmail}`} className={TEXT_LINK}>
                <Mail aria-hidden="true" className="size-4 text-muted-foreground" />
                {profile.bookingEmail}
              </a>
            )}
            {profile.bookingPhone && (
              <a href={`tel:${profile.bookingPhone}`} className={TEXT_LINK}>
                <Phone aria-hidden="true" className="size-4 text-muted-foreground" />
                {profile.bookingPhone}
              </a>
            )}
            {profile.bookingInfo && <p className="mt-1 max-w-prose text-sm text-muted-foreground">{profile.bookingInfo}</p>}
            {profile.pressKitUrl && (
              <a href={profile.pressKitUrl} {...EXTERNAL} className={TEXT_LINK}>
                <Download aria-hidden="true" className="size-4 text-muted-foreground" />
                Descargar press kit
              </a>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}
