# Logo Maker — 인수인계서

## 프로젝트 개요

`/Users/minho/dev/m1kapp/logodown/`

앱 아이콘과 파비콘을 브라우저에서 바로 만드는 단독 서비스. 원래 `@m1kapp/kit`
demo 앱의 탭 하나였다가 독립 프로젝트로 분리됨.

**두 칸짜리 슬롯**(앞/뒤)에 문자 또는 심볼을 하나씩 넣는 구조. `M + ↓` 가 마크다운
마크인 것처럼, 이니셜 하나와 뜻을 담은 심볼 하나를 붙이는 게 기본 문법이다.

세 가지 진입점이 **같은 엔진**을 공유한다.

| 진입점 | 실행 | 비고 |
|---|---|---|
| 웹앱 | `npm run dev` | URL 파라미터로 상태 복원 |
| CLI | `npx github:m1kapp/logodown` | Node. 래스터화는 resvg |
| Claude Code 스킬 | `logodown@m1kskills` | 판단 기준만. 내부에서 CLI 호출 |

## 스택

- React 19 + Vite 6 + TypeScript
- Tailwind CSS v4 — `@import "tailwindcss" source("../src")`
  (`source()` 를 빼면 자동 감지가 `dist-*` 산출물까지 훑다가 CSS 빌드가 깨진다)
- `@m1kapp/kit` — AppShell, Section, Watermark, Tooltip 등. **레지스트리 버전으로 둘 것**
  (`file:../kit/*.tgz` 로 바뀌면 git 설치가 깨진다)
- `opentype.js` — 글자를 path 로 변환 + 폭 실측
- `@resvg/resvg-js` — CLI 전용 래스터라이저
- `fflate` — SEO 팩 ZIP

## 파일 구조

```
logodown/
├── src/
│   ├── logo-engine.ts        ← 배치·렌더 핵심. 여기부터 읽을 것
│   ├── logo-symbols.ts       ← 인라인 path 심볼 + 3개 세트 합성
│   ├── symbols/
│   │   ├── lucide/*.svg      ← lucide 아이콘 (ORDER 배열이 노출 순서)
│   │   ├── custom/*.svg      ← 직접 그린 것
│   │   ├── parse.ts          ← SVG → path 목록. DOMParser 없으면 정규식 폴백(Node)
│   │   └── ink.generated.ts  ← 자동 생성. 직접 수정 금지
│   ├── text-render.ts        ← 글자 슬롯. opentype path + 자간
│   ├── logo-styles.ts        ← 색 팔레트 + 스타일 프리셋
│   ├── color-utils.ts        ← hex/hsl + autoGradientEnd
│   ├── logo-guides.tsx       ← 미리보기 가이드 오버레이
│   ├── url-state.ts          ← URL 파라미터 파서 (웹/CLI 공용)
│   ├── seo-pack*.ts, canvas-render.ts, build-ico.ts  ← 브라우저 다운로드 경로
│   ├── App.tsx, home-*.tsx, builder-*.tsx, ui-*.tsx  ← UI
│   └── use-logo-actions.ts   ← 랜덤·다운로드 핸들러
├── cli/
│   ├── index.ts              ← 인자 파싱 + 오케스트레이션
│   ├── raster.ts             ← canvas-render.ts 의 Node 대응 (resvg)
│   └── bin.ts
├── scripts/gen-symbol-bbox.ts  ← ink.generated.ts 생성기
└── vite.{config,cli.config,bbox.config}.ts
```

## 핵심 규칙 — 잉크 기준 배치

여기가 이 프로젝트에서 제일 중요한 부분이고, 손대기 전에 이유를 알아야 한다.

**심볼 path 는 자기 그리드를 꽉 채우지 않는다.** lucide 는 보통 2px 여백, flame 은
세로로 17/24 만 쓴다. 그래서 viewBox 기준으로 크기를 맞추면 글자 옆에 놓았을 때
심볼마다 크기가 제각각으로 보인다. 글자도 마찬가지로 폰트 종류·글자 수에 따라
잉크 높이가 제멋대로다.

해결은 **전부 실측**:

1. `scripts/gen-symbol-bbox.ts` 가 심볼을 256px 로 렌더해 알파 채널을 훑어
   실제 잉크 bbox 를 잰다 → `ink.generated.ts`. 심볼 svg 를 고쳤으면 `npm run bbox`
2. 글자는 `TextRenderer.measure` 가 opentype 으로 잰다
3. `layoutSlots()` 가 모든 슬롯을 **같은 높이**(캔버스의 30%)에 맞추고, 폭은 각자
   실제 비율대로 둔 뒤 나란히 놓는다
4. 그룹 폭이 세이프존 66% 를 넘으면 **전체를 같은 비율로 축소**

고정 격자(슬롯 폭 = 30% 고정)를 쓰던 시절엔 `59` 가 0.59배, `W` 가 0.69배로 눌려
옆 칸과 위아래가 어긋났다. 폭을 먼저 재고 배치하면 높이는 항상 같고 충돌도 없다.
대가는 가로로 긴 조합이 그룹째 작아지는 것(`599 + waveform` 은 기준 높이의 58%).

관련 상수 — `LAYOUT = { height: 0.30, gap: 0.06, maxGroup: 0.66 }`.
`maxGroup` 0.66 은 Android 적응형 아이콘 세이프존(108dp 중 72dp)과 같은 값이다.

**가이드 오버레이는 반드시 `layoutSlots()` 를 호출해야 한다.** 좌표를 따로 계산하면
가이드가 실제 렌더와 어긋나 거짓말을 한다.

## logo-engine.ts 읽는 순서

- `LAYOUT`, `layoutSlots()` — 배치
- `renderSymbolSlot()` — 잉크 bbox 높이를 기준 높이에 맞추고, 회전은 잉크 중심축으로
  바깥에서 건다(viewBox 중심으로 돌리면 잉크가 치우친 심볼이 밀려난다)
- `STROKE_WEIGHTS` — 선 굵기는 심볼 원본 `stroke-width` 가 아니라 기준 높이 대비
  비율. 원본을 쓰면 잉크 fit 배율 차이로 실효 선폭이 1.23배까지 벌어진다
- `buildLogoSvgStr()` — 동기. 미리보기·CLI 공용
- `buildLogoSvgStrForExport()` / `ForMaskable()` — 폰트 로드 후 path 변환

### 텍스트 렌더러

`TextRenderer` 는 함수 + 선택적 `.measure` 다. `.measure` 가 있어야 배치가 실제
가로세로비를 읽는다. 없으면(웹폰트 `<text>` 폴백) 정사각으로 가정한다.

**`measure()` 와 렌더는 반드시 같은 자간 옵션을 써야 한다.** 어긋나면 배치가 잰
폭과 실제 폭이 달라져 슬롯이 한쪽으로 치우친다.

자간은 라틴·숫자만 `-0.05em`. 기본값이면 글리프 사이 잉크 간격이 라틴 11~12%,
한글 4% 로 세 배 벌어져 `꽃88` 같은 조합에서 숫자만 흩어져 보인다. Pacifico
(소문자)는 필기체라 좁히면 획이 겹친다.

미리보기도 폰트 로드 후에는 path 렌더러를 쓴다. `<text>` + 웹폰트로는 폭을 잴 수
없어서 배치가 틀리고 결과물과 어긋나기 때문. **폰트 로드 전에는 가이드 버튼이
비활성** — 그 상태의 가이드는 거짓말이 된다.

## 색

`autoGradientEnd()` 가 시작색에서 끝색을 만든다 — 색상환 +32°, 밝기는 중간 톤 쪽.

실제 브랜드 그라디언트를 재보면 hue arc 는 비슷한데(Tinder 36°, Instagram 인접
스톱 40°) 밝기 방향이 반대다. 전부 밝아지는 쪽(+6~16)인데 예전 규칙은 -8 이라,
색상환을 돌리면서 동시에 어둡게 하는 바람에 채도가 죽어 겨자·올리브로 떨어졌다
(orange → `#badb0c` 라임, youtube 빨강 → `#cc8c00` 겨자).

스타일 5종 × solid/gradient = 10개 StyleId. `outline` 은 배경 없이 테두리만 그리는
마크다운 마크 룩 — `resolveStyle()` 이 `frame` 을 함께 돌려준다. **배경이 투명이라
파비콘으로 쓰면 다크 탭에서 안 보인다.**

## URL 파라미터

웹앱과 CLI `--url` 이 `parseUrlState()` 를 공유한다. 이상한 값은 무시하고 기본값 유지.

```
?front=symbol:flame&back=char:C&color=%23FF0000&mode=gradient
 &style=outline&sw=thin&fr=0&br=0&fs=1&bs=1&shadow=0&title=&desc=
```

`fs`/`bs`(슬롯 크기)는 UI 에서 뺐다 — 잉크 정규화가 자동으로 맞추므로 보통 불필요.
별·다이아처럼 bbox 가 같아도 시각 무게가 다른 경우의 탈출구로 URL·CLI 에만 남겼다.

## 개발

```bash
odev                 # dev 서버 (전역 규칙)
npm run bbox         # 심볼 svg 고친 뒤 ink 표 재생성
npm run build:cli    # dist-cli/logodown.mjs
npx tsc --noEmit
```

**CLI 는 Vite SSR 로 번들해야 한다.** 심볼 로더가 `import.meta.glob` 을 쓰기 때문에
tsc/tsx 로는 실행되지 않는다. 같은 이유로 `npm run bbox` 도 Vite 빌드를 거친다.

`package.json` 은 `private: true` — npm 퍼블리시 안 한다. 배포는 git 설치
(`npx github:m1kapp/logodown`)로 간다. `prepare` 스크립트가 설치 시 CLI 를 번들한다
(`prepublishOnly` 는 git 설치에서 안 돌아간다).

## 남은 작업

- [ ] **OG 이미지가 CLI 에 없다** — 브라우저판 `buildOgImage()` 는 canvas 에 텍스트를
      직접 그린다. 지금은 opentype path 렌더러가 있으니 1200×630 SVG 로 만들어
      resvg 로 구우면 된다. 그러면 canvas 폰트 의존도 사라진다
- [ ] `canvas-render.ts` 와 `cli/raster.ts` 가 같은 일을 두 번 한다. SVG 기반으로
      통일하면 한쪽으로 합칠 수 있다

## 관련 프로젝트

- `@m1kapp/kit` (`/Users/minho/dev/m1kapp/kit/`) — UI 컴포넌트 패키지
  - `bin/favicon.mjs` — `npx m1kkit favicon` CLI. **여기서 건드리지 않는다**
- `m1kapp/m1kskills` — Claude Code 스킬 배포. `plugins/logodown/skills/logodown/SKILL.md`
  가 판단 기준을 담고, 엔진은 이 저장소를 `npx` 로 호출한다
- 배포: https://logodown.m1k.app
