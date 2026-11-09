import { ArrowLeft, ListMusic } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { Cover } from "@/components/dj/cover";
import { RecordSticker } from "@/components/dj/track-tempo";
import { CrateTab, StickeredCover } from "@/components/landing/crate-tile";
import { QrDownload } from "@/components/qr-download";
import { EmptyState } from "@/components/shell/empty-state";
import { tempoRange } from "@/lib/format";

import type { VisibleCrate } from "./load-crate";
import { UnlockForm } from "./unlock-form";

type CrateRecord = VisibleCrate["vinyls"][number];

function recordHref(crateId: string, recordId: string) {
  return `/batea/${crateId}/vinyl/${recordId}` as Route;
}

function recordStyles({ genre, style }: CrateRecord) {
  return [genre, style?.split(",")[0]?.trim()].filter(Boolean).join(" · ");
}

function RecordGrid({ crateId, records }: { crateId: string; records: CrateRecord[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {records.map((record, index) => (
        <li key={record.id} className="min-w-0">
          <Link href={recordHref(crateId, record.id)} className="group block">
            <StickeredCover
              record={record}
              bpm={record.bpm}
              priority={index < 4}
              sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            />
            <p className="mt-2 line-clamp-2 text-sm font-medium transition-colors duration-100 group-hover:text-link">{record.title}</p>
            <p className="truncate text-sm text-muted-foreground">{record.artist}</p>
            {recordStyles(record) && <p className="truncate text-[13px] text-muted-foreground">{recordStyles(record)}</p>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SetList({ crateId, records }: { crateId: string; records: CrateRecord[] }) {
  return (
    <>
      <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <ListMusic aria-hidden="true" className="size-4" />
        Tracklist de {records.length} {records.length === 1 ? "disco" : "discos"}
      </p>
      <ol className="divide-y divide-border">
        {records.map((record, index) => (
          <li key={record.id}>
            <Link
              href={recordHref(crateId, record.id)}
              className="group flex items-center gap-3 py-2.5 transition-colors duration-100 hover:bg-muted"
            >
              <span className="tabular w-6 shrink-0 text-right text-sm text-muted-foreground">{index + 1}</span>
              <Cover src={record.coverUrl} alt="" sizes="48px" className="w-12 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium group-hover:text-link">{record.title}</span>
                <span className="block truncate text-sm text-muted-foreground">
                  {record.artist}
                  {record.label && ` · ${record.label}`}
                </span>
              </span>
              <span className="tabular hidden shrink-0 text-[13px] text-muted-foreground sm:block">
                {[recordStyles(record), record.year].filter(Boolean).join(" · ")}
              </span>
              <RecordSticker tracks={record.tracks} bpm={record.bpm} className="shrink-0" />
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}

export default function BateaDetail({ folder }: { folder: VisibleCrate }) {
  const tempos = tempoRange(folder.vinyls.flatMap(({ tracks }) => tracks));
  const details = [
    `por ${folder.user.name}`,
    folder.locked ? "Contenido protegido" : `${folder.vinyls.length} ${folder.vinyls.length === 1 ? "vinilo" : "vinilos"}`,
    ...(tempos ? [`${tempos} BPM`] : []),
  ];

  return (
    <div className="mx-auto max-w-[75rem] px-4 py-6 md:px-8 md:py-10">
      <Link
        href="/bateas"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-100 hover:text-foreground md:min-h-0"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Explorar bateas
      </Link>

      <header className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b-4 border-foreground">
        <CrateTab color={folder.color} locked={folder.hasPassword} className="px-4 pt-2 pb-1.5">
          <h1 className="truncate font-heading text-[28px] leading-tight font-bold md:text-[2.5rem]">{folder.name}</h1>
        </CrateTab>
        {!folder.locked && (
          <div className="pb-2">
            <QrDownload label={folder.name} />
          </div>
        )}
      </header>

      <p className="tabular mt-4 text-sm text-muted-foreground">{details.join(" · ")}</p>
      {folder.description && <p className="mt-2 max-w-prose text-base text-pretty">{folder.description}</p>}

      <div className="mt-8">
        {folder.locked ? (
          <UnlockForm crateId={folder.id} />
        ) : folder.vinyls.length === 0 ? (
          <EmptyState title="Esta batea todavía no tiene vinilos" />
        ) : folder.type === "SET" ? (
          <SetList crateId={folder.id} records={folder.vinyls} />
        ) : (
          <RecordGrid crateId={folder.id} records={folder.vinyls} />
        )}
      </div>
    </div>
  );
}
