import type { QRDesign } from "@/types";
import { buildQRGeometry } from "./render/geometry";
import { geometryToSvg } from "./render/svg";

export type ExportFormat = "svg" | "png" | "pdf";

export interface ExportOptions {
  payload: string;
  design: QRDesign;
  name: string;
  format: ExportFormat;
  /** PNG/SVG edge in pixels. */
  pixelSize?: number;
  /** PDF page edge in millimetres (the page is exactly the code, quiet zone included). */
  printSizeMm?: number;
}

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
  const base =
    name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "qdot-qr";
  return `${base}.${format}`;
}

/** Standalone SVG: vector shapes, gradients, embedded images, transparency, quiet zone included. */
export function exportSvg(payload: string, design: QRDesign, pixelSize = 1024): string {
  return geometryToSvg(buildQRGeometry(payload, design), pixelSize);
}

/** Rasterizes the SVG in the browser; transparent backgrounds stay transparent. */
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
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG encoding failed"))), "image/png"));
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

/**
 * Vector PDF for print. jsPDF + svg2pdf.js (~350 kB) are only downloaded when
 * someone actually exports a PDF.
 */
async function svgToPdfBlob(svg: string, sizeMm: number): Promise<Blob> {
  const [{ jsPDF }, { svg2pdf }] = await Promise.all([import("jspdf"), import("svg2pdf.js")]);
  const doc = new jsPDF({ unit: "mm", format: [sizeMm, sizeMm], orientation: "portrait", compress: true });
  const element = new DOMParser().parseFromString(svg, "image/svg+xml").documentElement as unknown as SVGElement;
  await svg2pdf(element, doc, { x: 0, y: 0, width: sizeMm, height: sizeMm });
  return doc.output("blob");
}

export async function downloadQRCode({ payload, design, name, format, pixelSize = 1024, printSizeMm = 50 }: ExportOptions): Promise<void> {
  const svg = exportSvg(payload, design, pixelSize);
  if (format === "svg") return triggerDownload(new Blob([svg], { type: "image/svg+xml" }), fileNameFor(name, "svg"));
  if (format === "png") return triggerDownload(await svgToPngBlob(svg, pixelSize), fileNameFor(name, "png"));
  triggerDownload(await svgToPdfBlob(svg, printSizeMm), fileNameFor(name, "pdf"));
}
