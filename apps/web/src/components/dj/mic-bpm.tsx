"use client";

import { Button } from "@dallateas/ui/components/button";
import { cn } from "@dallateas/ui/lib/utils";
import { detectBpm } from "@dallateas/dj/detect";
import { Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Readout } from "@/components/dj/readout";
import { formatBpm } from "@/lib/format";

const LISTEN_MS = 12_000;

type MicState =
  | { status: "idle" }
  | { status: "listening" }
  | { status: "analyzing" }
  | { status: "done"; bpm: number }
  | { status: "failed"; message: string };

type MicBpmProps = {
  /** Offers a button to keep the result, such as saving it to a track. */
  onConfirm?: (bpm: number) => void;
  confirmLabel?: string;
  className?: string;
};

function recordClip(stream: MediaStream, signal: AbortSignal) {
  return new Promise<Blob>((resolve, reject) => {
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => chunks.push(event.data);
    recorder.onerror = () => reject(new Error("recording failed"));
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }));
    recorder.start();

    const timer = setTimeout(() => recorder.stop(), LISTEN_MS);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      if (recorder.state !== "inactive") recorder.stop();
    });
  });
}

async function measureBpm(signal: AbortSignal, onAnalyzing: () => void) {
  // Voice processing is built to remove exactly the steady pulse this needs to hear.
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });

  try {
    const clip = await recordClip(stream, signal);
    onAnalyzing();
    const context = new AudioContext();
    try {
      const audio = await context.decodeAudioData(await clip.arrayBuffer());
      return detectBpm(audio.getChannelData(0), audio.sampleRate);
    } finally {
      void context.close();
    }
  } finally {
    for (const track of stream.getTracks()) track.stop();
  }
}

function failureMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Sin permiso para usar el micrófono. Habilitalo en el navegador y probá de nuevo.";
  }
  return "No se pudo grabar. Probá con el tap.";
}

/**
 * Listens to the record and estimates its tempo. Measured on real loops it is right about nine
 * times in ten and sometimes reads a false tempo, so the DJ always confirms before anything is kept.
 */
export function MicBpm({ onConfirm, confirmLabel = "Usar este BPM", className }: MicBpmProps) {
  const [state, setState] = useState<MicState>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function listen() {
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices) {
      setState({ status: "failed", message: "Este navegador no puede grabar audio. Probá con el tap." });
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setState({ status: "listening" });

    try {
      const result = await measureBpm(controller.signal, () => setState({ status: "analyzing" }));
      if (controller.signal.aborted) return;
      setState(
        result
          ? { status: "done", bpm: result.bpm }
          : { status: "failed", message: "No encontré un pulso claro. Acercá el teléfono al parlante o probá con el tap." },
      );
    } catch (error) {
      if (!controller.signal.aborted) setState({ status: "failed", message: failureMessage(error) });
    }
  }

  const busy = state.status === "listening" || state.status === "analyzing";

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex h-44 flex-col items-center justify-center gap-1 bg-card text-center" aria-live="polite">
        {state.status === "done" ? (
          <>
            <Readout value={formatBpm(state.bpm)} className="text-7xl leading-none" />
            <span className="text-sm text-muted-foreground">¿Cierra con lo que escuchás?</span>
          </>
        ) : (
          <>
            <Mic aria-hidden="true" className={cn("size-6", busy ? "text-link" : "text-muted-foreground")} />
            <span className="max-w-64 px-4 text-sm text-pretty text-muted-foreground">
              {state.status === "listening" && "Escuchando 12 segundos"}
              {state.status === "analyzing" && "Analizando"}
              {state.status === "idle" && "Poné el disco y acercá el teléfono al parlante"}
              {state.status === "failed" && state.message}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" disabled={busy} onClick={listen}>
          {state.status === "idle" ? "Escuchar" : "Escuchar de nuevo"}
        </Button>
        {state.status === "done" && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Tomar la mitad"
              onClick={() => setState({ status: "done", bpm: state.bpm / 2 })}
            >
              ÷2
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Tomar el doble"
              onClick={() => setState({ status: "done", bpm: state.bpm * 2 })}
            >
              ×2
            </Button>
            {onConfirm && (
              <Button size="sm" onClick={() => onConfirm(state.bpm)}>
                {confirmLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
