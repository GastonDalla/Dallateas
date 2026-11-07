import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, type ReactNode } from "react";

import { Cover } from "@/components/dj/cover";
import { RecordSticker } from "@/components/dj/track-tempo";
import { serializeJsonLd } from "@/lib/json-ld";
import { getServerCaller } from "@/server/trpc";

import { isMissingRecord } from "../../../record-errors";
import { metaDescription, recordJsonLd, shareableImage, SITE_URL, socialCard } from "../../../seo";
import { TrackList } from "./track-list";

type Props = { params: Promise<{ id: string; vinylId: string }> };

/** Read once per request: the metadata and the page both need it. */
const loadRecord = cache(async (id: string, folderId: string) => {
  const caller = await getServerCaller();

  try {
    return await caller.publicVinylGet({ id, folderId });
  } catch (error) {
    if (isMissingRecord(error)) return null;
    throw error;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: folderId, vinylId } = await params;
  const record = await loadRecord(vinylId, folderId);

  if (!record) return { title: "Vinilo no encontrado", robots: { index: false } };

  const title = `${record.title}, ${record.artist}`;
  const description = metaDescription(
    [record.label, record.year, record.genre, `${record.tracks.length} cortes con su BPM y tonalidad`].filter(Boolean).join(" · "),
  );

  return {
    title,
    description,
    alternates: { canonical: `/batea/${folderId}/vinyl/${vinylId}` },
    ...socialCard({ title, description, type: "music.album", image: shareableImage(record.coverUrl) }),
  };
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="tabular text-sm font-medium">{children}</dd>
    </div>
  );
}

function ListenLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-link underline underline-offset-4 md:min-h-0"
    >
      {children}
      <ExternalLink aria-hidden="true" className="size-3.5" />
    </a>
  );
}

export default async function PublicVinylPage({ params }: Props) {
  const { id: folderId, vinylId } = await params;
  const record = await loadRecord(vinylId, folderId);
  if (!record) notFound();

  const search = encodeURIComponent(`${record.artist} ${record.title}`);
  const pageUrl = `${SITE_URL}/batea/${folderId}/vinyl/${vinylId}`;

  return (
    <div className="mx-auto max-w-[75rem] px-4 py-6 md:px-8 md:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(recordJsonLd(record, pageUrl)) }}
      />

      <Link
        href={`/batea/${folderId}` as Route}
        className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-100 hover:text-foreground md:min-h-0"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {record.folder.name}
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:gap-12">
        <div className="md:sticky md:top-6 md:self-start">
          <div className="relative">
            <Cover
              src={record.coverUrl}
              alt={`${record.title}, ${record.artist}`}
              sizes="(min-width: 768px) 352px, 100vw"
              priority
            />
            <RecordSticker tracks={record.tracks} bpm={record.bpm} size="md" className="absolute bottom-2 left-2" />
          </div>
        </div>

        <div className="min-w-0">
          <h1 className="font-heading text-[2.5rem] leading-none font-bold text-balance md:text-[3.5rem]">{record.title}</h1>
          <p className="mt-2 text-xl text-muted-foreground">{record.artist}</p>

          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
            {record.label && <Fact label="Sello">{record.label}</Fact>}
            {record.genre && <Fact label="Género">{record.genre}</Fact>}
            {record.year && <Fact label="Año">{record.year}</Fact>}
            {record.rpm && <Fact label="Velocidad">{record.rpm} RPM</Fact>}
          </dl>

          <div className="mt-3 flex flex-wrap gap-x-5">
            {record.discogsId && <ListenLink href={`https://www.discogs.com/release/${record.discogsId}`}>Discogs</ListenLink>}
            <ListenLink href={`https://open.spotify.com/search/${search}`}>Spotify</ListenLink>
            <ListenLink href={`https://www.youtube.com/results?search_query=${search}`}>YouTube</ListenLink>
          </div>

          {record.tracks.length > 0 && <TrackList tracks={record.tracks} discogsId={record.discogsId} />}

          {record.notes && <p className="mt-8 max-w-prose text-base whitespace-pre-wrap text-pretty">{record.notes}</p>}
        </div>
      </div>
    </div>
  );
}
