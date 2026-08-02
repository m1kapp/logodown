import { loadExportFonts } from "./fonts";
import { LOGO_SYMBOLS, SYMBOL_MAP } from "./logo-symbols";
import { isLightHex } from "./color-utils";
import { renderTextSlot, makePathTextRenderer, type TextRenderer } from "./text-render";
import { SYMBOL_INK } from "./symbols/ink.generated";

export { LOGO_SYMBOLS, SYMBOL_MAP } from "./logo-symbols";
export { isLightHex, autoGradientEnd } from "./color-utils";
export type { TextRenderer } from "./text-render";
export { makePathTextRenderer } from "./text-render";
export { loadExportFonts, type LoadedFonts } from "./fonts";
export { downloadSvg, downloadPng } from "./svg-export";

/* ══════════════════════════════════════════════
   Logo SVG string builder
══════════════════════════════════════════════ */

const SHADOW_PARAMS = [
  null,
  { dxR: 0.004, dyR: 0.008, blurR: 0.016, opacity: 0.20 },
  { dxR: 0.008, dyR: 0.014, blurR: 0.028, opacity: 0.30 },
  { dxR: 0.012, dyR: 0.020, blurR: 0.040, opacity: 0.40 },
] as const;

export type SlotKind = "char" | "symbol";
export type Slot = { kind: SlotKind; value: string };

/**
 * 슬롯 배치 규격 — 캔버스 한 변 대비 비율.
 *
 * 2슬롯 그룹 폭 = slot + gap + slot = 0.66. Android 적응형 아이콘의 세이프존
 * (108dp 중 72dp = 66%) 과 같은 값이라 어떤 마스크에도 잘리지 않는다.
 */
export const LAYOUT = { slot: 0.30, gap: 0.06 } as const;

/** 슬롯 중심 좌표와 크기. 렌더와 가이드 오버레이가 같은 값을 쓰도록 여기 한 곳에서만 계산한다. */
export function slotLayout(size: number, slotCount: number) {
  const E = size * LAYOUT.slot;
  const gap = size * LAYOUT.gap;
  const groupW = slotCount === 2 ? E + gap + E : E;
  const left = (size - groupW) / 2;
  return {
    E, gap, groupW, cy: size / 2,
    cxs: Array.from({ length: slotCount }, (_, i) => left + E / 2 + i * (E + gap)),
  };
}

export function isSlotFilled(s: Slot): boolean {
  if (s.kind === "char") return !!s.value;
  const sym = SYMBOL_MAP.get(s.value);
  return !!sym && s.value !== "none" && !!(sym.d || sym.isRing);
}

/**
 * stroke 심볼의 선 굵기 — 슬롯 크기 대비 비율.
 *
 * 심볼 원본의 `stroke-width` 를 그대로 쓰면 잉크 fit 배율이 심볼마다 달라서
 * 실효 선폭이 0.090~0.111 (1.23배) 로 벌어진다. 여기서 하나로 고정한다.
 * `regular` 가 기존 중앙값이라 기본값을 바꿔도 대부분 심볼은 그대로 보인다.
 */
export const STROKE_WEIGHTS = {
  thin: 0.055,
  light: 0.07,
  regular: 0.09,
  bold: 0.115,
} as const;
export type StrokeWeight = keyof typeof STROKE_WEIGHTS;

function renderSymbolSlot(symbolId: string, cx: number, cy: number, E: number, fgFill: string, ringInner: string, userRotate = 0, userScale = 1, strokeK: number = STROKE_WEIGHTS.regular): string {
  const sym = SYMBOL_MAP.get(symbolId);
  if (!sym || symbolId === "none" || (!sym.d && !sym.isRing)) return "";
  const sE = E * userScale;
  if (sym.isRing) {
    return `<circle cx="${cx.toFixed(1)}" cy="${cy}" r="${(sE*0.50).toFixed(1)}" fill="${fgFill}"/><circle cx="${cx.toFixed(1)}" cy="${cy}" r="${(sE*0.29).toFixed(1)}" fill="${ringInner}"/>`;
  }
  const vb = sym.vb ?? 100;
  // viewBox 가 아니라 실제 잉크 bbox 를 슬롯 박스에 맞춘다 — 그리드 여백이
  // 심볼마다 달라서(lucide 2px, flame 세로 17/24) viewBox 기준으로 맞추면
  // 글자 옆에 놓았을 때 크기가 제각각으로 보인다. 표는 `npm run bbox` 로 생성.
  const [ix0, iy0, ix1, iy1] = SYMBOL_INK[symbolId] ?? [0, 0, 1, 1];
  const inkW = (ix1 - ix0) * vb, inkH = (iy1 - iy0) * vb;
  const sc = sE / Math.max(inkW, inkH);
  const tx = cx - ((ix0 + ix1) / 2) * vb * sc;
  const ty = cy - ((iy0 + iy1) / 2) * vb * sc;
  const fr = sym.fillRule ? ` fill-rule="${sym.fillRule}"` : "";
  // 선폭은 심볼 원본 값이 아니라 슬롯 크기 기준으로 환산 — 배율(sc)로 나눠서
  // 최종 렌더 결과가 어떤 심볼이든 같은 굵기가 되게 한다.
  const pathAttrs = sym.stroke
    ? `fill="none" stroke="${fgFill}" stroke-width="${(sE * strokeK / sc).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"`
    : `fill="${fgFill}"${fr}`;
  const dList = Array.isArray(sym.d) ? sym.d : [sym.d as string];
  const paths = dList.map((d) => `<path d="${d}" ${pathAttrs}/>`).join("");
  // 회전은 잉크 중심(=슬롯 중심)을 축으로 바깥에서 건다. path 안에서 viewBox
  // 중심을 축으로 돌리면 잉크가 치우친 심볼이 회전 시 밀려난다.
  const totalRot = (sym.rotate ?? 0) + userRotate;
  const rotWrap = totalRot !== 0 ? `rotate(${totalRot}, ${cx.toFixed(1)}, ${cy}) ` : "";
  return `<g transform="${rotWrap}translate(${tx.toFixed(1)},${ty.toFixed(1)}) scale(${sc.toFixed(4)})">${paths}</g>`;
}

function buildFontImportsBlock(charSlots: { slot: Slot }[], embed: boolean): string {
  if (!embed) return "";
  const needsPacifico = charSlots.some((s) => /^[a-z]+$/.test(s.slot.value as string));
  const needsPretendard = charSlots.some((s) => /[가-힣]/.test(s.slot.value as string));
  return [
    needsPacifico ? `<style>@import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');</style>` : "",
    needsPretendard ? `<style>@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css');</style>` : "",
  ].filter(Boolean).join("");
}

function buildDefsBlock(opts: {
  fontImports: string; uid: string; size: number;
  bg: string; gradientEnd?: string; tColor: string; textGradientEnd?: string; shadowLevel: number;
}): { defsEl: string; shadowCfg: { dx: number; dy: number; blur: number; opacity: number } | null } {
  const { fontImports, uid, size, bg, gradientEnd, tColor, textGradientEnd, shadowLevel } = opts;
  const sp = SHADOW_PARAMS[shadowLevel];
  const shadowCfg = sp ? { dx: size * sp.dxR, dy: size * sp.dyR, blur: size * sp.blurR, opacity: sp.opacity } : null;
  const defsInner = [
    fontImports,
    gradientEnd ? `<linearGradient id="lg${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg}"/><stop offset="100%" stop-color="${gradientEnd}"/></linearGradient>` : "",
    textGradientEnd ? `<linearGradient id="tg${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${tColor}"/><stop offset="100%" stop-color="${textGradientEnd}"/></linearGradient>` : "",
    shadowCfg ? `<filter id="ds${uid}"><feDropShadow dx="${shadowCfg.dx.toFixed(1)}" dy="${shadowCfg.dy.toFixed(1)}" stdDeviation="${shadowCfg.blur.toFixed(1)}" flood-opacity="${shadowCfg.opacity}"/></filter>` : "",
  ].filter(Boolean).join("");
  return { defsEl: defsInner ? `<defs>${defsInner}</defs>` : "", shadowCfg };
}

/** char 슬롯의 회전/스케일은 <g transform>으로 감싸고, symbol 슬롯은 renderSymbolSlot이 자체 처리 */
function renderSlotElement(
  slot: Slot, cx: number, cy: number, E: number, fgFill: string, ringInner: string,
  rot: number, sc: number, textRenderer: TextRenderer, strokeK: number,
): string {
  const inner = slot.kind === "char"
    ? textRenderer(slot.value, cx, cy, E, fgFill)
    : renderSymbolSlot(slot.value, cx, cy, E, fgFill, ringInner, rot, sc, strokeK);
  if (slot.kind !== "char" || (rot === 0 && sc === 1)) return inner;
  const transforms: string[] = [];
  if (rot !== 0) transforms.push(`rotate(${rot}, ${cx.toFixed(1)}, ${cy.toFixed(1)})`);
  if (sc !== 1) transforms.push(`translate(${cx.toFixed(1)}, ${cy.toFixed(1)}) scale(${sc}) translate(${(-cx).toFixed(1)}, ${(-cy).toFixed(1)})`);
  return `<g transform="${transforms.join(" ")}">${inner}</g>`;
}

export function buildLogoSvgStr(
  front: Slot,
  back: Slot,
  bg: string,
  radius: number,
  size = 200,
  gradientEnd?: string,
  textColorOverride?: string,
  textGradientEnd?: string,
  options?: { textRenderer?: TextRenderer; embedFonts?: boolean; frontRotate?: number; backRotate?: number; frontScale?: number; backScale?: number; shadow?: number; uid?: string; frame?: string; strokeK?: number },
): string {
  const r = Math.round(size * radius);
  const tColor = textColorOverride ?? (isLightHex(bg) ? "#09090b" : "#ffffff");
  // Fall back to "A" if nothing filled.
  const slots: { slot: Slot; rotate: number; scale: number }[] = [];
  if (isSlotFilled(front)) slots.push({ slot: front, rotate: options?.frontRotate ?? 0, scale: options?.frontScale ?? 1 });
  if (isSlotFilled(back)) slots.push({ slot: back, rotate: options?.backRotate ?? 0, scale: options?.backScale ?? 1 });
  if (slots.length === 0) slots.push({ slot: { kind: "char", value: "A" }, rotate: 0, scale: 1 });

  const { E, cy, cxs } = slotLayout(size, slots.length);

  const textRenderer = options?.textRenderer ?? renderTextSlot;
  const embedFontImports = options?.embedFonts ?? !options?.textRenderer;
  const charSlots = slots.filter((s) => s.slot.kind === "char");
  const fontImports = buildFontImportsBlock(charSlots, embedFontImports);

  const uid = options?.uid ?? Math.random().toString(36).slice(2, 8);
  const { defsEl, shadowCfg } = buildDefsBlock({
    fontImports, uid, size, bg, gradientEnd, tColor, textGradientEnd, shadowLevel: options?.shadow ?? 0,
  });
  const bgFill = gradientEnd ? `url(#lg${uid})` : bg;
  const fgFill = textGradientEnd ? `url(#tg${uid})` : tColor;
  const ringInner = gradientEnd ?? bg;

  const slotElements = slots
    .map(({ slot, rotate: rot, scale: sc }, i) => renderSlotElement(slot, cxs[i], cy, E, fgFill, ringInner, rot, sc, textRenderer, options?.strokeK ?? STROKE_WEIGHTS.regular))
    .join("");

  // 아웃라인 스타일: 배경 대신 둥근 사각 테두리. 선이 잘리지 않게 선폭의 절반만큼 안으로 넣는다.
  const frameW = size * 0.05;
  const frameInset = frameW / 2;
  const frameEl = options?.frame
    ? `<rect x="${frameInset}" y="${frameInset}" width="${size - frameW}" height="${size - frameW}" rx="${Math.max(r - frameInset, 0)}" fill="none" stroke="${options.frame}" stroke-width="${frameW}"/>`
    : "";

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    defsEl,
    `<rect width="${size}" height="${size}" rx="${r}" fill="${bgFill}"/>`,
    frameEl,
    shadowCfg ? `<g filter="url(#ds${uid})">${slotElements}</g>` : slotElements,
    `</svg>`,
  ].join("");
}

/** Async build: fetches fonts, converts text → path. Use for downloads. */
export async function buildLogoSvgStrForExport(
  front: Slot,
  back: Slot,
  bg: string,
  radius: number,
  size = 512,
  gradientEnd?: string,
  textColorOverride?: string,
  textGradientEnd?: string,
  tweaks?: { frontRotate?: number; backRotate?: number; frontScale?: number; backScale?: number; shadow?: number; frame?: string; strokeK?: number },
): Promise<string> {
  const fonts = await loadExportFonts();
  const renderer = makePathTextRenderer(fonts);
  return buildLogoSvgStr(
    front, back, bg, radius, size,
    gradientEnd, textColorOverride, textGradientEnd,
    { textRenderer: renderer, embedFonts: false, ...tweaks },
  );
}

/** Maskable variant: full-bleed (radius 0, no border) for Android adaptive icons. */
export async function buildLogoSvgStrForMaskable(
  front: Slot,
  back: Slot,
  bg: string,
  size = 512,
  gradientEnd?: string,
  textColorOverride?: string,
  textGradientEnd?: string,
  tweaks?: { frontRotate?: number; backRotate?: number; frontScale?: number; backScale?: number; shadow?: number; frame?: string; strokeK?: number },
): Promise<string> {
  const fonts = await loadExportFonts();
  const renderer = makePathTextRenderer(fonts);
  // radius 0 + we strip the border in post-processing (regex) so the canvas
  // padding controls the safe area, not a baked-in stroke.
  const svg = buildLogoSvgStr(
    front, back, bg, 0, size,
    gradientEnd, textColorOverride, textGradientEnd,
    { textRenderer: renderer, embedFonts: false, ...tweaks },
  );
  return svg;
}
