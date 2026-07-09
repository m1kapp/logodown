import { zip } from "fflate";
import { F, buildManifest, buildHeadSnippet, buildReadme } from "./seo-pack-files";
import { svgToPngBytes, buildMaskablePng, buildOgImage, buildIco } from "./canvas-render";

/**
 * Build a complete SEO/PWA asset bundle from a logo SVG string.
 *
 * Output ZIP contains:
 *  - icon.svg                 (vector source)
 *  - favicon.ico              (multi-size ICO: 16/32/48)
 *  - favicon-16.png, favicon-32.png
 *  - apple-touch-icon.png     (180)
 *  - icon-192.png, icon-512.png  (PWA)
 *  - icon-maskable-512.png    (80% safe area, no rounded corners)
 *  - og-image.png             (1200×630, logo + wordmark + slogan)
 *  - manifest.json            (PWA)
 *  - head.html                (copy-paste markup)
 *  - README.md                (install guide)
 *
 * `iconSvg` is the standard rounded logo (used for everything except maskable).
 * `maskableSvg` is the same logo without rounded corners or border (full-bleed).
 */
export type SeoPackInput = {
  iconSvg: string;
  maskableSvg: string;
  brandName: string;
  slogan: string;
  bgColor: string;       // theme color
  bgGradEnd?: string;    // optional gradient end color
  textColor: string;     // wordmark color (contrast with bg)
};

export type SeoPackCategory = "all" | "favicon" | "ios" | "pwa" | "social";

const CATEGORY_FILES: Record<SeoPackCategory, Set<string>> = {
  all: new Set([
    F.svg, F.ico, F.fav16, F.fav32,
    F.appleTouch, F.pwa192, F.pwa512,
    F.maskable, F.og,
    F.manifest, F.head, F.readme,
  ]),
  favicon: new Set([F.svg, F.ico, F.fav16, F.fav32, F.head]),
  ios:     new Set([F.appleTouch, F.head]),
  pwa:     new Set([F.pwa192, F.pwa512, F.maskable, F.manifest, F.head]),
  social:  new Set([F.og, F.head]),
};

export async function buildSeoPack(input: SeoPackInput, category: SeoPackCategory = "all"): Promise<Uint8Array> {
  const allowed = CATEGORY_FILES[category];
  const enc = new TextEncoder();
  const files: Record<string, Uint8Array> = {};
  const need = (name: string) => allowed.has(name);

  // 텍스트 파일 — 동기 생성
  const textFiles: [string, () => string][] = [
    [F.svg, () => input.iconSvg],
    [F.manifest, () => buildManifest(input)],
    [F.head, () => buildHeadSnippet(input)],
    [F.readme, () => buildReadme(input)],
  ];
  for (const [name, build] of textFiles) {
    if (need(name)) files[name] = enc.encode(build());
  }

  // 이미지 파일 — 비동기 생성, 병렬 실행
  const imageFiles: [string, () => Promise<Uint8Array>][] = [
    [F.ico, () => buildIco(input.iconSvg, [16, 32, 48])],
    [F.fav16, () => svgToPngBytes(input.iconSvg, 16)],
    [F.fav32, () => svgToPngBytes(input.iconSvg, 32)],
    [F.appleTouch, () => svgToPngBytes(input.iconSvg, 180)],
    [F.pwa192, () => svgToPngBytes(input.iconSvg, 192)],
    [F.pwa512, () => svgToPngBytes(input.iconSvg, 512)],
    [F.maskable, () => buildMaskablePng(input.maskableSvg, input.bgColor, 512)],
    [F.og, () => buildOgImage(input)],
  ];
  await Promise.all(
    imageFiles
      .filter(([name]) => need(name))
      .map(async ([name, build]) => { files[name] = await build(); })
  );

  return new Promise<Uint8Array>((resolve, reject) => {
    zip(files, { level: 6 }, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}
