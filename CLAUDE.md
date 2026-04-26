# Logo Maker — 인수인계서

## 프로젝트 개요

`/Users/minho/IdeaProjects/m1kapp/logodown/`

앱 아이콘과 파비콘을 브라우저에서 바로 만들 수 있는 단독 서비스.
원래 `@m1kapp/kit` demo 앱의 탭 중 하나였다가 독립 프로젝트로 분리됨.

## 스택

- React 19 + Vite 6 + TypeScript
- Tailwind CSS v4 (`@import "tailwindcss"`)
- `@m1kapp/kit` — UI 컴포넌트 (AppShell, Section, Divider, Tooltip, ThemeButton 등)
- 폰트: Pretendard Variable, Tossface, Pacifico (index.html에서 CDN 로드)

## 파일 구조

```
logodown/
├── svg/              ← 심볼별 standalone SVG 파일 (54개)
│                       App.tsx의 LOGO_SYMBOLS와 path가 일부 다를 수 있음 (구버전)
├── src/
│   ├── App.tsx       ← 앱 전체 (LOGO_SYMBOLS, buildLogoSvgStr, UI 모두 여기)
│   ├── index.css     ← Tailwind v4 import + scrollbar-hide utility
│   └── main.tsx      ← React 19 createRoot
├── index.html        ← 폰트 CDN 링크 포함
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## App.tsx 핵심 구조

### LOGO_SYMBOLS

모든 심볼 정의. 각 항목:
```ts
{ id: string; label: string; d?: string; vb?: number; isRing?: boolean; fillRule?: string; rotate?: number }
```

- `vb`: viewBox 크기 (100 또는 24). path는 vb×vb 그리드 기준
- `d`: SVG path (fill-based, stroke 없음)
- `isRing`: true면 circle 링 (path 없이 circle 두 개로 렌더)
- `rotate`: 회전각 (화살표 8방향이 동일 path + rotate로 구현됨)

심볼 패밀리:
- **화살표** — 8방향, `ARROW_D` 하나 + rotate
- **zap** — 번개 3종 (zap: `\`, zap2: `/`, zap3: 쌍번개)
- **별** — star4thin/star4/star5thin/star/star5fat/star6/star8
- **기하** — triangle, diamond, plus, cross, circle(ring), check, slash, sparkle, wave
- **브랜드 영감** — drawio, bars, layers, codecrafters (24×24 grid)
- **커스텀** — flow, wave2, hex, dbox, flame (24×24 grid)
- **점 링** — dots4~dots9 (원주 위 N개 원, r=10~12)
- **별 링** — starring5/6/8 (원주 위 N개 뾰족한 4각별, inner offset 2px)
- **혜성** — meteor/meteor2/meteor3 (동일 혜성 모양 × 1/2/3개)

### buildLogoSvgStr(text, symbolId, bg, radius, size, gradientEnd?)

SVG 문자열 생성기. 핵심 로직:
- **레이아웃**: 이니셜 E×E + gap + 심볼 E×E (E = size × 0.30)
- **텍스트**: 소문자만이면 Pacifico 폰트, 아니면 system-ui 900
- **그라디언트**: `gradientEnd` 있으면 linearGradient (좌상→우하)
- **테두리**: `invertHex(bg)` 색, opacity 0.4
- **circle ring**: `isRing`이면 흰 원 + 배경색 소원 (fill-even-odd 없이 두 circle)

### 상태

```ts
initial   // 이니셜 텍스트 (1~3자)
symbol    // 선택된 심볼 id
color     // 배경 hex
radius    // 모서리 반경 비율 (0~0.5)
gradient  // 그라디언트 on/off
uppercase // 대문자/소문자 토글
dark      // 다크모드
themeOpen // ThemeDialog 열림 여부
```

### UI 섹션 순서

1. **미리보기** — 112px 프리뷰 + 탭바/워드마크 컨텍스트 썸네일 + 랜덤 버튼
2. **이니셜** — 알파벳 그리드 (대/소문자 토글)
3. **심볼** — Tooltip으로 id 표시, 심볼 그리드
4. **색상** — LOGO_COLORS 팔레트 + hex 직접 입력
5. **모서리** — 4개 프리셋 + 슬라이더
6. **그라디언트** — on/off 토글
7. **다운로드** — SVG 512px 다운로드

## 다음 작업 (TODO)

- [ ] **파비콘 다운로드** — Canvas API로 PNG(512, 180, 32) + ICO 생성/다운로드
  - `svg/` 폴더의 SVG 파일들과 무관하게 `buildLogoSvgStr`으로 SVG → Image → Canvas → PNG/ICO
- [ ] **svg/ 동기화** — `svg/` 폴더 파일들이 현재 App.tsx path와 일부 다름 (구버전). 필요 시 스크립트로 재생성

## 관련 프로젝트

- `@m1kapp/kit` (`/Users/minho/IdeaProjects/m1kapp/kit/`) — UI 컴포넌트 패키지
  - `bin/favicon.mjs` — `npx m1kkit favicon` CLI (다른 프로젝트용, 여기서 건드리지 않음)
  - `src/og/og.tsx:createFaviconElement` — CLI가 사용하는 React 컴포넌트 (kit에 유지)
- Vercel 배포: 별도 프로젝트로 연결 예정 (아직 미설정)

## 개발 시작

```bash
cd /Users/minho/IdeaProjects/m1kapp/logodown
npm run dev
```
