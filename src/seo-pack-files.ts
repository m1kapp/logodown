import type { SeoPackInput } from "./seo-pack";

/**
 * Conventional asset filenames so they slot into any framework's `public/`
 * folder without renaming. The ZIP wrapper itself is what identifies the
 * source (`logodown-...zip`).
 */
export const F = {
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

/* ── manifest.json ───────────────────────────────────────────── */
export function buildManifest(input: SeoPackInput): string {
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
export function buildHeadSnippet(input: SeoPackInput): string {
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
export function buildReadme(input: SeoPackInput): string {
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
