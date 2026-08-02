import type { LoadedFonts } from "./fonts";

export type TextRenderer = (text: string, cx: number, cy: number, E: number, fgFill: string) => string;

/**
 * Convert a text slot to a vector <path> using opentype.js — used at download
 * time so the SVG renders identically without web-font availability.
 */
/** 실측용 임시 폰트 크기 — 이 값으로 한 번 재고 비율만 뽑아 쓴다. */
const PROBE_SIZE = 100;

export function makePathTextRenderer(fonts: LoadedFonts): TextRenderer {
  return (text, cx, cy, E, fgFill) => {
    const displayText = (text || "A").slice(0, 3);
    const script = classifyScript(displayText);
    const font = script === "lower" ? fonts.pacifico : fonts.pretendard;

    // 글자도 심볼과 같은 규칙 — 실제 잉크 bbox 의 긴 변을 슬롯 크기 E 에 맞춘다
    // (contain fit). 글자 종류·개수별 divisor 추정치 대신 실측이라, W 처럼 넓은
    // 글자가 슬롯을 넘어 옆 칸과 붙던 문제와 Pacifico 소문자의 높이 편차가
    // 함께 해결된다.
    const probe = font.getPath(displayText, 0, 0, PROBE_SIZE).getBoundingBox();
    const probeW = probe.x2 - probe.x1;
    const probeH = probe.y2 - probe.y1;
    const longest = Math.max(probeW, probeH);
    const fontSize = longest > 0 ? PROBE_SIZE * (E / longest) : E;

    // 잰 크기로 다시 그려서 잉크 중심을 (cx, cy) 에 맞춘다.
    const bbox = font.getPath(displayText, 0, 0, fontSize).getBoundingBox();
    const dx = cx - (bbox.x1 + bbox.x2) / 2;
    const dy = cy - (bbox.y1 + bbox.y2) / 2;
    const placed = font.getPath(displayText, dx, dy, fontSize);
    const fillEsc = fgFill.replace(/"/g, "&quot;");
    return `<path d="${placed.toPathData(2)}" fill="${fillEsc}"/>`;
  };
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
