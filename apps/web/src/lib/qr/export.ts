import type { QRStyle } from "@/types";
import { qrToSvgString } from "./svg";

export type ExportFormat = "svg" | "png";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function fileNameFor(name: string, format: ExportFormat): string {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "qdot-qr";
  return `${base}.${format}`;
}

async function svgToPngBlob(svg: string, pixelSize: number): Promise<Blob> {
  const img = new Image();
  const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not rasterize QR code"));
      img.src = svgUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = pixelSize;
    canvas.height = pixelSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(img, 0, 0, pixelSize, pixelSize);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG encoding failed"))), "image/png"),
    );
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export async function downloadQRCode(opts: {
  payload: string;
  style: QRStyle;
  name: string;
  format: ExportFormat;
  pixelSize?: number;
}): Promise<void> {
  const pixelSize = opts.pixelSize ?? 1024;
  const svg = qrToSvgString(opts.payload, opts.style, pixelSize);
  if (opts.format === "svg") {
    triggerDownload(new Blob([svg], { type: "image/svg+xml" }), fileNameFor(opts.name, "svg"));
    return;
  }
  triggerDownload(await svgToPngBlob(svg, pixelSize), fileNameFor(opts.name, "png"));
}
