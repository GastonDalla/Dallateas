"use client";

import { Button } from "@dallateas/ui/components/button";
import { Disc3, ExternalLink, Play } from "lucide-react";
import { useState } from "react";

import { SpotifyIcon, YoutubeIcon } from "@/components/brand-icons";
import { actionClass } from "@/components/vinyl-form/field";
import type { DiscogsVideo } from "@/lib/discogs";

import { youtubeVideoId } from "./track-video";
import { VideoFrame } from "./video-frame";
import type { Vinyl } from "./types";

type RecordLinksProps = {
  vinyl: Vinyl;
  videos: DiscogsVideo[];
};

export function RecordLinks({ vinyl, videos }: RecordLinksProps) {
  const [showPreview, setShowPreview] = useState(false);
  const searchTerm = encodeURIComponent(`${vinyl.artist} ${vinyl.title}`);
  const youtubeUrl = `https://www.youtube.com/results?search_query=${searchTerm}`;

  const links = [
    ...(vinyl.discogsId
      ? [{ name: "Discogs", href: `https://www.discogs.com/release/${vinyl.discogsId}`, icon: <Disc3 aria-hidden="true" /> }]
      : []),
    { name: "Spotify", href: `https://open.spotify.com/search/${searchTerm}`, icon: <SpotifyIcon /> },
    { name: "YouTube", href: youtubeUrl, icon: <YoutubeIcon /> },
  ];

  const previewId = videos.flatMap(({ uri }) => youtubeVideoId(uri) ?? [])[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {links.map(({ name, href, icon }) => (
          <Button key={name} variant="outline" className={actionClass} render={<a href={href} target="_blank" rel="noopener noreferrer" />}>
            {icon}
            {name}
            <ExternalLink aria-hidden="true" className="text-muted-foreground" />
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          className={actionClass}
          aria-expanded={showPreview}
          onClick={() => setShowPreview((shown) => !shown)}
        >
          <Play aria-hidden="true" />
          {showPreview ? "Ocultar preview" : "Preview"}
        </Button>
      </div>

      {showPreview &&
        (previewId ? (
          <VideoFrame videoId={previewId} title={vinyl.title} />
        ) : (
          <p className="text-[13px] text-muted-foreground">
            Discogs no tiene videos de este disco.{" "}
            <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-link underline underline-offset-2">
              Buscalo en YouTube
            </a>
          </p>
        ))}
    </div>
  );
}
