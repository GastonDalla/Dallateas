"use client";

import { Button } from "@dallateas/ui/components/button";
import { Camera, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Modal } from "@/components/confirm-dialog";

/** Longest side of a captured cover. Photos are stored inline, so they have to stay small. */
const MAX_COVER_SIZE = 400;
const JPEG_QUALITY = 0.65;

type FacingMode = "environment" | "user";

type CameraCaptureProps = {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
};

function stopStream(stream: MediaStream | null) {
  for (const track of stream?.getTracks() ?? []) track.stop();
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      try {
        const opened = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
        });
        if (cancelled) {
          stopStream(opened);
          return;
        }
        stream = opened;
        if (videoRef.current) videoRef.current.srcObject = opened;
      } catch {
        if (!cancelled) setError("No se pudo acceder a la cámara");
      }
    }

    void start();

    return () => {
      cancelled = true;
      stopStream(stream);
    };
  }, [facingMode]);

  function handleCapture() {
    const video = videoRef.current;
    if (!video) return;

    const { videoWidth, videoHeight } = video;
    const scale = Math.min(1, MAX_COVER_SIZE / Math.max(videoWidth, videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(videoWidth * scale);
    canvas.height = Math.round(videoHeight * scale);

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    onCapture(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    onClose();
  }

  return (
    <Modal label="Foto de portada" onClose={onClose}>
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
        <h2 className="flex items-center gap-2 font-sans text-sm font-semibold">
          <Camera aria-hidden="true" className="size-4 text-link" />
          Foto de portada
        </h2>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 md:size-8"
            onClick={() => setFacingMode((current) => (current === "environment" ? "user" : "environment"))}
            aria-label="Cambiar de cámara"
          >
            <RotateCcw aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-11 md:size-8" onClick={onClose} aria-label="Cerrar">
            <X aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={() => setReady(true)}
          aria-label="Vista previa de la cámara"
          className="aspect-square w-full object-cover"
        />
      </div>

      <div className="p-4">
        {error ? (
          <p role="alert" className="text-[13px] text-clash">
            {error}
          </p>
        ) : (
          <Button type="button" disabled={!ready} onClick={handleCapture} className="h-11 w-full gap-2 text-sm">
            <Camera aria-hidden="true" />
            Sacar foto
          </Button>
        )}
      </div>
    </Modal>
  );
}
