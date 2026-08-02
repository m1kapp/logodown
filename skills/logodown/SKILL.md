---
name: logodown
description: >
  프로젝트에 어울리는 앱 아이콘·파비콘·로고를 이름과 성격만 보고 직접 골라서 만들어 준다.
  심볼 148개 + 문자(영대소문자·숫자·한글) 중에서 슬롯 두 칸을 정하고, 브랜드 색과 스타일을 정한 뒤
  `npx github:m1kapp/logodown` 으로 icon.svg / favicon.ico / apple-touch-icon / PWA 아이콘 /
  manifest.json / head.html 까지 한 번에 뽑는다.
  "로고 만들어", "파비콘 만들어줘", "앱 아이콘 필요해", "favicon", "아이콘 좀 뽑아줘",
  "이 프로젝트 로고", "logodown" 요청 시 사용.
---

# logodown — 로고·파비콘 생성

두 칸짜리 슬롯(앞/뒤)에 **문자 또는 심볼**을 하나씩 넣고, 배경색·스타일을 얹는 구조.
`M + ↓` 가 마크다운 마크인 것처럼, **이니셜 + 뜻을 담은 심볼** 조합이 기본 문법이다.

## 1. 무엇을 만들지 정한다

프로젝트 이름·설명·package.json·README 를 먼저 읽고 아래를 스스로 결정한다. 사용자에게
일일이 묻지 말 것 — 정하고, 결과를 보여주고, 마음에 안 들면 그때 바꾼다.

**슬롯 두 칸**

| 조합 | 언제 | 예 |
|---|---|---|
| 문자 + 심볼 | 기본값. 이름이 읽히면서 뜻도 전달됨 | `M + down`, `C + flame` |
| 심볼 + 문자 | 심볼이 단어의 앞부분을 대신할 때 | `flame + 컷` = "핫컷" |
| 문자 + 문자 | 두 글자 약어 | `H + C` |
| 심볼 + 심볼 | 이름이 안 읽혀도 될 때. 추상적 | `zap + bars` |

- 문자는 `char:` 접두사, 심볼은 접두사 없이 또는 `symbol:` — `-f char:M -b down`
- 한글 한 글자도 쓸 수 있다: `-b char:컷` (셸에서는 그대로, `--url` 안에서는 퍼센트 인코딩)
- 문자는 1~3자. 2자 이상이면 폭 기준으로 맞춰져서 작아진다 — 되도록 1자

**심볼 148개** — 전체 목록은 `npx github:m1kapp/logodown --list symbols`.
자주 쓰는 것만:

- 방향·움직임 `down up right left down-right zap zap2 zap3 meteor flow wave waves wind orbit`
- 기하 `star star4 star5fat star6 star8 triangle diamond plus cross circle check hex sparkle sparkles`
- 개발 `codecrafters drawio bars layers dbox box packageopen settings wrench hammer key shield puzzle`
- 자연 `flame droplet leaf trees sprout flower clover mountain cloud sun moon snowflake tulip cactus`
- 도구 `scissors pen pocketknife sword paintroller palette camera wand flask beaker microscope compass map`
- 생물 `rabbit fish bird dog cat panda crab elephant ghost brain dna`
- 음식 `coffee coffeebean burger pizza cookie cake donut lemon carrot apple wine beer bottle`
- 상징 `crown trophy gem heart target rocket globe lightbulb megaphone gradcap handshake infinity anchor feather`

**색** — 브랜드가 있으면 그 색. 없으면 성격에 맞춰 고른다.
팔레트에 이름으로 든 값들: `#09090b`(black) `#7c3aed`(violet) `#3b82f6`(blue) `#06b6d4`(cyan)
`#10b981`(emerald) `#f59e0b`(amber) `#f97316`(orange) `#ef4444`(red) `#ec4899`(pink)
`#FF0000`(youtube) `#D97757`(claude) `#10A37F`(openai) `#5E6AD2`(linear) `#635BFF`(stripe)

**스타일** (`-s`)

| 값 | 결과 | 언제 |
|---|---|---|
| `colorWhite` (기본) | 색 배경 + 흰 글리프 | 앱 아이콘. 가장 무난 |
| `color` | 색 배경 + 어두운 글리프 | 밝은 색일 때 |
| `onWhite` | 흰 배경 + 색 글리프 | 문서·README 안에 놓을 때 |
| `onBlack` | 검정 배경 + 색 글리프 | 다크 테마 제품 |
| `outline` | 배경 없이 테두리만 | 마크다운 마크 같은 룩. 배경이 투명이라 파비콘엔 주의 |

**그라디언트** (`-g`) — 끝색은 시작색에서 자동 계산(색상환 +32°, 중간 톤 쪽으로).
채도 높은 색에서 잘 나오고, 검정·흰색·아주 어두운 색에서는 효과가 거의 없다.

## 2. 만든다

```bash
npx github:m1kapp/logodown -f char:M -b down -c '#09090b' -o public
```

첫 실행은 clone + 번들 때문에 30초쯤 걸린다(이후 npx 캐시).

주요 옵션:

```
-f, --front <slot>   앞 슬롯. flame | symbol:flame | char:C
-b, --back  <slot>   뒤 슬롯
-c, --color <hex>    기준 색
-g, --gradient       그라디언트
-s, --style <id>     colorWhite | color | onWhite | onBlack | outline
    --sw <weight>    선 심볼 굵기. thin | light | regular | bold
    --fr, --br <n>   앞/뒤 슬롯 회전 0~360
    --fs, --bs <n>   앞/뒤 슬롯 크기 0.5~2 (기본은 자동 정규화라 보통 불필요)
    --shadow <0-3>   그림자
-o, --out <dir>      출력 폴더 (기본 ./logodown-out)
    --svg-only       SVG 만
    --name/--slogan  manifest·OG 텍스트
    --url <url>      웹앱 링크를 그대로 붙여넣기
    --list [symbols|chars]
```

나오는 파일: `icon.svg` `favicon.ico`(16·32·48) `favicon-16/32.png`
`apple-touch-icon.png`(180) `icon-192/512.png` `icon-maskable-512.png`
`manifest.json` `head.html` `README.md`

## 3. 보여주고 고른다

**후보를 3~4개 만들어 한 번에 보여준다.** 하나만 만들어 들이밀지 말 것.
서로 다른 축으로 흔든다 — 심볼을 바꾸거나, 스타일을 바꾸거나, 색을 바꾸거나.

```bash
for v in "flame char:C #FF0000" "zap char:C #7c3aed" "bars char:C #09090b"; do ... done
```

만든 뒤 `icon-512.png` 들을 사용자에게 이미지로 보여준다(파일 전송). 텍스트로 설명만
하지 말 것 — 로고는 봐야 판단이 된다.

## 4. 프로젝트에 붙인다

`-o public` 으로 뽑았으면 `head.html` 내용을 `index.html` 의 `<head>` 에 붙이면 끝.
Next.js 면 `app/` 에 `icon.svg` `apple-icon.png` 로 두면 자동 인식된다.

## 판단 기준

- **작은 크기에서 살아남는가** — 파비콘은 16px 다. 선이 얇거나 요소가 많으면 뭉갠다.
  `--sw thin` 은 32px 이하에서 거의 사라진다
- **뜻이 읽히는가** — 심볼 두 개로 단어를 만드는 수수께끼(불+가위=핫컷)는 대체로 안 읽힌다.
  글자를 한 칸 쓰는 편이 낫다
- **`outline` 은 배경이 투명** — 다크 브라우저 탭에서 검은 테두리는 보이지 않는다.
  파비콘 용도면 밝은 색을 쓰거나 다른 스타일로
- 크기·정렬은 엔진이 잉크 bbox 기준으로 자동 정규화한다. `--fs`/`--bs` 는 웬만하면 건드리지 말 것

## 웹에서 직접 고르고 싶을 때

같은 엔진의 웹 UI 가 있고, URL 파라미터로 상태를 바로 열 수 있다.

```
https://logodown.m1k.app/?front=symbol:flame&back=char:C&color=%23FF0000&mode=gradient&style=outline&sw=thin
```

파라미터: `front` `back` `color` `mode`(solid/gradient) `style` `fr` `br` `fs` `bs`
`shadow` `sw` `title` `desc`. 이 URL 을 그대로 `--url` 에 넘겨도 된다.
