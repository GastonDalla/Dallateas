export type MixEmbed = {
  type: "youtube" | "soundcloud" | "mixcloud" | "spotify" | "link";
  embedUrl: string | null;
  height?: number;
};

const YOUTUBE_ID = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const SPOTIFY_ITEM = /^\/(track|album|playlist)\/([a-zA-Z0-9]+)/;

function hostOf(url: string) {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function isOn(hostname: string, domain: string) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

/** Works out how to play a mix link on the profile. Anything unknown stays a plain link. */
export function mixEmbed(url: string): MixEmbed {
  const parsed = hostOf(url);
  if (!parsed) return { type: "link", embedUrl: null };

  const youtubeId = url.match(YOUTUBE_ID)?.[1];
  if (youtubeId) return { type: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}` };

  const link = encodeURIComponent(url);

  if (isOn(parsed.hostname, "soundcloud.com")) {
    const options = "color=%23ff5b14&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true";
    return { type: "soundcloud", embedUrl: `https://w.soundcloud.com/player/?url=${link}&${options}`, height: 180 };
  }

  if (isOn(parsed.hostname, "mixcloud.com")) {
    return { type: "mixcloud", embedUrl: `https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&feed=${link}`, height: 180 };
  }

  const spotify = parsed.hostname === "open.spotify.com" ? parsed.pathname.match(SPOTIFY_ITEM) : null;
  if (spotify) {
    const [, kind, id] = spotify;
    return {
      type: "spotify",
      embedUrl: `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator&theme=0`,
      height: kind === "track" ? 152 : 352,
    };
  }

  return { type: "link", embedUrl: null };
}
