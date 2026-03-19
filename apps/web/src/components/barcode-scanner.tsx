"use client";

import { Camera, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useHaptic } from "@/hooks/use-haptic";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<any>(null);
  const runningRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const haptic = useHaptic();

  const stopScanner = useCallback(async () => {
    const scanner = html5QrRef.current;
    const wasRunning = runningRef.current;
    runningRef.current = false;
    html5QrRef.current = null;
    if (scanner && wasRunning) {
      try {
        const state = scanner.getState?.();
        if (state === 2 || state === 3) { 
          await scanner.stop();
        }
      } catch {
      }
    }
  }, []);

  const handleScan = useCallback(
    (decodedText: string) => {
      haptic.trigger("success");
      onScan(decodedText);
      stopScanner();
      onClose();
    },
    [onScan, onClose, haptic, stopScanner],
  );

  useEffect(() => {
    let mounted = true;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!mounted || !scannerRef.current) return;

        const scannerId = "barcode-scanner-container";
        scannerRef.current.id = scannerId;

        const scanner = new Html5Qrcode(scannerId);
        html5QrRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 150 },
            aspectRatio: 1.5,
          },
          (decodedText) => {
            if (mounted) handleScan(decodedText);
          },
          () => {},
        );

        if (mounted) {
          runningRef.current = true;
          setScanning(true);
        }
      } catch (err: any) {
        if (mounted) {
          const msg = err?.message ?? "";
          setError(
            msg.includes("NotAllowed") || msg.includes("Permission")
              ? "Permiso de camara denegado. Habilitalo en la configuracion del navegador."
              : "No se pudo acceder a la camara.",
          );
        }
      }
    }

    startScanner();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [handleScan, stopScanner]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-lg bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" aria-hidden="true" />
            <h3 className="text-sm font-semibold">Escanear codigo de barras</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              stopScanner();
              onClose();
            }}
            aria-label="Cerrar escaner"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="bg-black">
          <div
            ref={scannerRef}
            role="img"
            aria-label="Vista de camara para escanear codigo de barras"
            className="aspect-3/2 w-full"
            style={{ minHeight: 200 }}
          />
        </div>

        <div className="px-4 py-3">
          {error ? (
            <p className="text-center text-xs text-red-500">{error}</p>
          ) : scanning ? (
            <p className="text-center text-xs text-muted-foreground">
              Apunta la camara al codigo de barras del vinilo
            </p>
          ) : (
            <p className="text-center text-xs text-muted-foreground">Iniciando camara...</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface ScannerButtonProps {
  onScan: (code: string) => void;
  className?: string;
}

export function ScannerButton({ onScan, className }: ScannerButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? "shrink-0 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"}
        title="Escanear codigo de barras"
        aria-label="Escanear codigo de barras"
      >
        <Camera className="h-4 w-4" aria-hidden="true" />
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
