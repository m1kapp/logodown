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
 * 배치 규격 — 캔버스 한 변 대비 비율.
 *
 * `height` 는 모든 슬롯이 공유하는 기준 높이(캡 하이트). 폭은 슬롯마다 다르다.
 * `maxGroup` 은 Android 적응형 아이콘의 세이프존(108dp 중 72dp = 66%) 과 같은
 * 값이라, 그룹이 이 폭을 넘지 않는 한 어떤 마스크에도 잘리지 않는다.
 */
export const LAYOUT = { height: 0.30, gap: 0.06, maxGroup: 0.66 } as const;

/** 잉크 가로세로비(w/h). 표에 없거나 링이면 1. */
function symbolAspect(id: string): number {
  const sym = SYMBOL_MAP.get(id);
  if (!sym || sym.isRing) return 1;
  const ink = SYMBOL_INK[id];
  if (!ink) return 1;
  const h = ink[3] - ink[1];
  return h > 0 ? (ink[2] - ink[0]) / h : 1;
}

function slotAspect(slot: Slot, textRenderer?: TextRenderer): number {
  if (slot.kind === "symbol") return symbolAspect(slot.value);
  const m = textRenderer?.measure?.(slot.value);
  return m && m.h > 0 ? m.w / m.h : 1;
}

export type SlotBox = { cx: number; cy: number; w: number; h: number };

/**
 * 슬롯 배치. 고정 격자가 아니라 **각 슬롯의 실제 잉크 폭**으로 자리를 잡는다.
 *
 * 모든 슬롯을 같은 높이에 맞추고 폭은 각자 다르게 둔 뒤, 그룹이 세이프존을
 * 넘으면 전체를 같은 비율로 줄인다. 고정 격자에서는 "59" 처럼 가로로 긴 글자를
 * 칸에 가두느라 높이를 0.59배로 깎아야 했는데(옆 칸 심볼과 눈에 띄게 어긋남),
 * 이렇게 하면 높이는 항상 같고 충돌도 생기지 않는다.
 *
 * 렌더와 가이드 오버레이가 같은 값을 쓰도록 여기 한 곳에서만 계산한다.
 * `textRenderer.measure` 가 없으면(폰트 로드 전 <text> 폴백) 모든 글자를
 * 정사각으로 가정한다.
 */
export function layoutSlots(
  size: number,
  slots: { slot: Slot; scale: number }[],
  textRenderer?: TextRenderer,
): { boxes: SlotBox[]; height: number; gap: number; groupW: number; cy: number } {
  const cy = size / 2;
  const baseH = size * LAYOUT.height;
  const gap = size * LAYOUT.gap;

  const raw = slots.map(({ slot, scale }) => {
    const h = baseH * scale;
    return { h, w: h * slotAspect(slot, textRenderer) };
  });

  const natural = raw.reduce((a, r) => a + r.w, 0) + gap * Math.max(raw.length - 1, 0);
  const k = natural > size * LAYOUT.maxGroup ? (size * LAYOUT.maxGroup) / natural : 1;

  const groupW = natural * k;
  let x = (size - groupW) / 2;
  const boxes: SlotBox[] = raw.map((r) => {
    const w = r.w * k, h = r.h * k;
    const box = { cx: x + w / 2, cy, w, h };
    x += w + gap * k;
    return box;
  });

  return { boxes, height: baseH * k, gap: gap * k, groupW, cy };
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

function renderSymbolSlot(symbolId: string, cx: number, cy: number, H: number, fgFill: string, ringInner: string, userRotate = 0, strokeK: number = STROKE_WEIGHTS.regular): string {
  const sym = SYMBOL_MAP.get(symbolId);
  if (!sym || symbolId === "none" || (!sym.d && !sym.isRing)) return "";
  if (sym.isRing) {
    return `<circle cx="${cx.toFixed(1)}" cy="${cy}" r="${(H*0.50).toFixed(1)}" fill="${fgFill}"/><circle cx="${cx.toFixed(1)}" cy="${cy}" r="${(H*0.29).toFixed(1)}" fill="${ringInner}"/>`;
  }
  const vb = sym.vb ?? 100;
  // viewBox 가 아니라 실제 잉크 bbox 의 높이를 기준 높이 H 에 맞춘다 — 그리드
  // 여백이 심볼마다 달라서(lucide 2px, flame 세로 17/24) viewBox 기준으로 맞추면
  // 글자 옆에 놓았을 때 크기가 제각각으로 보인다. 표는 `npm run bbox` 로 생성.
  const [ix0, iy0, ix1, iy1] = SYMBOL_INK[symbolId] ?? [0, 0, 1, 1];
  const inkH = (iy1 - iy0) * vb;
  const sc = H / inkH;
  const tx = cx - ((ix0 + ix1) / 2) * vb * sc;
  const ty = cy - ((iy0 + iy1) / 2) * vb * sc;
  const fr = sym.fillRule ? ` fill-rule="${sym.fillRule}"` : "";
  // 선폭은 심볼 원본 값이 아니라 기준 높이로 환산 — 배율(sc)로 나눠서
  // 최종 렌더 결과가 어떤 심볼이든 같은 굵기가 되게 한다.
  const pathAttrs = sym.stroke
    ? `fill="none" stroke="${fgFill}" stroke-width="${(H * strokeK / sc).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"`
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

/**
 * 슬롯 하나를 그린다. 크기는 layoutSlots 가 정한 박스 높이로 이미 결정돼 있고,
 * 회전만 여기서 처리한다(심볼은 renderSymbolSlot 이 자체 회전을 합산).
 */
function renderSlotElement(
  slot: Slot, box: SlotBox, fgFill: string, ringInner: string,
  rot: number, textRenderer: TextRenderer, strokeK: number,
): string {
  if (slot.kind !== "char") {
    return renderSymbolSlot(slot.value, box.cx, box.cy, box.h, fgFill, ringInner, rot, strokeK);
  }
  const inner = textRenderer(slot.value, box.cx, box.cy, box.h, fgFill);
  return rot === 0
    ? inner
    : `<g transform="rotate(${rot}, ${box.cx.toFixed(1)}, ${box.cy.toFixed(1)})">${inner}</g>`;
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

  const textRenderer = options?.textRenderer ?? renderTextSlot;
  const { boxes } = layoutSlots(size, slots, textRenderer);

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
    .map(({ slot, rotate: rot }, i) => renderSlotElement(slot, boxes[i], fgFill, ringInner, rot, textRenderer, options?.strokeK ?? STROKE_WEIGHTS.regular))
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
