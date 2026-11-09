"use client";

import { Button } from "@dallateas/ui/components/button";
import { Camera, X } from "lucide-react";
import type { Html5Qrcode } from "html5-qrcode";
import { useEffect, useEffectEvent, useRef, useState } from "react";

import { Modal } from "@/components/confirm-dialog";
import { useHaptic } from "@/hooks/use-haptic";

const SCANNER_ELEMENT_ID = "barcode-scanner-view";

type BarcodeScannerProps = {
  onScan: (code: string) => void;
  onClose: () => void;
};

function cameraErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("NotAllowed") || message.includes("Permission")
    ? "Sin permiso para usar la cámara. Habilitalo en el navegador y probá de nuevo"
    : "No se pudo acceder a la cámara";
}

async function stopScanner(scanner: Html5Qrcode | null) {
  try {
    if (scanner?.isScanning) await scanner.stop();
  } catch {
    // The camera is already released, for instance after the browser took it away.
  }
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const haptic = useHaptic();

  const decodedRef = useRef(false);

  // The camera keeps decoding ten times a second until it stops, so only the first read counts.
  const handleScan = useEffectEvent((code: string) => {
    if (decodedRef.current) return;
    decodedRef.current = true;
    haptic.trigger("success");
    void stopScanner(scannerRef.current);
    onScan(code);
    onClose();
  });

  useEffect(() => {
    let mounted = true;

    async function start() {
      try {
        // Loaded here because the library is large and most visits never open the camera.
        const { Html5Qrcode: Scanner } = await import("html5-qrcode");
        if (!mounted) return;

        const scanner = new Scanner(SCANNER_ELEMENT_ID);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 280, height: 150 }, aspectRatio: 1.5 },
          (code) => {
            if (mounted) handleScan(code);
          },
          () => {},
        );

        if (mounted) setScanning(true);
        else await stopScanner(scanner);
      } catch (failure) {
        if (mounted) setError(cameraErrorMessage(failure));
      }
    }

    void start();

    return () => {
      mounted = false;
      void stopScanner(scannerRef.current);
    };
  }, []);

  return (
    <Modal label="Escanear código de barras" onClose={onClose}>
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
        <h2 className="flex items-center gap-2 font-sans text-sm font-semibold">
          <Camera aria-hidden="true" className="size-4 text-link" />
          Escanear código de barras
        </h2>
        <Button type="button" variant="ghost" size="icon" className="size-11 md:size-8" onClick={onClose} aria-label="Cerrar">
          <X aria-hidden="true" />
        </Button>
      </div>

      <div className="bg-black">
        <div id={SCANNER_ELEMENT_ID} role="img" aria-label="Vista de la cámara" className="aspect-3/2 min-h-52 w-full" />
      </div>

      <p role="status" className={`px-4 py-3 text-[13px] ${error ? "text-clash" : "text-muted-foreground"}`}>
        {error ?? (scanning ? "Apuntá la cámara al código de barras del vinilo" : "Iniciando la cámara")}
      </p>
    </Modal>
  );
}

type ScannerButtonProps = {
  onScan: (code: string) => void;
  className?: string;
};

export function ScannerButton({ onScan, className }: ScannerButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Escanear código de barras"
        className={
          className ??
          "flex size-11 shrink-0 items-center justify-center rounded-md border border-input bg-card text-muted-foreground transition-colors duration-[120ms] hover:text-foreground md:size-9"
        }
      >
        <Camera aria-hidden="true" className="size-4" />
      </button>
      {open && (
        <BarcodeScanner
          onScan={(code) => {
            onScan(code);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
