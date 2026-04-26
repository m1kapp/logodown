import { zip } from "fflate";

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

/* ── PNG (svg → png blob) ────────────────────────────────────── */
async function svgToPngBytes(svgStr: string, size: number): Promise<Uint8Array> {
  try {
    const f = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
    if (f?.ready) await f.ready;
  } catch {}
  const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("svg image load failed"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    ctx.drawImage(img, 0, 0, size, size);
    const out = await new Promise<Blob>((res, rej) => {
      canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png");
    });
    return new Uint8Array(await out.arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ── ICO (multi-size PNG container) ──────────────────────────── */
async function buildIco(svgStr: string, sizes: number[]): Promise<Uint8Array> {
  const pngs = await Promise.all(sizes.map((s) => svgToPngBytes(svgStr, s)));

  const headerSize = 6 + 16 * sizes.length;
  const totalDataSize = pngs.reduce((a, p) => a + p.length, 0);
  const buf = new ArrayBuffer(headerSize + totalDataSize);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);

  // ICONDIR
  view.setUint16(0, 0, true);          // reserved
  view.setUint16(2, 1, true);          // type: icon
  view.setUint16(4, sizes.length, true); // count

  let offset = headerSize;
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const png = pngs[i];
    const e = 6 + 16 * i;
    view.setUint8(e + 0, size === 256 ? 0 : size);  // width  (0 means 256)
    view.setUint8(e + 1, size === 256 ? 0 : size);  // height
    view.setUint8(e + 2, 0);                         // colors (0 = 256+)
    view.setUint8(e + 3, 0);                         // reserved
    view.setUint16(e + 4, 1, true);                  // color planes
    view.setUint16(e + 6, 32, true);                 // bits per pixel
    view.setUint32(e + 8, png.length, true);         // size of icon data
    view.setUint32(e + 12, offset, true);            // offset in file
    bytes.set(png, offset);
    offset += png.length;
  }
  return bytes;
}

/* ── Maskable PNG (80% safe area, padded with bg color) ──────── */
async function buildMaskablePng(maskableSvg: string, bgColor: string, size = 512): Promise<Uint8Array> {
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
  const blob = new Blob([maskableSvg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("maskable svg load failed"));
      img.src = url;
    });
    ctx.drawImage(img, off, off, inner, inner);
  } finally {
    URL.revokeObjectURL(url);
  }
  const out = await new Promise<Blob>((res, rej) => {
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png");
  });
  return new Uint8Array(await out.arrayBuffer());
}

/* ── OG image (1200×630, logo + brand + slogan) ──────────────── */
async function buildOgImage(input: SeoPackInput): Promise<Uint8Array> {
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
  const blob = new Blob([input.iconSvg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("og logo load failed"));
      img.src = url;
    });
    ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
  } finally {
    URL.revokeObjectURL(url);
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

  const out = await new Promise<Blob>((res, rej) => {
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png");
  });
  return new Uint8Array(await out.arrayBuffer());
}

/* ── manifest.json ───────────────────────────────────────────── */
function buildManifest(input: SeoPackInput): string {
  return JSON.stringify(
    {
      name: input.brandName,
      short_name: input.brandName,
      description: input.slogan,
      start_url: "/",
      display: "standalone",
      background_color: input.bgColor,
      theme_color: input.bgColor,
      icons: [
        { src: `/${F.pwa192}`,   sizes: "192x192", type: "image/png" },
        { src: `/${F.pwa512}`,   sizes: "512x512", type: "image/png" },
        { src: `/${F.maskable}`, sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    null,
    2,
  );
}

/* ── head.html snippet ───────────────────────────────────────── */
function buildHeadSnippet(input: SeoPackInput): string {
  const escAttr = (s: string) => s.replace(/"/g, "&quot;");
  return `<!-- logodown SEO/PWA package — paste inside <head> -->
<link rel="icon" type="image/x-icon" href="/${F.ico}" />
<link rel="icon" type="image/svg+xml" href="/${F.svg}" />
<link rel="icon" type="image/png" sizes="32x32" href="/${F.fav32}" />
<link rel="icon" type="image/png" sizes="16x16" href="/${F.fav16}" />
<link rel="apple-touch-icon" sizes="180x180" href="/${F.appleTouch}" />
<link rel="manifest" href="/${F.manifest}" />
<meta name="theme-color" content="${escAttr(input.bgColor)}" />

<!-- Open Graph -->
<meta property="og:title" content="${escAttr(input.brandName)}" />
<meta property="og:description" content="${escAttr(input.slogan)}" />
<meta property="og:image" content="/${F.og}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:type" content="website" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escAttr(input.brandName)}" />
<meta name="twitter:description" content="${escAttr(input.slogan)}" />
<meta name="twitter:image" content="/${F.og}" />
`;
}

/* ── README.md ───────────────────────────────────────────────── */
function buildReadme(input: SeoPackInput): string {
  return `# ${input.brandName} — SEO/PWA 패키지

**${input.slogan}**

이 ZIP에 들어있는 파일들을 사이트 \`public/\` (또는 루트)에 복사한 뒤,
\`head.html\` 의 마크업을 \`<head>\` 에 붙여넣으면 끝.

## 파일

| 파일 | 용도 |
|------|------|
| \`icon.svg\` | 벡터 원본 (텍스트가 path로 변환되어 어디서든 동일 렌더) |
| \`favicon.ico\` | 멀티사이즈 ICO (16/32/48) — 레거시 호환 |
| \`favicon-16.png\` / \`favicon-32.png\` | 모던 파비콘 |
| \`apple-touch-icon.png\` | iOS 홈 스크린 추가 (180×180) |
| \`icon-192.png\` / \`icon-512.png\` | PWA / Android |
| \`icon-maskable-512.png\` | Android 적응형 아이콘 (80% 안전영역) |
| \`og-image.png\` | 소셜 공유 카드 (1200×630, 페북/링크드인/카카오톡/슬랙) |
| \`manifest.json\` | PWA 설치 매니페스트 |
| \`head.html\` | \`<head>\` 에 붙여넣을 메타 태그 모음 |

## 적용

1. ZIP 풀어서 \`public/\` 에 넣기
2. \`head.html\` 내용을 \`<head>\` 에 추가
3. \`og:title\`, \`og:description\` 은 사이트별로 수정
4. 빌드 → 배포

## 참고

- og-image의 \`og:title\`/\`og:description\` 은 사이트마다 다르게 세팅하세요
- PWA로 설치 가능하게 하려면 HTTPS + Service Worker 필요
- iOS 16+ 는 \`apple-touch-icon\` 자동 라운딩
`;
}

/* ── Build ZIP ───────────────────────────────────────────────── */

export type SeoPackCategory = "all" | "favicon" | "ios" | "pwa" | "social";

/**
 * Conventional asset filenames so they slot into any framework's `public/`
 * folder without renaming. The ZIP wrapper itself is what identifies the
 * source (`logodown-...zip`).
 */
const F = {
  svg:        "icon.svg",
  ico:        "favicon.ico",
  fav16:      "favicon-16.png",
  fav32:      "favicon-32.png",
  appleTouch: "apple-touch-icon.png",
  pwa192:     "icon-192.png",
  pwa512:     "icon-512.png",
  maskable:   "icon-maskable-512.png",
  og:         "og-image.png",
  manifest:   "manifest.json",
  head:       "head.html",
  readme:     "README.md",
} as const;

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
  const tasks: Promise<void>[] = [];

  const need = (name: string) => allowed.has(name);

  if (need(F.svg))      files[F.svg]      = enc.encode(input.iconSvg);
  if (need(F.manifest)) files[F.manifest] = enc.encode(buildManifest(input));
  if (need(F.head))     files[F.head]     = enc.encode(buildHeadSnippet(input));
  if (need(F.readme))   files[F.readme]   = enc.encode(buildReadme(input));

  if (need(F.ico)) {
    tasks.push((async () => { files[F.ico] = await buildIco(input.iconSvg, [16, 32, 48]); })());
  }
  if (need(F.fav16)) {
    tasks.push((async () => { files[F.fav16] = await svgToPngBytes(input.iconSvg, 16); })());
  }
  if (need(F.fav32)) {
    tasks.push((async () => { files[F.fav32] = await svgToPngBytes(input.iconSvg, 32); })());
  }
  if (need(F.appleTouch)) {
    tasks.push((async () => { files[F.appleTouch] = await svgToPngBytes(input.iconSvg, 180); })());
  }
  if (need(F.pwa192)) {
    tasks.push((async () => { files[F.pwa192] = await svgToPngBytes(input.iconSvg, 192); })());
  }
  if (need(F.pwa512)) {
    tasks.push((async () => { files[F.pwa512] = await svgToPngBytes(input.iconSvg, 512); })());
  }
  if (need(F.maskable)) {
    tasks.push((async () => { files[F.maskable] = await buildMaskablePng(input.maskableSvg, input.bgColor, 512); })());
  }
  if (need(F.og)) {
    tasks.push((async () => { files[F.og] = await buildOgImage(input); })());
  }

  await Promise.all(tasks);

  return new Promise<Uint8Array>((resolve, reject) => {
    zip(files, { level: 6 }, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}
