import type { LoadedFonts } from "./fonts";

/**
 * 글자 슬롯을 그린다. `H` 는 잉크 높이의 목표값 — 폭은 글자 나름이다.
 *
 * `measure` 가 붙어 있으면 배치 단계(layoutSlots)가 그걸로 실제 가로세로비를
 * 읽어 자리를 잡는다. 없으면(웹폰트 <text> 폴백) 정사각으로 가정한다.
 */
export type TextRenderer = ((text: string, cx: number, cy: number, H: number, fgFill: string) => string) & {
  measure?: (text: string) => { w: number; h: number };
};

/**
 * Convert a text slot to a vector <path> using opentype.js — used at download
 * time so the SVG renders identically without web-font availability.
 */
/** 실측용 임시 폰트 크기 — 이 값으로 한 번 재고 비율만 뽑아 쓴다. */
const PROBE_SIZE = 100;

/**
 * 글자 사이를 좁히는 양(em). 기본 자간 그대로 두면 글리프 사이 잉크 간격이
 * 라틴·숫자는 잉크 높이의 11~12%, 한글은 4% 로 세 배 가까이 벌어진다. 한 슬롯
 * 안의 글자들은 한 덩어리로 읽혀야 하므로 라틴·숫자만 한글 수준으로 좁힌다.
 * Pacifico(소문자)는 필기체라 좁히면 획이 겹쳐서 건드리지 않는다.
 */
const LETTER_SPACING: Record<TextScript, number> = {
  other: -0.05,
  hangul: 0,
  lower: 0,
};

export function makePathTextRenderer(fonts: LoadedFonts): TextRenderer {
  const fontFor = (text: string) =>
    classifyScript(text) === "lower" ? fonts.pacifico : fonts.pretendard;
  const clip = (text: string) => (text || "A").slice(0, 3);
  const optsFor = (text: string) => ({ letterSpacing: LETTER_SPACING[classifyScript(text)] });

  /** PROBE_SIZE 기준 잉크 bbox — 비율만 쓰므로 절대 크기는 의미 없다. */
  const measure = (text: string) => {
    const t = clip(text);
    const b = fontFor(t).getPath(t, 0, 0, PROBE_SIZE, optsFor(t)).getBoundingBox();
    return { w: b.x2 - b.x1, h: b.y2 - b.y1 };
  };

  const render: TextRenderer = (text, cx, cy, H, fgFill) => {
    const displayText = clip(text);
    const font = fontFor(displayText);

    // 글자도 심볼과 같은 규칙 — 실제 잉크 높이를 기준 높이 H 에 맞춘다. 글자
    // 종류·개수별 divisor 추정치 대신 실측이라, Pacifico 소문자의 높이 편차
    // (-20.6~+15.9%p) 가 사라지고 어떤 글자든 심볼과 위아래 끝이 맞는다.
    const probe = measure(displayText);
    const fontSize = probe.h > 0 ? PROBE_SIZE * (H / probe.h) : H;
    const opts = optsFor(displayText);

    // 잰 크기로 다시 그려서 잉크 중심을 (cx, cy) 에 맞춘다.
    const bbox = font.getPath(displayText, 0, 0, fontSize, opts).getBoundingBox();
    const dx = cx - (bbox.x1 + bbox.x2) / 2;
    const dy = cy - (bbox.y1 + bbox.y2) / 2;
    const placed = font.getPath(displayText, dx, dy, fontSize, opts);
    const fillEsc = fgFill.replace(/"/g, "&quot;");
    return `<path d="${placed.toPathData(2)}" fill="${fillEsc}"/>`;
  };

  render.measure = measure;
  return render;
}

type TextScript = "lower" | "hangul" | "other";

function classifyScript(text: string): TextScript {
  if (/^[a-z]+$/.test(text)) return "lower";
  if (/[가-힣]/.test(text)) return "hangul";
  return "other";
}

// 스크립트별 폰트 — 1글자일 때의 divisor, family, weight
const SCRIPT_FONT: Record<TextScript, { div1: number; family: string; weight: string }> = {
  lower:  { div1: 0.60, family: "Pacifico,cursive", weight: "400" },
  hangul: { div1: 0.92, family: "'Pretendard Variable','Pretendard',system-ui,sans-serif", weight: "900" },
  other:  { div1: 0.72, family: "-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif", weight: "900" },
};

function textSlotFontSize(script: TextScript, charCount: number, E: number): number {
  const isLower = script === "lower";
  if (charCount === 1) return E / SCRIPT_FONT[script].div1;
  if (charCount === 2) return isLower ? E * 1.20 : E;
  return isLower ? E * 0.94 : E * 0.78;
}

// 소문자 1글자일 때 시각적 무게중심 보정 (디센더/어센더가 있는 글자)
const LOWER_SINGLE_Y_OFFSET: Record<string, number> = {
  b: 0.20, d: 0.20, h: 0.20, k: 0.20, l: 0.20,
  t: 0.10,
  i: 0.08,
  g: -0.20, j: -0.20, p: -0.20, q: -0.20, y: -0.20,
};

export function renderTextSlot(text: string, cx: number, cy: number, E: number, fgFill: string): string {
  const displayText = (text || "A").slice(0, 3);
  const charCount = displayText.length;
  const script = classifyScript(displayText);
  const isLower = script === "lower";

  const fontSize = textSlotFontSize(script, charCount, E);
  const yOffset = isLower && charCount === 1 ? (LOWER_SINGLE_Y_OFFSET[displayText] ?? 0) * fontSize : 0;
  const textY = isLower ? cy - fontSize * 0.18 + yOffset : cy;

  const { family: fontFamily, weight: fontWeight } = SCRIPT_FONT[script];
  const isTwoDigit = charCount === 2 && /^\d+$/.test(displayText);
  const letterSpacing = isTwoDigit ? -fontSize * 0.08 : 0;
  const lsAttr = letterSpacing !== 0 ? ` letter-spacing="${letterSpacing.toFixed(2)}"` : "";
  return `<text x="${cx.toFixed(1)}" y="${textY.toFixed(1)}" font-family="${fontFamily}" font-size="${fontSize.toFixed(1)}" font-weight="${fontWeight}"${lsAttr} fill="${fgFill}" text-anchor="middle" dominant-baseline="central">${displayText}</text>`;
}
