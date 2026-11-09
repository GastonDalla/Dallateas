import { keyAtPitch, type CamelotKey, type KeyRelation } from "@dallateas/dj/camelot";
import { bpmAtPitch } from "@dallateas/dj/tempo";

import { formatBpm } from "@/lib/format";

/** A record invented for the landing, so the fader has something honest to move. */
export const SAMPLE_RECORD = {
  artist: "Mesa Dos",
  title: "Domingo a las 7",
  label: "Sello Ejemplo",
  catalog: "SE-001",
};

export type SampleCut = {
  position: string;
  title: string;
  duration: string;
  bpm: number;
  key: CamelotKey;
  /** A lookup rather than a measurement. */
  approximate?: boolean;
};

export const SAMPLE_SIDES: { name: string; cuts: SampleCut[] }[] = [
  {
    name: "Cara A",
    cuts: [
      { position: "A1", title: "Cinta de arranque", duration: "6:12", bpm: 122, key: "8A" },
      { position: "A2", title: "Bajo el puente", duration: "7:03", bpm: 124, key: "9A" },
    ],
  },
  {
    name: "Cara B",
    cuts: [
      { position: "B1", title: "Luz de cabina", duration: "5:48", bpm: 126, key: "10A" },
      { position: "B2", title: "Último subte", duration: "6:30", bpm: 128, key: "11A", approximate: true },
    ],
  },
];

/** A set from the same invented crate. Its last change is the one a DJ wants to see coming. */
export const SAMPLE_SET = [
  { id: "patio", title: "Patio interno", moment: "Abre", bpm: 120, key: "9A", duration: "6:02" },
  { id: "cinta", title: "Cinta de arranque", moment: "Empieza a subir", bpm: 122, key: "8A", duration: "6:12" },
  { id: "puente", title: "Bajo el puente", moment: "Mitad de la noche", bpm: 124, key: "9A", duration: "7:03" },
  { id: "luz", title: "Luz de cabina", moment: "Sigue arriba", bpm: 126, key: "10A", duration: "5:48" },
  { id: "subte", title: "Último subte", moment: "Pico", bpm: 128, key: "11A", duration: "6:30", approximate: true },
  { id: "piso", title: "Tercer piso", moment: "El que duele", bpm: 128, key: "4A", duration: "5:21" },
];

/** What a mix finder sees leaving "Bajo el puente": the printed keys mislead in both directions. */
export const SAMPLE_MIX_SOURCE = { id: "puente", title: "Bajo el puente", bpm: 124, key: "9A" };

export const SAMPLE_MIX_CANDIDATES = [
  { id: "luz", title: "Luz de cabina", bpm: 126, key: "10A" },
  { id: "patio", title: "Patio interno", bpm: 120, key: "9A" },
  { id: "piso", title: "Tercer piso", bpm: 128, key: "4A" },
];

export const RELATION_COPY: Record<KeyRelation, { label: string; tone: string }> = {
  same: { label: "Misma tonalidad", tone: "text-good" },
  adjacent: { label: "Tonalidad vecina", tone: "text-good" },
  relative: { label: "Relativa", tone: "text-good" },
  boost: { label: "Sube la energía", tone: "text-warn" },
  clash: { label: "Choca", tone: "text-clash" },
};

/** A cut as it sounds on a turntable: the fader moves its tempo and, past half a semitone, its key. */
export function cutAtPitch(cut: Pick<SampleCut, "bpm" | "key">, pitch: number) {
  const key = keyAtPitch(cut.key, pitch);
  return {
    tempo: formatBpm(Math.round(bpmAtPitch(cut.bpm, pitch) * 10) / 10),
    key,
    keyMoved: key !== cut.key,
  };
}
