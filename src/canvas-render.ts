import type { SeoPackInput } from "./seo-pack";
import { packIco } from "./build-ico";
import { buildOgSvgStr } from "./og-image";

/* ── shared: SVG string → loaded <img>, and <canvas> → PNG bytes ─ */

/** Load an SVG string as a decoded `<img>`. Caller must call the returned `revoke()` when done. */
async function loadSvgImage(svgStr: string, errMsg: string): Promise<{ img: HTMLImageElement; revoke: () => void }> {
  const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error(errMsg));
    img.src = url;
  });
  return { img, revoke: () => URL.revokeObjectURL(url) };
}

export async function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const out = await new Promise<Blob>((res, rej) => {
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png");
  });
  return new Uint8Array(await out.arrayBuffer());
}

/* ── PNG (svg → png blob) ────────────────────────────────────── */
export async function svgToPngBytes(svgStr: string, size: number): Promise<Uint8Array> {
  try {
    const f = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
    if (f?.ready) await f.ready;
  } catch {}
  const { img, revoke } = await loadSvgImage(svgStr, "svg image load failed");
  try {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    ctx.drawImage(img, 0, 0, size, size);
    return await canvasToPngBytes(canvas);
  } finally {
    revoke();
  }
}

/* ── Maskable PNG (80% safe area, padded with bg color) ──────── */
export async function buildMaskablePng(maskableSvg: string, bgColor: string, size = 512): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");

  // Fill full bg (the 10% padding outside the safe zone)
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  // Draw inner logo at 80% centered
  const inner = size * 0.8;
  const off = size * 0.1;
  const { img, revoke } = await loadSvgImage(maskableSvg, "maskable svg load failed");
  try {
    ctx.drawImage(img, off, off, inner, inner);
  } finally {
    revoke();
  }
  return canvasToPngBytes(canvas);
}

/* ── OG image (1200×630, logo + brand + slogan) ──────────────── */
/**
 * OG 카드. 레이아웃과 글자는 `og-image.ts` 가 SVG 로 만들고 여기서는 래스터화만
 * 한다 — canvas 에 직접 그리면 실행 환경 폰트에 따라 결과가 달라져서 CLI 와
 * 어긋난다.
 */
export async function buildOgImage(input: SeoPackInput): Promise<Uint8Array> {
  const svg = await buildOgSvgStr(input);
  const { img, revoke } = await loadSvgImage(svg, "og svg load failed");
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    ctx.drawImage(img, 0, 0, 1200, 630);
    return await canvasToPngBytes(canvas);
  } finally {
    revoke();
  }
}

/* ── ICO (multi-size PNG container) ──────────────────────────── */
export async function buildIco(svgStr: string, sizes: number[]): Promise<Uint8Array> {
  const pngs = await Promise.all(sizes.map((s) => svgToPngBytes(svgStr, s)));
  return packIco(sizes, pngs);
}
