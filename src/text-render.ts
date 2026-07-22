import type { LoadedFonts } from "./fonts";

export type TextRenderer = (text: string, cx: number, cy: number, E: number, fgFill: string) => string;

/**
 * Convert a text slot to a vector <path> using opentype.js — used at download
 * time so the SVG renders identically without web-font availability.
 */
export function makePathTextRenderer(fonts: LoadedFonts): TextRenderer {
  return (text, cx, cy, E, fgFill) => {
    const displayText = (text || "A").slice(0, 3);
    const script = classifyScript(displayText);
    const fontSize = textSlotFontSize(script, displayText.length, E);
    const font = script === "lower" ? fonts.pacifico : fonts.pretendard;
    // Render at origin to measure bounding box, then offset so visual center
    // lands at (cx, cy) — matches text-anchor=middle + dominant-baseline=central
    // and naturally fixes Pacifico's per-letter ascender quirks (no manual offset needed).
    const measure = font.getPath(displayText, 0, 0, fontSize);
    const bbox = measure.getBoundingBox();
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
