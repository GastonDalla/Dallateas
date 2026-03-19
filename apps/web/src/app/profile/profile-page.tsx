"use client";

import { Button } from "@dallateas/ui/components/button";
import { Input } from "@dallateas/ui/components/input";
import { Label } from "@dallateas/ui/components/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Check,
  Copy,
  Disc3,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  Instagram,
  LayoutGrid,
  Loader2,
  Mail,
  MapPin,
  Music,
  Phone,
  Play,
  Plus,
  SlidersHorizontal,
  Trash2,
  X,
  Youtube,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { CustomSelect } from "@/components/custom-select";
import { VinylPicker } from "@/components/vinyl-picker";
import { useDebounce } from "@/hooks/use-debounce";
import { useHaptic } from "@/hooks/use-haptic";
import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";

const SOCIAL_PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "soundcloud", label: "SoundCloud" },
  { value: "mixcloud", label: "Mixcloud" },
  { value: "bandcamp", label: "Bandcamp" },
  { value: "spotify", label: "Spotify" },
  { value: "discogs", label: "Discogs" },
  { value: "tiktok", label: "TikTok" },
  { value: "twitter", label: "X / Twitter" },
  { value: "facebook", label: "Facebook" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telegram", label: "Telegram" },
  { value: "website", label: "Website" },
  { value: "custom", label: "Personalizado" },
];

function extractYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

function LayoutToggle({ value, onChange }: { value: "slider" | "card"; onChange: (v: "slider" | "card") => void }) {
  return (
    <div className="flex rounded-md border border-border/60 p-0.5">
      <button type="button" onClick={() => onChange("card")} className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors ${value === "card" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`} aria-label="Cards">
        <LayoutGrid className="h-3 w-3" /> Cards
      </button>
      <button type="button" onClick={() => onChange("slider")} className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors ${value === "slider" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`} aria-label="Slider">
        <SlidersHorizontal className="h-3 w-3" /> Slider
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const haptic = useHaptic();
  const { data: session } = authClient.useSession();

  const vinylsQuery = useQuery(trpc.vinylsList.queryOptions({}));
  const profileQuery = useQuery(trpc.djProfileGet.queryOptions());

  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [profileGenres, setProfileGenres] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [showViewCount, setShowViewCount] = useState(true);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string; label?: string }[]>([]);
  const [youtubeVideos, setYoutubeVideos] = useState<string[]>([]);
  const [youtubeLayout, setYoutubeLayout] = useState<"slider" | "card">("card");
  const [spotifyTracks, setSpotifyTracks] = useState<string[]>([]);
  const [spotifyLayout, setSpotifyLayout] = useState<"slider" | "card">("card");
  const [featuredVinylId, setFeaturedVinylId] = useState<string | null>(null);
  const [featuredMixUrl, setFeaturedMixUrl] = useState("");
  const [featuredMixTitle, setFeaturedMixTitle] = useState("");
  const [mixes, setMixes] = useState<{ title: string; url: string }[]>([]);
  const [mixesLayout, setMixesLayout] = useState<"slider" | "card">("card");
  const [bookingEmail, setBookingEmail] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingInfo, setBookingInfo] = useState("");
  const [pressKitUrl, setPressKitUrl] = useState("");
  const [showGigForm, setShowGigForm] = useState(false);
  const [gigName, setGigName] = useState("");
  const [gigVenue, setGigVenue] = useState("");
  const [gigCity, setGigCity] = useState("");
  const [gigDate, setGigDate] = useState("");
  const [gigTicketUrl, setGigTicketUrl] = useState("");

  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoError, setNewVideoError] = useState("");
  const [newSpotifyUrl, setNewSpotifyUrl] = useState("");
  const [newSpotifyError, setNewSpotifyError] = useState("");
  const [initialized, setInitialized] = useState(false);
  const initialRef = useRef<Record<string, any>>({});

  const hasChanges = initialized && (
    slug !== (initialRef.current.slug ?? "") ||
    bio !== (initialRef.current.bio ?? "") ||
    location !== (initialRef.current.location ?? "") ||
    profileGenres !== (initialRef.current.genres ?? "") ||
    isPublic !== (initialRef.current.isPublic ?? false) ||
    showViewCount !== (initialRef.current.showViewCount ?? true) ||
    websiteUrl !== (initialRef.current.websiteUrl ?? "") ||
    featuredVinylId !== (initialRef.current.featuredVinylId ?? null) ||
    featuredMixUrl !== (initialRef.current.featuredMixUrl ?? "") ||
    featuredMixTitle !== (initialRef.current.featuredMixTitle ?? "") ||
    mixesLayout !== (initialRef.current.mixesLayout ?? "card") ||
    bookingEmail !== (initialRef.current.bookingEmail ?? "") ||
    bookingPhone !== (initialRef.current.bookingPhone ?? "") ||
    bookingInfo !== (initialRef.current.bookingInfo ?? "") ||
    pressKitUrl !== (initialRef.current.pressKitUrl ?? "") ||
    JSON.stringify(mixes) !== JSON.stringify(initialRef.current.mixes ?? []) ||
    JSON.stringify(socialLinks) !== JSON.stringify(initialRef.current.socialLinks ?? [])
  );

  const youtubeRef = useRef(youtubeVideos);
  youtubeRef.current = youtubeVideos;
  const spotifyRef = useRef(spotifyTracks);
  spotifyRef.current = spotifyTracks;
  const socialRef = useRef(socialLinks);
  socialRef.current = socialLinks;
  const mixesRef = useRef(mixes);
  mixesRef.current = mixes;

  const debouncedSlug = useDebounce(slug, 500);
  const slugCheck = useQuery({
    ...trpc.djProfileCheckSlug.queryOptions({ slug: debouncedSlug }),
    enabled: debouncedSlug.length >= 3 && /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(debouncedSlug),
  });

  useEffect(() => {
    if (profileQuery.data && !initialized) {
      const p = profileQuery.data;
      setSlug(p.slug ?? "");
      setBio(p.bio ?? "");
      setLocation(p.location ?? "");
      setProfileGenres(p.genres ?? "");
      setIsPublic(p.isPublic);
      setShowViewCount(p.showViewCount ?? true);
      setWebsiteUrl(p.websiteUrl ?? "");
      setSocialLinks(p.socialLinks ?? []);
      setYoutubeVideos(p.youtubeVideos ?? []);
      setYoutubeLayout((p.youtubeLayout as "slider" | "card") ?? "card");
      setSpotifyTracks(p.spotifyTracks ?? []);
      setSpotifyLayout((p.spotifyLayout as "slider" | "card") ?? "card");
      setFeaturedVinylId(p.featuredVinylId ?? null);
      setFeaturedMixUrl(p.featuredMixUrl ?? "");
      setFeaturedMixTitle(p.featuredMixTitle ?? "");
      setMixes(p.mixes ?? []);
      setMixesLayout((p.mixesLayout as "slider" | "card") ?? "card");
      setBookingEmail(p.bookingEmail ?? "");
      setBookingPhone(p.bookingPhone ?? "");
      setBookingInfo(p.bookingInfo ?? "");
      setPressKitUrl(p.pressKitUrl ?? "");
      setInitialized(true);
      initialRef.current = {
        slug: p.slug ?? "", bio: p.bio ?? "", location: p.location ?? "",
        genres: p.genres ?? "", isPublic: p.isPublic, showViewCount: p.showViewCount ?? true,
        websiteUrl: p.websiteUrl ?? "", featuredVinylId: p.featuredVinylId ?? null,
        featuredMixUrl: p.featuredMixUrl ?? "", featuredMixTitle: p.featuredMixTitle ?? "",
        mixes: p.mixes ?? [], mixesLayout: (p.mixesLayout as "slider" | "card") ?? "card",
        socialLinks: p.socialLinks ?? [],
        bookingEmail: p.bookingEmail ?? "", bookingPhone: p.bookingPhone ?? "",
        bookingInfo: p.bookingInfo ?? "", pressKitUrl: p.pressKitUrl ?? "",
      };
    }
    if (profileQuery.data === null && !initialized) setInitialized(true);
  }, [profileQuery.data, initialized]);

  const profileMutation = useMutation({
    ...trpc.djProfileUpdate.mutationOptions(),
    onSuccess: () => {
      haptic.trigger("success");
      queryClient.invalidateQueries({ queryKey: trpc.djProfileGet.queryOptions().queryKey });
      initialRef.current = {
        slug, bio, location, genres: profileGenres, isPublic, showViewCount,
        websiteUrl, featuredVinylId, featuredMixUrl, featuredMixTitle,
        mixes, mixesLayout, socialLinks, bookingEmail, bookingPhone, bookingInfo, pressKitUrl,
      };
      toast.success("Perfil DJ actualizado");
    },
    onError: (err: any) => {
      haptic.trigger("error");
      const msg = err?.message || err?.data?.message || "Error al guardar perfil";
      toast.error(msg);
      console.error("Profile save error:", err);
    },
  });

  const gigCreate = useMutation({
    ...trpc.djGigCreate.mutationOptions(),
    onSuccess: () => {
      haptic.trigger("success");
      queryClient.invalidateQueries({ queryKey: trpc.djProfileGet.queryOptions().queryKey });
      setShowGigForm(false);
      setGigName(""); setGigVenue(""); setGigCity(""); setGigDate(""); setGigTicketUrl("");
      toast.success("Evento agregado");
    },
    onError: (err) => toast.error(err.message),
  });

  const gigDelete = useMutation({
    ...trpc.djGigDelete.mutationOptions(),
    onSuccess: () => {
      haptic.trigger("success");
      queryClient.invalidateQueries({ queryKey: trpc.djProfileGet.queryOptions().queryKey });
      toast.success("Evento eliminado");
    },
  });

  function handleSave() {
    const validSocialLinks = socialRef.current.filter((l) => l.url?.trim());
    const validYoutubeVideos = youtubeRef.current.filter(Boolean);
    const validSpotifyTracks = spotifyRef.current.filter(Boolean);
    const validMixes = mixesRef.current.filter((m) => m.url?.trim());

    profileMutation.mutate({
      slug: slug || undefined,
      bio: bio || undefined,
      location: location || undefined,
      genres: profileGenres || undefined,
      isPublic,
      showViewCount,
      socialLinks: validSocialLinks.map((l) => ({ platform: l.platform, url: l.url, label: l.label })),
      youtubeVideos: [...validYoutubeVideos],
      youtubeLayout,
      spotifyTracks: [...validSpotifyTracks],
      spotifyLayout,
      featuredVinylId,
      featuredMixUrl: featuredMixUrl || "",
      featuredMixTitle: featuredMixTitle || "",
      mixes: validMixes.map((m) => ({ title: m.title, url: m.url })),
      mixesLayout,
      bookingEmail: bookingEmail || "",
      bookingPhone: bookingPhone || "",
      bookingInfo: bookingInfo || "",
      pressKitUrl: pressKitUrl || "",
      websiteUrl: websiteUrl || "",
    });
  }

  function validateYoutubeUrl(url: string): string | null {
    if (!url.trim()) return null;
    if (!url.startsWith("http")) return "La URL debe empezar con https://";
    if (!url.includes("youtube.com/") && !url.includes("youtu.be/")) return "Debe ser un link de YouTube valido";
    return null;
  }

  function validateSpotifyUrl(url: string): string | null {
    if (!url.trim()) return null;
    if (!url.startsWith("http")) return "La URL debe empezar con https://";
    if (!url.includes("open.spotify.com/")) return "Debe ser un link de Spotify valido (open.spotify.com)";
    return null;
  }

  const profileKey = trpc.djProfileGet.queryOptions().queryKey;

  const addMedia = useMutation({
    ...trpc.djProfileAddMedia.mutationOptions(),
    onSuccess: (data, variables) => {
      haptic.trigger("success");
      if (variables.type === "youtube") setYoutubeVideos(data);
      else setSpotifyTracks(data);
      queryClient.invalidateQueries({ queryKey: profileKey });
    },
    onError: (err: any) => { haptic.trigger("error"); toast.error(err.message); },
  });

  const removeMedia = useMutation({
    ...trpc.djProfileRemoveMedia.mutationOptions(),
    onSuccess: (data, variables) => {
      haptic.trigger("success");
      if (variables.type === "youtube") setYoutubeVideos(data);
      else setSpotifyTracks(data);
      queryClient.invalidateQueries({ queryKey: profileKey });
    },
  });

  function addYoutubeVideo() {
    let url = newVideoUrl.trim();
    if (!url || youtubeVideos.length >= 10) return;
    if (!url.startsWith("http")) url = "https://" + url;
    if (!url.includes("youtube.com/") && !url.includes("youtu.be/")) {
      setNewVideoError("Debe ser un link de YouTube valido (youtube.com o youtu.be)");
      return;
    }
    setNewVideoError("");
    addMedia.mutate({ type: "youtube", url });
    setNewVideoUrl("");
  }

  function addSpotifyTrack() {
    let url = newSpotifyUrl.trim();
    if (!url || spotifyTracks.length >= 10) return;
    if (!url.startsWith("http")) url = "https://" + url;
    if (!url.includes("open.spotify.com/")) {
      setNewSpotifyError("Debe ser un link de Spotify valido (open.spotify.com)");
      return;
    }
    setNewSpotifyError("");
    addMedia.mutate({ type: "spotify", url });
    setNewSpotifyUrl("");
  }

  if (!session) {
    return <div className="flex items-center justify-center py-20"><Disc3 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const vinylsData = (vinylsQuery.data as any)?.items ?? vinylsQuery.data ?? [];
  const profileUrl = slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/p/${slug}`
    : session.user.username
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/p/${session.user.username}`
      : null;

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Perfil DJ</h1>
        <button
          type="button"
          onClick={() => setIsPublic(!isPublic)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            isPublic ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
          }`}
        >
          {isPublic ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          {isPublic ? "Publico" : "Privado"}
        </button>
      </div>

      {}
      <section className="space-y-3 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Label htmlFor="dj-slug">URL personalizada</Label>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-primary">Requerido</span>
        </div>
        <div className="flex items-center gap-0 rounded-md border border-border/60 bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <span className="shrink-0 border-r border-border/40 bg-muted/50 px-2.5 py-2 text-xs text-muted-foreground">/p/</span>
          <input
            id="dj-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            placeholder="tu-nombre-dj"
            maxLength={50}
            className="flex-1 bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          {debouncedSlug.length >= 3 && slugCheck.data && (
            <span className="shrink-0 pr-2.5">
              {slugCheck.data.available ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-destructive" />}
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">Min 3 caracteres. Solo letras, numeros y guiones.</p>

        {isPublic && profileUrl && (
          <div className="flex items-center gap-2 rounded-md bg-primary/5 px-3 py-2 text-xs">
            <Globe className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span className="flex-1 truncate text-muted-foreground">{profileUrl}</span>
            <button type="button" onClick={() => { navigator.clipboard.writeText(profileUrl); haptic.trigger("success"); toast.success("Link copiado"); }} className="shrink-0 text-primary hover:text-primary/80" aria-label="Copiar link">
              <Copy className="h-3.5 w-3.5" />
            </button>
            <Link href={profileUrl as any} className="shrink-0 text-primary hover:text-primary/80" target="_blank" aria-label="Ver perfil">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {profileQuery.data?.viewCount != null && profileQuery.data.viewCount > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{profileQuery.data.viewCount} visitas al perfil</span>
            <button
              type="button"
              onClick={() => setShowViewCount(!showViewCount)}
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                showViewCount ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}
            >
              {showViewCount ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              {showViewCount ? "Visible" : "Oculto"}
            </button>
          </div>
        )}
      </section>

      {}
      <section className="space-y-3 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="dj-bio">Bio</Label>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-primary">Requerido</span>
          </div>
          <textarea
            id="dj-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Contale al mundo sobre vos como DJ..."
            maxLength={1000}
            rows={3}
            className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 resize-none"
          />
          <p className="text-right text-[10px] text-muted-foreground">{bio.length}/1000</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="dj-location">Ubicacion</Label>
            <span className="text-[9px] text-muted-foreground">Opcional</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <Input id="dj-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Buenos Aires, Argentina" maxLength={200} />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="dj-genres">Generos que mezclas</Label>
            <span className="text-[9px] text-muted-foreground">Opcional</span>
          </div>
          <Input id="dj-genres" value={profileGenres} onChange={(e) => setProfileGenres(e.target.value)} placeholder="Techno, House, Minimal, Acid..." maxLength={500} />
          <p className="text-[10px] text-muted-foreground">Separados por coma</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="dj-website">Sitio web</Label>
            <span className="text-[9px] text-muted-foreground">Opcional</span>
          </div>
          <Input id="dj-website" type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." maxLength={500} />
        </div>
      </section>

      {}
      <section className="space-y-3 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Label>Vinilo favorito</Label>
          <span className="text-[9px] text-muted-foreground">Opcional</span>
        </div>
        <p className="text-[10px] text-muted-foreground">Destaca un vinilo de tu coleccion en tu perfil</p>
        <VinylPicker vinyls={vinylsData} value={featuredVinylId} onChange={setFeaturedVinylId} />
      </section>

      {}
      <section className="space-y-3 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label>Redes sociales y links</Label>
            <span className="text-[9px] text-muted-foreground">Opcional</span>
          </div>
          {socialLinks.length < 15 && (
            <button type="button" onClick={() => setSocialLinks([...socialLinks, { platform: "instagram", url: "" }])} className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Plus className="h-3 w-3" /> Agregar
            </button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">Usa "Personalizado" para links como Resident Advisor, Beatport, tu booking, etc.</p>
        {socialLinks.map((link, i) => (
          <div key={i} className="space-y-1.5 rounded-md border border-border/40 bg-muted/20 p-2.5">
            <div className="flex items-center gap-2">
              <CustomSelect
                value={link.platform}
                onChange={(v) => { const u = [...socialLinks]; u[i] = { ...u[i]!, platform: v, label: v === "custom" ? (u[i]?.label ?? "") : undefined }; setSocialLinks(u); }}
                options={SOCIAL_PLATFORMS}
                label="Plataforma"
                className="w-36"
              />
              <Input
                value={link.url}
                onChange={(e) => { const u = [...socialLinks]; u[i] = { ...u[i]!, url: e.target.value }; setSocialLinks(u); }}
                placeholder="https://..."
                className="flex-1"
              />
              <button type="button" onClick={() => setSocialLinks(socialLinks.filter((_, j) => j !== i))} className="shrink-0 text-muted-foreground hover:text-destructive" aria-label="Eliminar">
                <X className="h-4 w-4" />
              </button>
            </div>
            {link.platform === "custom" && (
              <Input
                value={link.label ?? ""}
                onChange={(e) => { const u = [...socialLinks]; u[i] = { ...u[i]!, label: e.target.value }; setSocialLinks(u); }}
                placeholder="Nombre del link (ej: Resident Advisor, Booking...)"
                className="text-xs"
              />
            )}
          </div>
        ))}
      </section>

      {}
      <section className="space-y-3 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Play className="h-4 w-4 text-primary" aria-hidden="true" />
          <Label>Mix destacado</Label>
          <span className="text-[9px] text-muted-foreground">Opcional</span>
        </div>
        <p className="text-[10px] text-muted-foreground">El mix principal que queres que escuchen primero. YouTube, SoundCloud o Mixcloud.</p>
        <Input value={featuredMixTitle} onChange={(e) => setFeaturedMixTitle(e.target.value)} placeholder="Nombre del mix (ej: Live at Club X)" maxLength={200} />
        <Input value={featuredMixUrl} onChange={(e) => setFeaturedMixUrl(e.target.value)} placeholder="https://youtube.com/watch?v=... o SoundCloud/Mixcloud link" maxLength={500} />
      </section>

      {}
      <section className="space-y-3 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-primary" aria-hidden="true" />
            <Label>Mis sets / mixes</Label>
            <span className="text-[9px] text-muted-foreground">Opcional</span>
          </div>
          <LayoutToggle value={mixesLayout} onChange={setMixesLayout} />
        </div>
        <p className="text-[10px] text-muted-foreground">YouTube, SoundCloud, Mixcloud, Spotify o cualquier link. Se embebe automaticamente si es posible.</p>
        {mixes.map((mix, i) => (
          <div key={i} className="space-y-1.5 rounded-md border border-border/40 bg-muted/20 p-2.5">
            <Input value={mix.title} onChange={(e) => { const u = [...mixes]; u[i] = { ...u[i]!, title: e.target.value }; setMixes(u); }} placeholder="Nombre del set/mix" maxLength={200} />
            <div className="flex items-center gap-2">
              <Input value={mix.url} onChange={(e) => { const u = [...mixes]; u[i] = { ...u[i]!, url: e.target.value }; setMixes(u); }} placeholder="https://youtube.com/watch?v=..." className="flex-1" maxLength={500} />
              <button type="button" onClick={() => setMixes(mixes.filter((_, j) => j !== i))} className="shrink-0 text-muted-foreground hover:text-destructive" aria-label="Eliminar">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {mixes.length < 20 && (
          <button type="button" onClick={() => setMixes([...mixes, { title: "", url: "" }])} className="flex items-center gap-1 text-xs text-primary hover:underline">
            <Plus className="h-3 w-3" /> Agregar set/mix
          </button>
        )}
      </section>

      {}
      <section className="space-y-3 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
          <Label>Contacto de booking</Label>
          <span className="text-[9px] text-muted-foreground">Opcional</span>
        </div>
        <p className="text-[10px] text-muted-foreground">Para que promotores te puedan contratar. Se muestra en tu perfil publico.</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <Input value={bookingEmail} onChange={(e) => setBookingEmail(e.target.value)} placeholder="booking@tumail.com" maxLength={200} type="email" />
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <Input value={bookingPhone} onChange={(e) => setBookingPhone(e.target.value)} placeholder="+54 11 1234-5678" maxLength={50} />
          </div>
          <Input value={bookingInfo} onChange={(e) => setBookingInfo(e.target.value)} placeholder="Info adicional (ej: Manager: Nombre, disponible fines de semana)" maxLength={500} />
        </div>
      </section>

      {}
      <section className="space-y-3 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-primary" aria-hidden="true" />
          <Label>Press Kit / EPK</Label>
          <span className="text-[9px] text-muted-foreground">Opcional</span>
        </div>
        <p className="text-[10px] text-muted-foreground">Link a tu press kit (Google Drive, Dropbox, etc). Incluye fotos, rider, bio larga.</p>
        <Input value={pressKitUrl} onChange={(e) => setPressKitUrl(e.target.value)} placeholder="https://drive.google.com/..." maxLength={500} />
      </section>

      {}
      <section className="space-y-3 rounded-lg border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" aria-hidden="true" />
            <Label>Proximos eventos</Label>
            <span className="text-[9px] text-muted-foreground">Opcional</span>
          </div>
          {!showGigForm && (
            <button type="button" onClick={() => setShowGigForm(true)} className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Plus className="h-3 w-3" /> Agregar
            </button>
          )}
        </div>

        {showGigForm && (
          <div className="space-y-2 rounded-md border border-border/40 bg-muted/20 p-3">
            <Input value={gigName} onChange={(e) => setGigName(e.target.value)} placeholder="Nombre del evento *" maxLength={200} />
            <div className="grid grid-cols-2 gap-2">
              <Input value={gigVenue} onChange={(e) => setGigVenue(e.target.value)} placeholder="Venue" maxLength={200} />
              <Input value={gigCity} onChange={(e) => setGigCity(e.target.value)} placeholder="Ciudad" maxLength={100} />
            </div>
            <Input type="datetime-local" value={gigDate} onChange={(e) => setGigDate(e.target.value)} />
            <Input value={gigTicketUrl} onChange={(e) => setGigTicketUrl(e.target.value)} placeholder="Link de entradas (opcional)" maxLength={500} />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => gigCreate.mutate({ name: gigName, venue: gigVenue || undefined, city: gigCity || undefined, date: gigDate, ticketUrl: gigTicketUrl || undefined })}
                disabled={!gigName.trim() || !gigDate || gigCreate.isPending}
              >
                {gigCreate.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Agregar evento"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowGigForm(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {profileQuery.data?.gigs && profileQuery.data.gigs.length > 0 ? (
          <div className="space-y-2">
            {profileQuery.data.gigs.map((gig: any) => (
              <div key={gig.id} className="flex items-center gap-3 rounded-md bg-muted/30 p-2.5">
                <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md bg-primary/10 text-primary">
                  <span className="text-[10px] font-bold uppercase">{new Date(gig.date).toLocaleDateString("es-AR", { month: "short" })}</span>
                  <span className="text-sm font-bold leading-none">{new Date(gig.date).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-semibold">{gig.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {[gig.venue, gig.city].filter(Boolean).join(", ")}
                  </p>
                </div>
                <button type="button" onClick={() => gigDelete.mutate({ id: gig.id })} className="shrink-0 text-muted-foreground hover:text-destructive" aria-label="Eliminar evento">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          !showGigForm && <p className="text-xs text-muted-foreground">No tenes eventos programados.</p>
        )}
      </section>

      {}
      <Button type="button" onClick={handleSave} disabled={profileMutation.isPending} className="w-full">
        {profileMutation.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
        Guardar perfil DJ
      </Button>

      {}
      {hasChanges && !profileMutation.isPending && (
        <div className="fixed inset-x-0 bottom-16 z-50 flex justify-center px-4 animate-in slide-in-from-bottom-4">
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <div className="h-2 w-2 rounded-full bg-primary-foreground animate-pulse" />
            Guardar cambios
          </button>
        </div>
      )}
    </div>
  );
}
