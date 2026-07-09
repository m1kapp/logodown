import { svgToPngBytes } from "./canvas-render";

export function downloadSvg(svgStr: string, filename: string) {
  const blob = new Blob([svgStr], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export async function downloadPng(svgStr: string, size: number, filename: string) {
  const bytes = await svgToPngBytes(svgStr, size);
  const blob = new Blob([bytes] as BlobPart[], { type: "image/png" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
