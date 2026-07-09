import { loadExportFonts } from "./fonts";
import { LOGO_SYMBOLS, SYMBOL_MAP } from "./logo-symbols";
import { isLightHex } from "./color-utils";
import { renderTextSlot, makePathTextRenderer, type TextRenderer } from "./text-render";

export { LOGO_SYMBOLS, SYMBOL_MAP } from "./logo-symbols";
export { isLightHex, autoGradientEnd } from "./color-utils";
export type { TextRenderer } from "./text-render";
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

export function isSlotFilled(s: Slot): boolean {
  if (s.kind === "char") return !!s.value;
  const sym = SYMBOL_MAP.get(s.value);
  return !!sym && s.value !== "none" && !!(sym.d || sym.isRing);
}

function renderSymbolSlot(symbolId: string, cx: number, cy: number, E: number, fgFill: string, ringInner: string, userRotate = 0, userScale = 1): string {
  const sym = SYMBOL_MAP.get(symbolId);
  if (!sym || symbolId === "none" || (!sym.d && !sym.isRing)) return "";
  const sE = E * userScale;
  if (sym.isRing) {
    return `<circle cx="${cx.toFixed(1)}" cy="${cy}" r="${(sE*0.50).toFixed(1)}" fill="${fgFill}"/><circle cx="${cx.toFixed(1)}" cy="${cy}" r="${(sE*0.29).toFixed(1)}" fill="${ringInner}"/>`;
  }
  const vb = sym.vb ?? 100;
  const sc = sE / vb;
  const tx = cx - (vb/2)*sc, ty = cy - (vb/2)*sc;
  const fr = sym.fillRule ? ` fill-rule="${sym.fillRule}"` : "";
  const totalRot = (sym.rotate ?? 0) + userRotate;
  const rot = totalRot !== 0 ? ` transform="rotate(${totalRot}, ${(vb/2)}, ${(vb/2)})"` : "";
  const pathAttrs = sym.stroke
    ? `fill="none" stroke="${fgFill}" stroke-width="${sym.strokeWidth ?? 2}" stroke-linecap="round" stroke-linejoin="round"`
    : `fill="${fgFill}"${fr}`;
  const dList = Array.isArray(sym.d) ? sym.d : [sym.d as string];
  const paths = dList.map((d) => `<path d="${d}" ${pathAttrs}${rot}/>`).join("");
  return `<g transform="translate(${tx.toFixed(1)},${ty.toFixed(1)}) scale(${sc.toFixed(4)})">${paths}</g>`;
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
  rot: number, sc: number, textRenderer: TextRenderer,
): string {
  const inner = slot.kind === "char"
    ? textRenderer(slot.value, cx, cy, E, fgFill)
    : renderSymbolSlot(slot.value, cx, cy, E, fgFill, ringInner, rot, sc);
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
  options?: { textRenderer?: TextRenderer; embedFonts?: boolean; frontRotate?: number; backRotate?: number; frontScale?: number; backScale?: number; shadow?: number; uid?: string },
): string {
  const r = Math.round(size * radius);
  const tColor = textColorOverride ?? (isLightHex(bg) ? "#09090b" : "#ffffff");
  const cy = size / 2;
  const E = size * 0.30;
  const gap = size * 0.06;

  // Fall back to "A" if nothing filled.
  const slots: { slot: Slot; rotate: number; scale: number }[] = [];
  if (isSlotFilled(front)) slots.push({ slot: front, rotate: options?.frontRotate ?? 0, scale: options?.frontScale ?? 1 });
  if (isSlotFilled(back)) slots.push({ slot: back, rotate: options?.backRotate ?? 0, scale: options?.backScale ?? 1 });
  if (slots.length === 0) slots.push({ slot: { kind: "char", value: "A" }, rotate: 0, scale: 1 });

  const slotCount = slots.length;
  const groupW = slotCount === 2 ? E + gap + E : E;
  const groupLeft = (size - groupW) / 2;
  const cxs = slots.map((_, i) => groupLeft + E / 2 + i * (E + gap));

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
    .map(({ slot, rotate: rot, scale: sc }, i) => renderSlotElement(slot, cxs[i], cy, E, fgFill, ringInner, rot, sc, textRenderer))
    .join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    defsEl,
    `<rect width="${size}" height="${size}" rx="${r}" fill="${bgFill}"/>`,
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
  tweaks?: { frontRotate?: number; backRotate?: number; frontScale?: number; backScale?: number; shadow?: number },
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
  tweaks?: { frontRotate?: number; backRotate?: number; frontScale?: number; backScale?: number; shadow?: number },
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
