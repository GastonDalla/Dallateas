"use client";

import { Button } from "@dallateas/ui/components/button";
import { Download } from "lucide-react";
import QRCode from "qrcode";

const QR_SIZE = 400;
const LABEL_HEIGHT = 50;

type QrDownloadProps = {
  /** What the QR opens. Defaults to the page it was downloaded from. */
  url?: string;
  label: string;
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function downloadQr(url: string, label: string) {
  const qr = await loadImage(await QRCode.toDataURL(url, { width: QR_SIZE, margin: 2 }));

  const canvas = document.createElement("canvas");
  canvas.width = QR_SIZE;
  canvas.height = QR_SIZE + LABEL_HEIGHT;

  const context = canvas.getContext("2d");
  if (!context) return;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(qr, 0, 0, QR_SIZE, QR_SIZE);
  context.fillStyle = "#161615";
  context.font = "bold 16px sans-serif";
  context.textAlign = "center";
  context.fillText(label, QR_SIZE / 2, QR_SIZE + 35);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `qr-${label.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.click();
    URL.revokeObjectURL(blobUrl);
  }, "image/png");
}

export function QrDownload({ url, label }: QrDownloadProps) {
  const handleDownload = () => {
    downloadQr(url ?? window.location.href, label).catch((error) => console.error("QR not generated", error));
  };

  return (
    <Button type="button" variant="outline" onClick={handleDownload} className="h-11 gap-2 px-3 text-sm md:h-9">
      <Download aria-hidden="true" />
      Descargar QR
    </Button>
  );
}
