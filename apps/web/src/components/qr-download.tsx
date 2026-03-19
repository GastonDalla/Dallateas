"use client";

import { Download } from "lucide-react";
import { useCallback } from "react";
import QRCode from "qrcode";

interface QrDownloadProps {
  url: string;
  label: string;
}

export function QrDownload({ url, label }: QrDownloadProps) {
  const handleDownload = useCallback(async () => {
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
      });

      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 450;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 400, 400);

        ctx.fillStyle = "#000000";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(label, 200, 435);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = `qr-${label.replace(/\s+/g, "-").toLowerCase()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        }, "image/png");
      };
      img.src = qrDataUrl;
    } catch {
      console.error("Error generating QR code");
    }
  }, [url, label]);

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-card px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground"
    >
      <Download className="h-4 w-4" />
      Descargar QR
    </button>
  );
}
