"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Disc3,
  Download,
  ExternalLink,
  Eye,
  Folder,
  Globe,
  Instagram,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Music,
  Phone,
  Play,
  Send,
  Star,
  Ticket,
  Youtube,
} from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

import { trpc } from "@/utils/trpc";

const PLATFORM_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  youtube: Youtube,
  soundcloud: Music,
  mixcloud: Music,
  bandcamp: Music,
  spotify: Music,
  discogs: Disc3,
  tiktok: Music,
  twitter: MessageCircle,
  facebook: Globe,
  whatsapp: Phone,
  telegram: Send,
  website: Globe,
  custom: Link2,
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  soundcloud: "SoundCloud",
  mixcloud: "Mixcloud",
  bandcamp: "Bandcamp",
  spotify: "Spotify",
  discogs: "Discogs",
  tiktok: "TikTok",
  twitter: "X / Twitter",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  website: "Website",
  custom: "Link",
};

function extractYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

function getMixEmbed(url: string): { type: "youtube" | "soundcloud" | "mixcloud" | "spotify" | "link"; embedUrl: string | null; height?: number } {
  const ytId = extractYoutubeId(url);
  if (ytId) return { type: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}` };
  if (url.includes("soundcloud.com/")) return { type: "soundcloud", embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`, height: 180 };
  if (url.includes("mixcloud.com/")) return { type: "mixcloud", embedUrl: `https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&feed=${encodeURIComponent(url)}`, height: 180 };
  const spotifyInfo = extractSpotifyId(url);
  if (spotifyInfo) return { type: "spotify", embedUrl: `https://open.spotify.com/embed/${spotifyInfo.type}/${spotifyInfo.id}?utm_source=generator&theme=0`, height: spotifyInfo.type === "track" ? 152 : 352 };
  return { type: "link", embedUrl: null };
}

function extractSpotifyId(url: string): { type: string; id: string } | null {
  const match = url.match(/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
  if (!match) return null;
  return { type: match[1]!, id: match[2]! };
}

function Slider({ children, label }: { children: React.ReactNode[]; label: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (children.length === 0) return null;

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={() => scroll("left")}
        className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-border/60 bg-background p-1.5 shadow-md transition-opacity group-hover:flex hover:bg-muted"
        aria-label={`Anterior ${label}`}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div ref={scrollRef} className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory">
        {children.map((child, i) => (
          <div key={i} className="w-75 shrink-0 snap-start sm:w-85">
            {child}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => scroll("right")}
        className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-border/60 bg-background p-1.5 shadow-md transition-opacity group-hover:flex hover:bg-muted"
        aria-label={`Siguiente ${label}`}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function DjProfilePage({ username }: { username: string }) {
  const profileQuery = useQuery(trpc.djProfilePublic.queryOptions({ slug: username }));

  if (profileQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Disc3 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (profileQuery.error || !profileQuery.data) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <Disc3 className="h-10 w-10 text-muted-foreground/30" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Perfil no encontrado.</p>
        <Link href="/bateas" className="text-sm text-primary underline">Explorar bateas</Link>
      </div>
    );
  }

  const profile = profileQuery.data;
  const genres = profile.genres?.split(",").map((g) => g.trim()).filter(Boolean) ?? [];
  const memberSince = new Date(profile.memberSince).toLocaleDateString("es-AR", { year: "numeric", month: "long" });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-24">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: profile.name,
            alternateName: `@${profile.username}`,
            ...(profile.image && { image: profile.image }),
            ...(profile.bio && { description: profile.bio }),
            ...(profile.location && { homeLocation: { "@type": "Place", name: profile.location } }),
            ...(profile.websiteUrl && { url: profile.websiteUrl }),
            ...(genres.length > 0 && { knowsAbout: genres }),
            sameAs: profile.socialLinks.map((l) => l.url),
          }),
        }}
      />

      {/* Header */}
      <header className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/10 sm:h-24 sm:w-24">
          {profile.image ? (
            <img src={profile.image} alt={profile.name} className="h-20 w-20 rounded-full object-cover sm:h-24 sm:w-24" width={96} height={96} />
          ) : (
            <Disc3 className="h-10 w-10 text-primary" aria-hidden="true" />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <h1 className="font-heading text-2xl font-bold">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground sm:justify-start">
            {profile.location && (
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden="true" />{profile.location}</span>
            )}
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" aria-hidden="true" />Desde {memberSince}</span>
            {profile.viewCount > 0 && (
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" aria-hidden="true" />{profile.viewCount.toLocaleString()} visitas</span>
            )}
          </div>
        </div>
      </header>

      {/* Bio */}
      {profile.bio && (
        <section className="mb-6 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{profile.bio}</p>
        </section>
      )}

      {/* Social Links */}
      {(profile.socialLinks.length > 0 || profile.websiteUrl) && (
        <section className="mb-6 flex flex-wrap justify-center gap-2 sm:justify-start">
          {profile.websiteUrl && (
            <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-accent">
              <Globe className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Website
            </a>
          )}
          {profile.socialLinks.map((link, i) => {
            const Icon = PLATFORM_ICONS[link.platform] ?? Link2;
            const displayLabel = link.platform === "custom" && link.label
              ? link.label
              : PLATFORM_LABELS[link.platform] ?? link.platform;
            return (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-accent">
                <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                {displayLabel}
              </a>
            );
          })}
        </section>
      )}

      {/* Genres */}
      {genres.length > 0 && (
        <section className="mb-6 flex flex-wrap justify-center gap-2 sm:justify-start">
          {genres.map((genre) => (
            <span key={genre} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{genre}</span>
          ))}
        </section>
      )}

      {/* Featured Mix */}
      {profile.featuredMixUrl && (() => {
        const mix = getMixEmbed(profile.featuredMixUrl);
        return (
          <section className="mb-6 space-y-3">
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
              <Play className="h-5 w-5 text-primary" aria-hidden="true" />
              {profile.featuredMixTitle || "Mix destacado"}
            </h2>
            {mix.embedUrl ? (
              <div className="overflow-hidden rounded-lg border border-border/60 shadow-sm">
                <div className={mix.type === "youtube" ? "relative aspect-video" : ""}>
                  <iframe
                    src={mix.embedUrl}
                    title={profile.featuredMixTitle || "Featured mix"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    width="100%"
                    height={mix.type === "youtube" ? undefined : mix.height ?? 180}
                    className={mix.type === "youtube" ? "absolute inset-0 h-full w-full" : "border-0"}
                  />
                </div>
              </div>
            ) : (
              <a href={profile.featuredMixUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-border/60 bg-card p-4 shadow-sm transition-colors hover:bg-accent">
                <Play className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Escuchar mix</span>
                <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
              </a>
            )}
          </section>
        );
      })()}

      {/* Mixes / Sets */}
      {profile.mixes && profile.mixes.length > 0 && (() => {
        const mixItems = profile.mixes.map((mix: any, i: number) => {
          const embed = getMixEmbed(mix.url);
          return (
            <div key={i} className="overflow-hidden rounded-lg border border-border/60 shadow-sm">
              {embed.embedUrl ? (
                <div className={embed.type === "youtube" ? "relative aspect-video" : ""}>
                  <iframe
                    src={embed.embedUrl}
                    title={mix.title || `Mix ${i + 1}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    width="100%"
                    height={embed.type === "youtube" ? undefined : embed.height ?? 180}
                    className={embed.type === "youtube" ? "absolute inset-0 h-full w-full" : "border-0"}
                  />
                </div>
              ) : (
                <a href={mix.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 transition-colors hover:bg-accent">
                  <Play className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="flex-1 text-sm font-medium">{mix.title || "Escuchar"}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                </a>
              )}
              {mix.title && embed.embedUrl && <p className="px-3 py-2 text-xs font-medium">{mix.title}</p>}
            </div>
          );
        });
        return (
          <section className="mb-8 space-y-3">
            <h2 className="font-heading text-lg font-semibold">Sets & Mixes</h2>
            {profile.mixesLayout === "slider" ? (
              <Slider label="mixes">{mixItems}</Slider>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">{mixItems}</div>
            )}
          </section>
        );
      })()}

      {/* Featured Vinyl */}
      {profile.featuredVinyl && (
        <section className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold">
            <Star className="h-5 w-5 text-primary" aria-hidden="true" />
            Vinilo favorito
          </h2>
          <div className="flex items-center gap-4 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
            {profile.featuredVinyl.coverUrl ? (
              <img
                src={profile.featuredVinyl.coverUrl}
                alt={`${profile.featuredVinyl.title} — ${profile.featuredVinyl.artist}`}
                className="h-20 w-20 shrink-0 rounded-lg object-cover shadow-sm"
                width={80}
                height={80}
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Disc3 className="h-8 w-8 text-muted-foreground/30" aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold">{profile.featuredVinyl.title}</h3>
              <p className="truncate text-xs text-muted-foreground">{profile.featuredVinyl.artist}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {profile.featuredVinyl.genre && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{profile.featuredVinyl.genre}</span>
                )}
                {profile.featuredVinyl.style && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-accent-foreground">{profile.featuredVinyl.style.split(",")[0]?.trim()}</span>
                )}
                {profile.featuredVinyl.year && (
                  <span className="text-[10px] text-muted-foreground">{profile.featuredVinyl.year}</span>
                )}
                {profile.featuredVinyl.label && (
                  <span className="text-[10px] text-muted-foreground">{profile.featuredVinyl.label}</span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Gigs */}
      {profile.gigs && profile.gigs.length > 0 && (
        <section className="mb-6 space-y-3">
          <h2 className="font-heading text-lg font-semibold">Proximos eventos</h2>
          <div className="space-y-2">
            {profile.gigs.map((gig: any) => (
              <div key={gig.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <span className="text-[10px] font-bold uppercase">{new Date(gig.date).toLocaleDateString("es-AR", { month: "short" })}</span>
                  <span className="text-lg font-bold leading-none">{new Date(gig.date).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold">{gig.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[gig.venue, gig.city].filter(Boolean).join(", ")}
                    {" · "}
                    {new Date(gig.date).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {gig.ticketUrl && (
                  <a href={gig.ticketUrl} target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                    <Ticket className="h-3 w-3" aria-hidden="true" />
                    Entradas
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Booking + Press Kit */}
      {(profile.bookingEmail || profile.bookingPhone || profile.pressKitUrl) && (
        <section className="mb-6 space-y-3">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
            Contrataciones
          </h2>
          <div className="rounded-lg border border-border/60 bg-card p-4 shadow-sm space-y-3">
            {profile.bookingEmail && (
              <a href={`mailto:${profile.bookingEmail}`} className="flex items-center gap-2 text-sm transition-colors hover:text-primary">
                <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {profile.bookingEmail}
              </a>
            )}
            {profile.bookingPhone && (
              <a href={`tel:${profile.bookingPhone}`} className="flex items-center gap-2 text-sm transition-colors hover:text-primary">
                <Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {profile.bookingPhone}
              </a>
            )}
            {profile.bookingInfo && (
              <p className="text-xs text-muted-foreground">{profile.bookingInfo}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {profile.pressKitUrl && (
                <a href={profile.pressKitUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-2 text-xs font-medium shadow-sm transition-colors hover:bg-accent">
                  <Download className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  Descargar Press Kit
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Public Bateas */}
      {profile.folders.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Bateas publicas</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.folders.map((folder: any) => (
              <Link key={folder.id} href={`/batea/${folder.id}` as any} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: folder.color ? `${folder.color}20` : undefined }}>
                  <Folder className="h-5 w-5" style={{ color: folder.color ?? undefined }} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{folder.name}</p>
                  <p className="text-xs text-muted-foreground">{folder._count.vinyls} vinilos{folder.type === "SET" && " · Set"}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
