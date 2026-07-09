import type { SeoPackInput } from "./seo-pack";
import { packIco } from "./build-ico";

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

async function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
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
export async function buildOgImage(input: SeoPackInput): Promise<Uint8Array> {
  const W = 1200, H = 630;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");

  // Background — gradient if provided, else solid
  if (input.bgGradEnd) {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, input.bgColor);
    g.addColorStop(1, input.bgGradEnd);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = input.bgColor;
  }
  ctx.fillRect(0, 0, W, H);

  // Logo — big square on the left
  const logoSize = 320;
  const logoX = 110;
  const logoY = (H - logoSize) / 2;
  const { img, revoke } = await loadSvgImage(input.iconSvg, "og logo load failed");
  try {
    ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
  } finally {
    revoke();
  }

  // Wordmark + slogan on the right
  const textX = logoX + logoSize + 70;
  ctx.fillStyle = input.textColor;
  ctx.textBaseline = "alphabetic";

  ctx.font = `900 110px -apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif`;
  ctx.fillText(input.brandName, textX, H / 2 - 20);

  ctx.font = `500 32px -apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif`;
  ctx.fillStyle = input.textColor;
  ctx.globalAlpha = 0.7;
  ctx.fillText(input.slogan, textX, H / 2 + 30);
  ctx.globalAlpha = 1;

  return canvasToPngBytes(canvas);
}

/* ── ICO (multi-size PNG container) ──────────────────────────── */
export async function buildIco(svgStr: string, sizes: number[]): Promise<Uint8Array> {
  const pngs = await Promise.all(sizes.map((s) => svgToPngBytes(svgStr, s)));
  return packIco(sizes, pngs);
}
