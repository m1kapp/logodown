import { useEffect, useMemo, useState } from "react";
import {
  Watermark,
  AppShell, AppShellHeader, AppShellContent,
  TabBar, Tab,
  Section,
  Tooltip, Badge, Button, ShareButton,
  useToast,
} from "@m1kapp/kit";
import { LUCIDE_SYMBOLS } from "./symbols/lucide";
import { CUSTOM_SYMBOLS } from "./symbols/custom";
import { loadExportFonts, type LoadedFonts } from "./fonts";
import { buildSeoPack, type SeoPackCategory } from "./seo-pack";

/* ══════════════════════════════════════════════
   Symbols
══════════════════════════════════════════════ */
const ARROW_D = "M30 5 L70 5 L70 52 L95 52 L50 95 L5 52 L30 52 Z";
const LOGO_SYMBOLS: Array<{ id: string; label: string; d?: string | string[]; vb?: number; isRing?: boolean; fillRule?: string; rotate?: number; stroke?: boolean; strokeWidth?: number }> = [
  { id: "none",       label: "—" },
  // ── 화살표 8방향
  { id: "down",       label: "↓",  vb: 100, d: ARROW_D },
  { id: "up",         label: "↑",  vb: 100, d: ARROW_D, rotate: 180 },
  { id: "right",      label: "→",  vb: 100, d: ARROW_D, rotate: 90 },
  { id: "left",       label: "←",  vb: 100, d: ARROW_D, rotate: 270 },
  { id: "down-right", label: "↘",  vb: 100, d: ARROW_D, rotate: 45 },
  { id: "down-left",  label: "↙",  vb: 100, d: ARROW_D, rotate: 315 },
  { id: "up-right",   label: "↗",  vb: 100, d: ARROW_D, rotate: 225 },
  { id: "up-left",    label: "↖",  vb: 100, d: ARROW_D, rotate: 135 },
  // ⚡
  { id: "zap",      label: "⚡", vb: 100, d: "M57 8 L12 62 L52 62 L48 96 L92 42 L52 42 Z" },
  { id: "zap2",     label: "⚡", vb: 100, d: "M43 8 L88 62 L48 62 L52 96 L8 42 L48 42 Z" },
  { id: "zap3",     label: "⚡", vb: 100, d: "M25 8 L0 62 L22 62 L20 96 L46 42 L22 42 Z M81 8 L54 62 L78 62 L76 96 L99 42 L78 42 Z" },
  // ── 별 패밀리
  { id: "star4thin", label: "✦4t", vb: 100, d: "M50 5 L55 45 L95 50 L55 55 L50 95 L45 55 L5 50 L45 45Z" },
  { id: "star4",     label: "✦4",  vb: 100, d: "M50 5 L64 36 L95 50 L64 64 L50 95 L36 64 L5 50 L36 36Z" },
  { id: "star5thin", label: "★t",  vb: 100, d: "M50 5 L59 38 L93 36 L64 55 L77 86 L50 65 L24 86 L36 55 L7 36 L41 38Z" },
  { id: "star",      label: "★",   vb: 100, d: "M50 2 L63 32 L96 35 L71 57 L78 89 L50 72 L22 89 L29 57 L4 35 L37 32 Z" },
  { id: "star5fat",  label: "★f",  vb: 100, d: "M50 5 L71 22 L93 36 L83 61 L77 86 L50 85 L24 86 L17 61 L7 36 L29 22Z" },
  { id: "star6",     label: "✡",   vb: 100, d: "M50 5 L63 28 L89 28 L76 50 L89 73 L63 73 L50 95 L37 73 L11 73 L24 50 L11 28 L37 28Z" },
  { id: "star8",     label: "✴",   vb: 100, d: "M50 5 L58 30 L82 18 L70 42 L95 50 L70 58 L82 82 L58 70 L50 95 L42 70 L18 82 L30 58 L5 50 L30 42 L18 18 L42 30Z" },
  { id: "triangle",  label: "▲",  vb: 100, d: "M50 5 L95 95 L5 95 Z" },
  { id: "diamond",   label: "◆",  vb: 100, d: "M50 2 L98 50 L50 98 L2 50 Z" },
  { id: "plus",      label: "+",  vb: 100, d: "M35 5 L65 5 L65 35 L95 35 L95 65 L65 65 L65 95 L35 95 L35 65 L5 65 L5 35 L35 35 Z" },
  { id: "cross",     label: "×",  vb: 100, d: "M15 5 L50 40 L85 5 L95 15 L60 50 L95 85 L85 95 L50 60 L15 95 L5 85 L40 50 L5 15 Z" },
  { id: "circle",    label: "○",  isRing: true },
  { id: "check",     label: "✓",  vb: 100, d: "M5 55 L20 40 L40 60 L78 18 L95 32 L40 90 Z" },
  { id: "slash",     label: "/",  vb: 100, d: "M22 97 L5 80 L78 3 L95 20 Z" },
  { id: "sparkle",   label: "✦",  vb: 100, d: "M50 5 L59 41 L95 50 L59 59 L50 95 L41 59 L5 50 L41 41 Z" },
  { id: "wave",      label: "~",  vb: 100, d: "M5 50 L25 8 L50 50 L75 8 L95 50 L95 68 L75 26 L50 68 L25 26 L5 68 Z" },
  // ── 브랜드 영감 (24×24)
  { id: "drawio",      label: "◇",   vb: 24, d: "M19.69 13.419h-2.527l-2.667-4.555a1.292 1.292 0 001.035-1.28V4.16c0-.725-.576-1.312-1.302-1.312H9.771c-.726 0-1.312.576-1.312 1.301v3.435c0 .619.426 1.152 1.034 1.28l-2.666 4.555H4.309c-.725 0-1.312.576-1.312 1.301v3.435c0 .725.576 1.312 1.302 1.312h4.458c.726 0 1.312-.576 1.312-1.302v-3.434c0-.726-.576-1.312-1.301-1.312h-.437l2.645-4.523h2.059l2.656 4.523h-.438c-.725 0-1.312.576-1.312 1.301v3.435c0 .725.576 1.312 1.302 1.312H19.7c.726 0 1.312-.576 1.312-1.302v-3.434c0-.726-.576-1.312-1.301-1.312z" },
  { id: "bars",        label: "▐",   vb: 24, d: "M6.399 12.8v4.8H19.2v1.6H4.799V0H0v24h24V12.8H6.399Zm4.801-8H6.399v6.4H11.2V4.8Zm6.4 0h-4.8v6.4h4.8V4.8ZM24 0h-4.8v11.2H24V0Z" },
  { id: "layers",      label: "◈",   vb: 24, d: "M10.501 11.724.631 7.16c-.841-.399-.841-1.014 0-1.376l9.87-4.563c.841-.399 2.194-.399 2.998 0l9.87 4.563c.841.398.841 1.014 0 1.376l-9.87 4.563c-.841.362-2.194.362-2.998 0zm0 5.468-9.87-4.563c-.841-.399-.841-1.014 0-1.376l3.363-1.558 6.507 3.006c.841.398 2.194.398 2.998 0l6.507-3.006 3.363 1.558c.841.398.841 1.014 0 1.376l-9.87 4.563c-.841.398-2.194.398-2.998 0zm0 5.613-9.87-4.563c-.841-.398-.841-1.014 0-1.376l3.436-1.593 6.398 2.97c.84.398 2.193.398 2.997 0l6.398-2.97 3.436 1.593c.841.399.841 1.014 0 1.376l-9.87 4.563c-.768.362-2.12.362-2.925 0z" },
  // ── 커스텀 (24×24)
  { id: "flow",   label: "flow",  vb: 24, d: "M0 24 L0 16 L8 16 L8 8 L16 8 L16 0 L24 0 L24 24Z" },
  { id: "wave2",  label: "wave2", vb: 24, d: "M0 5 C8 -1 16 11 24 5 L24 9 C16 15 8 3 0 9Z M0 14 C8 8 16 20 24 14 L24 18 C16 24 8 12 0 18Z" },
  { id: "hex",    label: "hex",   vb: 24, d: "M22 12 L17 21 L7 21 L2 12 L7 3 L17 3Z" },
  { id: "dbox",   label: "dbox",  vb: 24, d: "M6 1 L11 6 L6 11 L1 6Z M18 1 L23 6 L18 11 L13 6Z M6 13 L11 18 L6 23 L1 18Z M18 13 L23 18 L18 23 L13 18Z" },
  { id: "flame",  label: "flame", vb: 24, d: "M12 1 C6 5 3 11 4 17 C5 22 8 24 12 24 C16 24 19 22 20 17 C21 11 18 5 12 1Z" },
  // ── 점 링 패밀리
  { id: "dots4", label: "dots4", vb: 100, d: "M38 12A12 12 0 1 0 62 12A12 12 0 1 0 38 12Z M76 50A12 12 0 1 0 100 50A12 12 0 1 0 76 50Z M38 88A12 12 0 1 0 62 88A12 12 0 1 0 38 88Z M0 50A12 12 0 1 0 24 50A12 12 0 1 0 0 50Z" },
  { id: "dots5", label: "dots5", vb: 100, d: "M40 12A10 10 0 1 0 60 12A10 10 0 1 0 40 12Z M76 38A10 10 0 1 0 96 38A10 10 0 1 0 76 38Z M62 81A10 10 0 1 0 82 81A10 10 0 1 0 62 81Z M18 81A10 10 0 1 0 38 81A10 10 0 1 0 18 81Z M4 38A10 10 0 1 0 24 38A10 10 0 1 0 4 38Z" },
  { id: "dots6", label: "dots6", vb: 100, d: "M40 12A10 10 0 1 0 60 12A10 10 0 1 0 40 12Z M73 31A10 10 0 1 0 93 31A10 10 0 1 0 73 31Z M73 69A10 10 0 1 0 93 69A10 10 0 1 0 73 69Z M40 88A10 10 0 1 0 60 88A10 10 0 1 0 40 88Z M7 69A10 10 0 1 0 27 69A10 10 0 1 0 7 69Z M7 31A10 10 0 1 0 27 31A10 10 0 1 0 7 31Z" },
  { id: "dots7", label: "dots7", vb: 100, d: "M40 12A10 10 0 1 0 60 12A10 10 0 1 0 40 12Z M70 26A10 10 0 1 0 90 26A10 10 0 1 0 70 26Z M77 59A10 10 0 1 0 97 59A10 10 0 1 0 77 59Z M57 84A10 10 0 1 0 77 84A10 10 0 1 0 57 84Z M24 84A10 10 0 1 0 44 84A10 10 0 1 0 24 84Z M3 59A10 10 0 1 0 23 59A10 10 0 1 0 3 59Z M10 26A10 10 0 1 0 30 26A10 10 0 1 0 10 26Z" },
  { id: "dots8", label: "dots8", vb: 100, d: "M40 12A10 10 0 1 0 60 12A10 10 0 1 0 40 12Z M67 23A10 10 0 1 0 87 23A10 10 0 1 0 67 23Z M78 50A10 10 0 1 0 98 50A10 10 0 1 0 78 50Z M67 77A10 10 0 1 0 87 77A10 10 0 1 0 67 77Z M40 88A10 10 0 1 0 60 88A10 10 0 1 0 40 88Z M13 77A10 10 0 1 0 33 77A10 10 0 1 0 13 77Z M2 50A10 10 0 1 0 22 50A10 10 0 1 0 2 50Z M13 23A10 10 0 1 0 33 23A10 10 0 1 0 13 23Z" },
  { id: "dots9", label: "dots9", vb: 100, d: "M42 12A8 8 0 1 0 58 12A8 8 0 1 0 42 12Z M66 21A8 8 0 1 0 82 21A8 8 0 1 0 66 21Z M79 43A8 8 0 1 0 95 43A8 8 0 1 0 79 43Z M75 69A8 8 0 1 0 91 69A8 8 0 1 0 75 69Z M55 86A8 8 0 1 0 71 86A8 8 0 1 0 55 86Z M29 86A8 8 0 1 0 45 86A8 8 0 1 0 29 86Z M9 69A8 8 0 1 0 25 69A8 8 0 1 0 9 69Z M5 43A8 8 0 1 0 21 43A8 8 0 1 0 5 43Z M18 21A8 8 0 1 0 34 21A8 8 0 1 0 18 21Z" },
  // ── 별 링 패밀리
  { id: "starring5", label: "sr5", vb: 100, d: "M50 5 L52 13 60 15 52 17 50 25 48 17 40 15 48 13 Z M83 29 L85 37 93 39 85 41 83 49 81 41 73 39 81 37 Z M71 68 L73 76 81 78 73 80 71 88 69 80 61 78 69 76 Z M29 68 L31 76 39 78 31 80 29 88 27 80 19 78 27 76 Z M17 29 L19 37 27 39 19 41 17 49 15 41 7 39 15 37 Z" },
  { id: "starring6", label: "sr6", vb: 100, d: "M50 5 L52 13 60 15 52 17 50 25 48 17 40 15 48 13 Z M80 23 L82 31 90 33 82 35 80 43 78 35 70 33 78 31 Z M80 58 L82 66 90 68 82 70 80 78 78 70 70 68 78 66 Z M50 75 L52 83 60 85 52 87 50 95 48 87 40 85 48 83 Z M20 58 L22 66 30 68 22 70 20 78 18 70 10 68 18 66 Z M20 23 L22 31 30 33 22 35 20 43 18 35 10 33 18 31 Z" },
  { id: "starring8", label: "sr8", vb: 100, d: "M50 5 L52 13 60 15 52 17 50 25 48 17 40 15 48 13 Z M75 15 L77 23 85 25 77 27 75 35 73 27 65 25 73 23 Z M85 40 L87 48 95 50 87 52 85 60 83 52 75 50 83 48 Z M75 65 L77 73 85 75 77 77 75 85 73 77 65 75 73 73 Z M50 75 L52 83 60 85 52 87 50 95 48 87 40 85 45 80 Z M25 65 L27 73 35 75 27 77 25 85 23 77 15 75 23 73 Z M15 40 L17 48 25 50 17 52 15 60 13 52 5 50 13 48 Z M25 15 L27 23 35 25 27 27 25 35 23 27 15 25 23 23 Z" },
  // ── 운석/혜성 패밀리
  { id: "meteor",  label: "meteor",  vb: 100, d: "M18 82 L50 22 C57 10 78 8 88 24 C98 40 85 62 66 66 L22 76 Z" },
  { id: "meteor2", label: "meteor2", vb: 100, d: "M19 50 L36 17 C40 10 52 9 57 18 C63 27 56 39 45 41 L21 46 Z M49 86 L66 53 C70 46 82 45 87 54 C93 63 86 75 75 77 L51 82 Z" },
  { id: "meteor3", label: "meteor3", vb: 100, d: "M24 40 L41 7 C45 0 57 -1 62 8 C68 17 61 29 50 31 L26 36 Z M34 68 L51 35 C55 28 67 27 72 36 C78 45 71 57 60 59 L36 64 Z M44 96 L61 63 C65 56 77 55 82 64 C88 73 81 85 70 87 L46 92 Z" },
  // ── custom (fill-based) — loaded from src/symbols/custom/*.svg
  ...CUSTOM_SYMBOLS,
  // ── lucide (stroke-based, 24×24) — loaded from src/symbols/lucide/*.svg
  ...LUCIDE_SYMBOLS,
];

const SYMBOL_MAP = new Map(LOGO_SYMBOLS.map((s) => [s.id, s]));

const SHADOW_PARAMS = [
  null,
  { dxR: 0.004, dyR: 0.008, blurR: 0.016, opacity: 0.20 },
  { dxR: 0.008, dyR: 0.014, blurR: 0.028, opacity: 0.30 },
  { dxR: 0.012, dyR: 0.020, blurR: 0.040, opacity: 0.40 },
] as const;

/* ══════════════════════════════════════════════
   Logo SVG builder
══════════════════════════════════════════════ */

function hexToHsl(hex: string): [number, number, number] {
  const h = hex.replace("#", "").padEnd(6, "0");
  let r = parseInt(h.slice(0,2),16)/255, g = parseInt(h.slice(2,4),16)/255, b = parseInt(h.slice(4,6),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let hh = 0, s = 0, l = (max+min)/2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    if (max===r) hh = (g-b)/d + (g<b?6:0);
    else if (max===g) hh = (b-r)/d + 2;
    else hh = (r-g)/d + 4;
    hh /= 6;
  }
  return [hh*360, s*100, l*100];
}

function hslToHex(hh: number, s: number, l: number): string {
  hh /= 360; s /= 100; l /= 100;
  const q = l < 0.5 ? l*(1+s) : l+s-l*s, p = 2*l-q;
  const f = (t: number) => {
    if(t<0) t+=1; if(t>1) t-=1;
    if(t<1/6) return p+(q-p)*6*t;
    if(t<1/2) return q;
    if(t<2/3) return p+(q-p)*(2/3-t)*6;
    return p;
  };
  return "#"+[f(hh+1/3),f(hh),f(hh-1/3)].map(x=>Math.round(x*255).toString(16).padStart(2,"0")).join("");
}

function autoGradientEnd(hex: string): string {
  const [hh, s, l] = hexToHsl(hex);
  return hslToHex((hh + 45) % 360, Math.min(s, 90), Math.max(l - 8, 25));
}

function isLightHex(hex: string): boolean {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // YIQ perceived brightness (0–255)
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

type SlotKind = "char" | "symbol";
type Slot = { kind: SlotKind; value: string };

function isSlotFilled(s: Slot): boolean {
  if (s.kind === "char") return !!s.value;
  const sym = SYMBOL_MAP.get(s.value);
  return !!sym && s.value !== "none" && !!(sym.d || sym.isRing);
}

type TextRenderer = (text: string, cx: number, cy: number, E: number, fgFill: string) => string;

/**
 * Convert a text slot to a vector <path> using opentype.js — used at download
 * time so the SVG renders identically without web-font availability.
 */
function makePathTextRenderer(fonts: LoadedFonts): TextRenderer {
  return (text, cx, cy, E, fgFill) => {
    const displayText = (text || "A").slice(0, 3);
    const charCount = displayText.length;
    const isAllLower = /^[a-z]+$/.test(displayText);
    const hasHangul = /[가-힣]/.test(displayText);
    const div1 = isAllLower ? 0.60 : hasHangul ? 0.92 : 0.72;
    const fontSize = charCount === 1
      ? E / div1
      : charCount === 2
        ? (isAllLower ? E * 1.20 : E)
        : (isAllLower ? E * 0.94 : E * 0.78);
    const font = isAllLower ? fonts.pacifico : fonts.pretendard;
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

function renderTextSlot(text: string, cx: number, cy: number, E: number, fgFill: string): string {
  const displayText = (text || "A").slice(0, 3);
  const charCount = displayText.length;
  const isAllLower = /^[a-z]+$/.test(displayText);
  const hasHangul = /[가-힣]/.test(displayText);
  const div1 = isAllLower ? 0.60 : hasHangul ? 0.92 : 0.72;
  const fontSize = charCount === 1
    ? E / div1
    : charCount === 2
      ? (isAllLower ? E * 1.20 : E)
      : (isAllLower ? E * 0.94 : E * 0.78);
  const lowerSingleYOffset = (ch: string) => {
    if ("bdhkl".includes(ch)) return fontSize * 0.20;
    if (ch === "t") return fontSize * 0.10;
    if (ch === "i") return fontSize * 0.08;
    if ("gjpqy".includes(ch)) return -fontSize * 0.20;
    return 0;
  };
  const textY = isAllLower
    ? cy - fontSize * 0.18 + (charCount === 1 ? lowerSingleYOffset(displayText) : 0)
    : cy;
  const fontFamily = isAllLower
    ? "Pacifico,cursive"
    : hasHangul
      ? "'Pretendard Variable','Pretendard',system-ui,sans-serif"
      : "-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif";
  const fontWeight = isAllLower ? "400" : "900";
  const isTwoDigit = charCount === 2 && /^\d+$/.test(displayText);
  const letterSpacing = isTwoDigit ? -fontSize * 0.08 : 0;
  const lsAttr = letterSpacing !== 0 ? ` letter-spacing="${letterSpacing.toFixed(2)}"` : "";
  return `<text x="${cx.toFixed(1)}" y="${textY.toFixed(1)}" font-family="${fontFamily}" font-size="${fontSize.toFixed(1)}" font-weight="${fontWeight}"${lsAttr} fill="${fgFill}" text-anchor="middle" dominant-baseline="central">${displayText}</text>`;
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

function buildLogoSvgStr(
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

  const useGrad = !!gradientEnd;
  const useTextGrad = !!textGradientEnd;
  const textRenderer = options?.textRenderer ?? renderTextSlot;
  const embedFontImports = options?.embedFonts ?? !options?.textRenderer;

  const charSlots = slots.filter((s) => s.slot.kind === "char");
  const needsPacifico = charSlots.some((s) => /^[a-z]+$/.test(s.slot.value));
  const needsPretendard = charSlots.some((s) => /[가-힣]/.test(s.slot.value));

  const fontImports = embedFontImports
    ? [
        needsPacifico ? `<style>@import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');</style>` : "",
        needsPretendard ? `<style>@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css');</style>` : "",
      ].filter(Boolean).join("")
    : "";

  const uid = options?.uid ?? Math.random().toString(36).slice(2, 8);
  const shadowLevel = options?.shadow ?? 0;
  const sp = SHADOW_PARAMS[shadowLevel];
  const shadowCfg = sp ? {
    dx: size * sp.dxR, dy: size * sp.dyR, blur: size * sp.blurR, opacity: sp.opacity,
  } : null;
  const defsInner = [
    fontImports,
    useGrad ? `<linearGradient id="lg${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg}"/><stop offset="100%" stop-color="${gradientEnd}"/></linearGradient>` : "",
    useTextGrad ? `<linearGradient id="tg${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${tColor}"/><stop offset="100%" stop-color="${textGradientEnd}"/></linearGradient>` : "",
    shadowCfg ? `<filter id="ds${uid}"><feDropShadow dx="${shadowCfg.dx.toFixed(1)}" dy="${shadowCfg.dy.toFixed(1)}" stdDeviation="${shadowCfg.blur.toFixed(1)}" flood-opacity="${shadowCfg.opacity}"/></filter>` : "",
  ].filter(Boolean).join("");
  const defsEl = defsInner ? `<defs>${defsInner}</defs>` : "";
  const bgFill = useGrad ? `url(#lg${uid})` : bg;
  const fgFill = useTextGrad ? `url(#tg${uid})` : tColor;
  const ringInner = gradientEnd ?? bg;

  const slotElements = slots.map(({ slot, rotate: rot, scale: sc }, i) => {
    const cx = cxs[i];
    const inner = slot.kind === "char"
      ? textRenderer(slot.value, cx, cy, E, fgFill)
      : renderSymbolSlot(slot.value, cx, cy, E, fgFill, ringInner, rot, sc);
    if (slot.kind === "char" && (rot !== 0 || sc !== 1)) {
      const transforms: string[] = [];
      if (rot !== 0) transforms.push(`rotate(${rot}, ${cx.toFixed(1)}, ${cy.toFixed(1)})`);
      if (sc !== 1) transforms.push(`translate(${cx.toFixed(1)}, ${cy.toFixed(1)}) scale(${sc}) translate(${(-cx).toFixed(1)}, ${(-cy).toFixed(1)})`);
      return `<g transform="${transforms.join(" ")}">${inner}</g>`;
    }
    return inner;
  }).join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    defsEl,
    `<rect width="${size}" height="${size}" rx="${r}" fill="${bgFill}"/>`,
    shadowCfg ? `<g filter="url(#ds${uid})">${slotElements}</g>` : slotElements,
    `</svg>`,
  ].join("");
}

/** Async build: fetches fonts, converts text → path. Use for downloads. */
async function buildLogoSvgStrForExport(
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
async function buildLogoSvgStrForMaskable(
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

function downloadSvg(svgStr: string, filename: string) {
  const blob = new Blob([svgStr], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

async function svgToPngBlob(svgStr: string, size: number): Promise<Blob> {
  // Pre-warm web fonts so canvas draws with the right typeface.
  // Best-effort — failures fall through to system font fallback in the SVG stack.
  try {
    const anyDoc = document as Document & { fonts?: { ready?: Promise<unknown> } };
    if (anyDoc.fonts?.ready) await anyDoc.fonts.ready;
  } catch {}
  const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("svg image load failed"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    ctx.drawImage(img, 0, 0, size, size);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function downloadPng(svgStr: string, size: number, filename: string) {
  const blob = await svgToPngBlob(svgStr, size);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════════
   UI helpers
══════════════════════════════════════════════ */
function LogoInline({ svgStr, displaySize, className, style }: {
  svgStr: string; displaySize: number; className?: string; style?: React.CSSProperties;
}) {
  const sized = svgStr.replace(
    /(<svg[^>]+)width="\d+" height="\d+"/,
    `$1width="${displaySize}" height="${displaySize}"`,
  );
  return (
    <div
      className={className}
      style={{ width: displaySize, height: displaySize, flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: sized }}
    />
  );
}

function SymbolIcon({ sym, size = 18 }: { sym: typeof LOGO_SYMBOLS[0]; size?: number }) {
  const vb = sym.vb ?? 100;
  if (sym.isRing) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="currentColor">
        <path fillRule="evenodd" d="M50 5 A45 45 0 1 1 50 95 A45 45 0 1 1 50 5 Z M50 20 A30 30 0 1 0 50 80 A30 30 0 1 0 50 20 Z" />
      </svg>
    );
  }
  const rot = sym.rotate != null ? `rotate(${sym.rotate}, ${vb / 2}, ${vb / 2})` : undefined;
  const dList = Array.isArray(sym.d) ? sym.d : [sym.d as string];
  if (sym.stroke) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill="none" stroke="currentColor" strokeWidth={sym.strokeWidth ?? 2} strokeLinecap="round" strokeLinejoin="round">
        {dList.map((d, i) => <path key={i} d={d} transform={rot} />)}
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill="currentColor">
      {dList.map((d, i) => (
        <path key={i} d={d} fillRule={(sym.fillRule as React.SVGAttributes<SVGPathElement>["fillRule"]) ?? "nonzero"} transform={rot} />
      ))}
    </svg>
  );
}

function PickerHeader({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-[12px] font-bold text-zinc-900 tracking-tight">{label}</span>
      {right}
    </div>
  );
}

function SegmentControl<T extends string>({ options, value, onChange }: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex p-0.5 rounded-lg bg-zinc-100">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
            value === o.id
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════
   Constants
══════════════════════════════════════════════ */
const ALPHABET_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const ALPHABET_LOWER = "abcdefghijklmnopqrstuvwxyz".split("");
const NUMBERS = Array.from({ length: 100 }, (_, i) => String(i)); // "0" ~ "99"
// Curated single-syllable Hangul characters that read well as a logo glyph.
const HANGUL_CHARS = [
  "한","꿈","별","불","빛","달","해","산","강","길",
  "꽃","봄","눈","비","물","흙","힘","솔","숲","섬",
  "품","멋","맛","곰","숨","잎","뜻","돌","뜰","맘",
  "용","햇","첫","온","앞","글","맥","참","끝","님",
];

type CharMode = "upper" | "lower" | "num" | "hangul";
type PickerMode = CharMode | "symbol";
const MODE_OPTIONS: { id: PickerMode; label: string }[] = [
  { id: "upper",  label: "AA" },
  { id: "lower",  label: "Aa" },
  { id: "num",    label: "12" },
  { id: "hangul", label: "한글" },
  { id: "symbol", label: "심볼" },
];
function charsForMode(m: CharMode) {
  switch (m) {
    case "upper":  return ALPHABET_UPPER;
    case "lower":  return ALPHABET_LOWER;
    case "num":    return NUMBERS;
    case "hangul": return HANGUL_CHARS;
  }
}
// black → reverse rainbow (violet → red) → neutrals
const LOGO_COLORS = [
  { name: "black",    hex: "#09090b" },
  { name: "charcoal", hex: "#27272a" },
  { name: "slate",    hex: "#334155" },
  // violet / purple
  { name: "violet",   hex: "#7c3aed" },
  { name: "purple",   hex: "#8b5cf6" },
  { name: "fuchsia",  hex: "#d946ef" },
  // indigo / navy
  { name: "indigo",   hex: "#312e81" },
  { name: "navy",     hex: "#1e3a5f" },
  // blue / sky / cyan
  { name: "blue",     hex: "#3b82f6" },
  { name: "sky",      hex: "#38bdf8" },
  { name: "cyan",     hex: "#06b6d4" },
  // teal / green
  { name: "teal",     hex: "#0d9488" },
  { name: "emerald",  hex: "#10b981" },
  { name: "forest",   hex: "#14532d" },
  { name: "lime",     hex: "#84cc16" },
  // yellow / amber
  { name: "yellow",   hex: "#eab308" },
  { name: "amber",    hex: "#f59e0b" },
  // orange
  { name: "orange",   hex: "#f97316" },
  // red / maroon
  { name: "red",      hex: "#ef4444" },
  { name: "maroon",   hex: "#7f1d1d" },
  // pink / rose (red family)
  { name: "pink",     hex: "#ec4899" },
  { name: "rose",     hex: "#fb7185" },
  // warm neutrals / white
  { name: "brown",    hex: "#78350f" },
  { name: "white",    hex: "#fafafa" },
];
const LOGO_RADIUS = 0.15;

/* ══════════════════════════════════════════════
   Style presets: bg × text color scheme
══════════════════════════════════════════════ */
const LOGO_STYLES = [
  { id: "solid",       label: "solid"    },
  { id: "gradient",    label: "gradient" },
  { id: "onWhite",     label: "white"    },
  { id: "onWhiteGrad", label: "white +"  },
  { id: "onBlack",     label: "dark"     },
  { id: "onBlackGrad", label: "dark +"   },
  { id: "colorWhite",     label: "color w"  },
  { id: "colorWhiteGrad", label: "color w+" },
] as const;
type StyleId = typeof LOGO_STYLES[number]["id"];

/** 4 base style families × {solid, gradient} colorMode = 8 actual style ids. */
type StyleBaseId = "color" | "colorWhite" | "onWhite" | "onBlack";
const STYLE_BASES: { id: StyleBaseId; label: string }[] = [
  { id: "colorWhite", label: "흰 문자"   },
  { id: "color",      label: "다크 문자" },
  { id: "onWhite",    label: "화이트"    },
  { id: "onBlack",    label: "다크"      },
];
function resolveStyleId(base: StyleBaseId, mode: "solid" | "gradient"): StyleId {
  if (base === "color")      return mode === "gradient" ? "gradient"      : "solid";
  if (base === "colorWhite") return mode === "gradient" ? "colorWhiteGrad" : "colorWhite";
  if (base === "onWhite")    return mode === "gradient" ? "onWhiteGrad"   : "onWhite";
  return mode === "gradient" ? "onBlackGrad" : "onBlack";
}

function resolveStyle(styleId: StyleId, color: string): {
  bg: string;
  bgGradEnd?: string;
  textColor?: string;
  textGradEnd?: string;
} {
  const WHITE = "#fafafa";
  const BLACK = "#09090b";
  const autoText = isLightHex(color) ? BLACK : "#ffffff";
  const end = autoGradientEnd(color);
  switch (styleId) {
    case "solid":       return { bg: color, textColor: autoText };
    case "gradient":    return { bg: color, bgGradEnd: end, textColor: autoText };
    case "onWhite":     return { bg: WHITE, textColor: color };
    case "onWhiteGrad": return { bg: WHITE, textColor: color, textGradEnd: end };
    case "colorWhite":     return { bg: color, textColor: "#ffffff" };
    case "colorWhiteGrad": return { bg: color, bgGradEnd: end, textColor: "#ffffff" };
    case "onBlack":       return { bg: BLACK, textColor: color };
    case "onBlackGrad":   return { bg: BLACK, textColor: color, textGradEnd: end };
  }
}

type ShowcaseLogo = {
  front: Slot;
  back: Slot;
  color: string;
  style: StyleId;
  fr?: number; // front rotate
  br?: number; // back rotate
  fs?: number; // front scale
  bs?: number; // back scale
};

// Hand-picked combinations that showcase the tool's range.
// Color hues are intentionally distributed across the spectrum.
// fr/br = front/back rotate, fs/bs = front/back scale
const HOME_SHOWCASE: ShowcaseLogo[] = [
  // 1. Markdown 아이덴티티 — 반드시 첫 번째
  { front: { kind: "char", value: "M"  }, back: { kind: "symbol", value: "down"     }, color: "#09090b", style: "solid"                                 },
  // 2. 로켓 발사 — 45° 기울어진 로켓, 그라데이션
  { front: { kind: "char", value: "N"  }, back: { kind: "symbol", value: "rocket"   }, color: "#3b82f6", style: "gradient",     br: 45, bs: 1.10         },
  // 3. 심볼 앞 배치 — 톱니바퀴 + 이니셜, 화이트 위 컬러
  { front: { kind: "symbol", value: "settings" }, back: { kind: "char", value: "k"  }, color: "#0d9488", style: "onWhiteGrad",  fr: 0, fs: 1.15          },
  // 4. 한글 · 별 — 다크 배경에 골드
  { front: { kind: "char", value: "별" }, back: { kind: "symbol", value: "star"     }, color: "#eab308", style: "onBlack",      bs: 1.10                 },
  // 5. 번개 — 바이올렛 그라데
  { front: { kind: "char", value: "S"  }, back: { kind: "symbol", value: "zap"      }, color: "#7c3aed", style: "gradient",     bs: 1.15                 },
  // 6. 망치 — 오렌지, 살짝 기울임
  { front: { kind: "char", value: "B"  }, back: { kind: "symbol", value: "hammer"   }, color: "#f97316", style: "solid",        br: 315                  },
  // 7. 다이아몬드 — 틸, 45° 회전으로 정사각형처럼
  { front: { kind: "char", value: "D"  }, back: { kind: "symbol", value: "diamond"  }, color: "#06b6d4", style: "solid",        br: 45                   },
  // 8. 소문자 필기체 + 깃털 — 로즈, 우아하게
  { front: { kind: "char", value: "a"  }, back: { kind: "symbol", value: "feather"  }, color: "#fb7185", style: "onWhite",      br: 315, bs: 1.10        },
  // 9. 검 — 다크 배경에 퍼플, 대각선
  { front: { kind: "char", value: "X"  }, back: { kind: "symbol", value: "sword"    }, color: "#a855f7", style: "onBlackGrad",  br: 0, bs: 1.15          },
  // 10. 한글 꿈 + 혜성 — 푸시아
  { front: { kind: "char", value: "꿈" }, back: { kind: "symbol", value: "meteor2"  }, color: "#d946ef", style: "onBlackGrad",  bs: 1.05                 },
  // 11. 불꽃 + 스케일업 — 레드
  { front: { kind: "char", value: "F"  }, back: { kind: "symbol", value: "flame"    }, color: "#ef4444", style: "gradient",     bs: 1.20                 },
  // 12. 렌치 — 라임, 공구 느낌
  { front: { kind: "symbol", value: "wrench" }, back: { kind: "char", value: "42"   }, color: "#84cc16", style: "solid",        fr: 315, fs: 1.10        },
];

function DiceIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
      <path d="M16 8h.01"/>
      <path d="M8 8h.01"/>
      <path d="M8 16h.01"/>
      <path d="M16 16h.01"/>
      <path d="M12 12h.01"/>
    </svg>
  );
}

// Row-major 2-row grid with horizontal scroll: fills row 1 fully, then row 2.
function gridStyle(itemCount: number, cellSize = "2.5rem"): React.CSSProperties {
  const cols = Math.max(1, Math.ceil(itemCount / 2));
  return {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, ${cellSize})`,
    gridTemplateRows: `repeat(2, ${cellSize})`,
    gap: "0.375rem",
  };
}

function DownloadIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function HomeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function WandIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" />
      <path d="m14 7 3 3" />
      <path d="M5 6v4" />
      <path d="M19 14v4" />
      <path d="M10 2v2" />
      <path d="M7 8H3" />
      <path d="M21 16h-4" />
      <path d="M11 3H9" />
    </svg>
  );
}

function HomeView({ onStart }: { onStart: () => void }) {
  const rowA = useMemo(() => {
    const half = HOME_SHOWCASE.slice(0, 6);
    return [...half, ...half];
  }, []);
  const rowB = useMemo(() => {
    const half = HOME_SHOWCASE.slice(6, 12);
    return [...half, ...half];
  }, []);
  const renderCfg = (c: ShowcaseLogo, size: number) => {
    const s = resolveStyle(c.style, c.color);
    return buildLogoSvgStr(c.front, c.back, s.bg, LOGO_RADIUS, size, s.bgGradEnd, s.textColor, s.textGradEnd,
      { frontRotate: c.fr, backRotate: c.br, frontScale: c.fs, backScale: c.bs });
  };

  const initialCount = ALPHABET_UPPER.length + ALPHABET_LOWER.length + NUMBERS.length + HANGUL_CHARS.length;
  const symbolCount = LOGO_SYMBOLS.filter((s) => s.id !== "none").length;

  // Auto-rotating hero logo — cycles through showcase every 1.6s
  const [heroIdx, setHeroIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % HOME_SHOWCASE.length), 1600);
    return () => clearInterval(t);
  }, []);
  const hero = HOME_SHOWCASE[heroIdx];

  return (
    <div className="pb-8">
      {/* HERO ─ giant logo + brand + slogan + primary CTA */}
      <Section className="pt-4 pb-2">
        <div className="flex items-center justify-center mb-5">
          <LogoInline
            svgStr={renderCfg(hero, 400)}
            displaySize={140}
            className="shadow-2xl overflow-hidden transition-all duration-500"
            style={{ borderRadius: `${Math.round(140 * LOGO_RADIUS)}px` }}
          />
        </div>
        <h1 className="text-[44px] font-black leading-none text-zinc-900 tracking-tighter mb-2 text-center">
          logodown
        </h1>
        <p className="text-[15px] text-zinc-500 leading-relaxed mb-4 text-center break-keep">
          Make logos like <span className="font-black text-zinc-700">markdown logo</span>.<br />
          한 글자 + 한 심볼 → <span className="font-black text-zinc-700">파비콘부터 PWA까지</span>
        </p>
        <Button variant="dark" full onClick={onStart} className="py-3 mb-3">
          1분 만에 로고 만들기 →
        </Button>
        {(() => {
          const slotOpts = initialCount + symbolCount;
          const rotateCount = 8;                                // 0° ~ 315°
          const scaleCount = 5;                                 // 1x ~ 1.20x
          const slotCombos = slotOpts * rotateCount * scaleCount;
          const styleCount = 4;                                 // 흰문자 / 다크문자 / 화이트 / 다크
          const modeCount = 2;                                  // 단색 / 그라데
          const paletteColors = LOGO_COLORS.length;             // 24
          const total = slotCombos * slotCombos * styleCount * modeCount * paletteColors;
          const billion = total / 1_0000_0000;
          return (
            <div className="rounded-2xl bg-zinc-50 p-3 break-keep">
              <div className="text-[11px] text-zinc-500 mb-2 leading-relaxed text-center space-y-0.5">
                <div>
                  <span className="font-bold text-zinc-700">이니셜</span>
                  <span className="text-zinc-400"> ({initialCount}) </span>+
                  <span className="font-bold text-zinc-700"> 심볼</span>
                  <span className="text-zinc-400"> ({symbolCount}) </span>×
                  <span className="font-bold text-zinc-700"> 회전</span>
                  <span className="text-zinc-400"> ({rotateCount}) </span>×
                  <span className="font-bold text-zinc-700"> 크기</span>
                  <span className="text-zinc-400"> ({scaleCount})</span>
                  <span className="text-zinc-400"> = {slotCombos.toLocaleString()} / 슬롯</span>
                </div>
                <div>
                  <span className="font-bold text-zinc-700">앞·뒤</span>
                  <span className="text-zinc-400"> ({slotCombos.toLocaleString()})² </span>×
                  <span className="font-bold text-zinc-700"> 스타일</span>
                  <span className="text-zinc-400"> ({styleCount}) </span>×
                  <span className="font-bold text-zinc-700"> 모드</span>
                  <span className="text-zinc-400"> ({modeCount}) </span>×
                  <span className="font-bold text-zinc-700"> 색상</span>
                  <span className="text-zinc-400"> ({paletteColors})</span>
                </div>
              </div>
              <div className="text-lg font-black text-zinc-900 text-center tabular-nums">
                {billion >= 1
                  ? <>{billion.toFixed(1)}<span className="text-zinc-500 text-sm font-bold">억 가지</span></>
                  : <>{total.toLocaleString()}<span className="text-zinc-500 text-sm font-bold">+ 가지</span></>
                }
              </div>
              <div className="text-[10px] text-zinc-400 mt-2 text-center leading-relaxed break-keep">
                두 슬롯 각각 자유 조합, 커스텀 hex 색상까지 포함하면 사실상 무한
              </div>
            </div>
          );
        })()}
      </Section>

      {/* CROSSING MARQUEE ─ visual proof of variety */}
      <div className="my-6 space-y-3 overflow-hidden">
        <div className="flex gap-3 lm-marquee">
          {rowA.map((c, i) => (
            <LogoInline
              key={`a-${i}`}
              svgStr={renderCfg(c, 200)}
              displaySize={84}
              className="shadow-lg overflow-hidden"
              style={{ borderRadius: `${Math.round(84 * LOGO_RADIUS)}px` }}
            />
          ))}
        </div>
        <div className="flex gap-3 lm-marquee" style={{ animationDirection: "reverse" }}>
          {rowB.map((c, i) => (
            <LogoInline
              key={`b-${i}`}
              svgStr={renderCfg(c, 200)}
              displaySize={84}
              className="shadow-lg overflow-hidden"
              style={{ borderRadius: `${Math.round(84 * LOGO_RADIUS)}px` }}
            />
          ))}
        </div>
      </div>

      {/* WHY ─ 3 stacked feature cards with strong typography */}
      <Section className="my-2">
        <h2 className="text-2xl font-black text-zinc-900 mb-4 leading-tight tracking-tight break-keep">
          왜 logodown인가
        </h2>
        <div className="space-y-2">
          <div className="rounded-2xl bg-zinc-50 p-4 break-keep">
            <div className="text-xs font-black text-zinc-400 mb-1 tracking-widest">01</div>
            <div className="text-base font-black text-zinc-900 mb-1">최소 요소, 최대 식별성</div>
            <p className="text-[13px] text-zinc-600 leading-relaxed">
              16px 파비콘부터 빌보드까지 한 번에 살아남는 공식. Markdown · Next · Vue가 증명.
            </p>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4 break-keep">
            <div className="text-xs font-black text-zinc-400 mb-1 tracking-widest">02</div>
            <div className="text-base font-black text-zinc-900 mb-1">AI보다 명확하게</div>
            <p className="text-[13px] text-zinc-600 leading-relaxed">
              "그럴싸한" 로고 대신 이니셜 + 심볼 두 조각. 0.5초 만에 읽히는 브랜드.
            </p>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4 break-keep">
            <div className="text-xs font-black text-zinc-400 mb-1 tracking-widest">03</div>
            <div className="text-base font-black text-zinc-900 mb-1">한글도 동등하게</div>
            <p className="text-[13px] text-zinc-600 leading-relaxed">
              "한", "별", "꿈" — 한 글자 완결 K-로고. 영문 수준의 디자인 일관성.
            </p>
          </div>
        </div>
      </Section>

      {/* OUTPUT FORMATS ─ what you actually get */}
      <Section className="my-7">
        <h2 className="text-2xl font-black text-zinc-900 mb-4 leading-tight tracking-tight break-keep">
          어디든 쓸 수 있어요
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-zinc-900 text-white p-4 break-keep">
            <div className="text-2xl font-black mb-1">파비콘</div>
            <div className="text-[11px] text-white/60 mb-3">favicon.ico · 16/32 PNG</div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/10 w-fit">
              <LogoInline svgStr={renderCfg(hero, 200)} displaySize={12} className="overflow-hidden" style={{ borderRadius: `${Math.round(12 * LOGO_RADIUS)}px` }} />
              <span className="text-[10px] font-medium">logodown</span>
            </div>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4 break-keep">
            <div className="text-2xl font-black text-zinc-900 mb-1">iOS</div>
            <div className="text-[11px] text-zinc-500 mb-3">apple-touch 180px</div>
            <LogoInline svgStr={renderCfg(hero, 200)} displaySize={48} className="shadow-md overflow-hidden" style={{ borderRadius: `${Math.round(48 * LOGO_RADIUS)}px` }} />
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4 break-keep">
            <div className="text-2xl font-black text-zinc-900 mb-1">PWA</div>
            <div className="text-[11px] text-zinc-500 mb-3">192/512 + manifest</div>
            <div className="flex gap-1.5 items-end">
              <LogoInline svgStr={renderCfg(hero, 200)} displaySize={36} className="shadow-sm overflow-hidden" style={{ borderRadius: `${Math.round(36 * LOGO_RADIUS)}px` }} />
              <LogoInline svgStr={renderCfg(hero, 200)} displaySize={52} className="shadow-md overflow-hidden" style={{ borderRadius: `${Math.round(52 * LOGO_RADIUS)}px` }} />
            </div>
          </div>
          <div className="rounded-2xl bg-zinc-900 text-white p-4 break-keep">
            <div className="text-2xl font-black mb-1">소셜</div>
            <div className="text-[11px] text-white/60 mb-3">OG 1200×630</div>
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/10">
              <LogoInline svgStr={renderCfg(hero, 200)} displaySize={20} className="overflow-hidden" style={{ borderRadius: `${Math.round(20 * LOGO_RADIUS)}px` }} />
              <span className="text-xs font-bold">logodown</span>
            </div>
          </div>
        </div>
      </Section>

      {/* BOTTOM CTA */}
      <Section>
        <div className="rounded-2xl bg-zinc-900 text-white p-5 text-center break-keep">
          <div className="text-xl font-black mb-1">시작 준비 완료</div>
          <p className="text-[13px] text-white/60 mb-4 leading-relaxed">
            가입·결제 없음. 브라우저에서 바로, 1분 안에.
          </p>
          <button
            onClick={onStart}
            className="w-full py-3 rounded-xl bg-white text-zinc-900 font-black text-sm hover:opacity-90 transition-opacity cursor-pointer"
          >
            지금 만들기 →
          </button>
        </div>
      </Section>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Main App
══════════════════════════════════════════════ */
export default function App() {
  const [view, setView] = useState<"home" | "create">("home");
  const [front, setFront] = useState<Slot>({ kind: "char", value: "M" });
  const [back, setBack] = useState<Slot>({ kind: "symbol", value: "down" });
  const [activeSlot, setActiveSlot] = useState<"front" | "back">("back");
  const [pickerMode, setPickerMode] = useState<PickerMode>("symbol");
  const [color, setColor] = useState<string>("#09090b");
  const [colorMode, setColorMode] = useState<"solid" | "gradient">("solid");
  const [styleBase, setStyleBase] = useState<StyleBaseId>("colorWhite");
  const [frontRotate, setFrontRotate] = useState(0);
  const [backRotate, setBackRotate] = useState(0);
  const [frontScale, setFrontScale] = useState(1);
  const [backScale, setBackScale] = useState(1);
  const [shadow, setShadow] = useState(0);
  const [ogTitle, setOgTitle] = useState("logodown");
  const [ogDesc, setOgDesc] = useState("Make logos like markdown logo");
  const style: StyleId = resolveStyleId(styleBase, colorMode);
  const toast = useToast();

  const scheme = resolveStyle(style, color);
  const renderLogo = (size: number, opts?: { textRenderer?: TextRenderer; embedFonts?: boolean }) =>
    buildLogoSvgStr(
      front, back, scheme.bg, LOGO_RADIUS, size,
      scheme.bgGradEnd, scheme.textColor, scheme.textGradEnd,
      { ...opts, frontRotate, backRotate, frontScale, backScale, shadow, uid: "p" },
    );
  const logoSvgStr = renderLogo(200);
  const rPx = (s: number) => Math.round(s * LOGO_RADIUS);
  const wordmarkLabel =
    (front.kind === "char" && front.value) ||
    (back.kind === "char" && back.value) ||
    "M";

  const activeValue = activeSlot === "front" ? front : back;
  const setActiveValue = (slot: Slot) => {
    if (activeSlot === "front") setFront(slot);
    else setBack(slot);
  };

  const pickFromGrid = (kind: SlotKind, value: string) => {
    setActiveValue({ kind, value });
  };

  const randomSlot = (): Slot => {
    const syms = LOGO_SYMBOLS.filter((s) => s.id !== "none");
    const modes: CharMode[] = ["upper", "lower", "num", "hangul"];
    if (Math.random() < 0.5) {
      const m = modes[Math.floor(Math.random() * modes.length)];
      const chars = charsForMode(m);
      return { kind: "char", value: chars[Math.floor(Math.random() * chars.length)] };
    }
    return { kind: "symbol", value: syms[Math.floor(Math.random() * syms.length)].id };
  };

  const handleRandomSlots = () => {
    setFront(randomSlot());
    setBack(randomSlot());
  };

  // Randomize only the currently-active slot — lets user lock one side and roll the other.
  const handleRandomActiveSlot = () => {
    setActiveValue(randomSlot());
  };

  const handleRandomColor = () => {
    setColor(LOGO_COLORS[Math.floor(Math.random() * LOGO_COLORS.length)].hex);
    setColorMode(Math.random() < 0.5 ? "solid" : "gradient");
    setStyleBase(STYLE_BASES[Math.floor(Math.random() * STYLE_BASES.length)].id);
  };

  const handleRandom = () => {
    handleRandomSlots();
    handleRandomColor();
  };

  const baseName = (
    (front.kind === "char" ? front.value : "") ||
    (back.kind === "char" ? back.value : "") ||
    "logo"
  ).toLowerCase();

  const tweaks = { frontRotate, backRotate, frontScale, backScale, shadow };
  const renderExportLogo = (size: number) =>
    buildLogoSvgStrForExport(
      front, back, scheme.bg, LOGO_RADIUS, size,
      scheme.bgGradEnd, scheme.textColor, scheme.textGradEnd, tweaks,
    );

  const handleDownloadSvg = async () => {
    const filename = `${baseName}.svg`;
    try {
      const svg = await renderExportLogo(512);
      downloadSvg(svg, filename);
      toast(`${filename} 다운로드 완료`, { variant: "success" });
    } catch {
      toast("SVG 생성 실패 (폰트 로드 오류)", { variant: "error" });
    }
  };

  const handleDownloadPng = async (size: number, label: string) => {
    const filename = `${baseName}-${label}.png`;
    try {
      const svg = await renderExportLogo(512);
      await downloadPng(svg, size, filename);
      toast(`${filename} (${size}×${size}) 다운로드 완료`, { variant: "success" });
    } catch {
      toast("PNG 변환 실패", { variant: "error" });
    }
  };

  const handleDownloadPack = async (category: SeoPackCategory, suffix: string) => {
    toast("패키지 빌드 중…", { variant: "info" });
    try {
      const needsMaskable = category === "all" || category === "pwa";
      const [iconSvg, maskableSvg] = await Promise.all([
        buildLogoSvgStrForExport(
          front, back, scheme.bg, LOGO_RADIUS, 512,
          scheme.bgGradEnd, scheme.textColor, scheme.textGradEnd, tweaks,
        ),
        needsMaskable
          ? buildLogoSvgStrForMaskable(
              front, back, scheme.bg, 512,
              scheme.bgGradEnd, scheme.textColor, scheme.textGradEnd, tweaks,
            )
          : Promise.resolve(""),
      ]);
      const textColor = scheme.textColor ?? (isLightHex(scheme.bg) ? "#09090b" : "#ffffff");
      const zipBytes = await buildSeoPack({
        iconSvg,
        maskableSvg,
        brandName: ogTitle,
        slogan: ogDesc,
        bgColor: scheme.bg,
        bgGradEnd: scheme.bgGradEnd,
        textColor,
      }, category);
      const blob = new Blob([zipBytes as BlobPart], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename = `logodown-${baseName}-${suffix}.zip`;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      const sizeKb = Math.round(zipBytes.byteLength / 1024);
      toast(`${filename} (${sizeKb}KB) 다운로드 완료`, { variant: "success" });
    } catch (e) {
      console.error(e);
      toast("패키지 빌드 실패", { variant: "error" });
    }
  };

  const cellCls = (active: boolean) =>
    `w-10 h-10 flex items-center justify-center rounded-lg font-bold text-[13px] cursor-pointer transition-all select-none shrink-0 ${
      active
        ? "bg-zinc-900 text-white shadow-sm"
        : "bg-white text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
    }`;

  return (
    <Watermark color="#09090b" text="logodown" speed={60}>
      <AppShell>
        <AppShellHeader>
          <span className="text-lg font-black text-zinc-900 tracking-tight">
            logodown
          </span>
          <div className="flex items-center gap-2">
            <a href="https://m1k.app/gl" target="_blank" rel="noopener noreferrer">
              <img src="https://m1k.app/badge/gl.svg" alt="hits" className="h-5" />
            </a>
            <ShareButton
              title="logodown"
              text="Make logos like markdown logo"
              label="공유"
            />
          </div>
        </AppShellHeader>

        <AppShellContent>
          {view === "home" ? (
            <HomeView onStart={() => setView("create")} />
          ) : (
          <>
          {/* Preview — sticky canvas */}
          <div className="sticky top-0 z-10 px-3 pt-2 pb-4">
            <div className="rounded-2xl bg-white flex flex-col items-center justify-center py-5 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)]">
              <LogoInline svgStr={logoSvgStr} displaySize={120} className="shadow-2xl transition-all duration-300 overflow-hidden" style={{ borderRadius: `${rPx(120)}px` }} />
              {/* Action bar */}
              <div className="flex items-center gap-1.5 mt-4 px-4 w-full">
                {([
                  { label: "전체", onClick: handleRandom },
                  { label: `${activeSlot === "front" ? "앞" : "뒤"} 슬롯`, onClick: handleRandomActiveSlot },
                  { label: "색상", onClick: handleRandomColor },
                ] as const).map(({ label, onClick }) => (
                  <button
                    key={label}
                    onClick={onClick}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors cursor-pointer"
                  >
                    <DiceIcon size={12} />
                    <span className="text-[11px] font-semibold">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Slot picker — card */}
          <Section>
            <div className="rounded-2xl bg-zinc-50 p-3">
              <div className="flex items-center justify-between mb-3">
                <SegmentControl
                  options={[{ id: "front" as const, label: "앞 슬롯" }, { id: "back" as const, label: "뒤 슬롯" }]}
                  value={activeSlot}
                  onChange={setActiveSlot}
                />
              </div>
              <div className="flex items-center justify-between mb-3">
                <SegmentControl
                  options={MODE_OPTIONS}
                  value={pickerMode}
                  onChange={setPickerMode}
                />
                <span className="text-[11px] text-zinc-400 font-medium tabular-nums">
                  {pickerMode === "symbol"
                    ? LOGO_SYMBOLS.filter((s) => s.id !== "none").length
                    : charsForMode(pickerMode).length}
                </span>
              </div>
              {pickerMode === "symbol" ? (() => {
                const symbols = LOGO_SYMBOLS.filter((s) => s.id !== "none");
                return (
                  <div className="overflow-x-auto pb-1 scrollbar-hide">
                    <div style={gridStyle(symbols.length)}>
                      {symbols.map((s) => {
                        const isActive = activeValue.kind === "symbol" && activeValue.value === s.id;
                        return (
                          <Tooltip key={s.id} label={s.id}>
                            <button onClick={() => pickFromGrid("symbol", s.id)} className={cellCls(isActive)}>
                              <SymbolIcon sym={s} size={16} />
                            </button>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                );
              })() : (() => {
                const chars = charsForMode(pickerMode);
                const cellFont: React.CSSProperties =
                  pickerMode === "lower"
                    ? { fontFamily: "Pacifico, cursive", fontWeight: 400, fontSize: "1.15rem" }
                    : pickerMode === "hangul"
                      ? { fontFamily: "'Pretendard Variable', 'Pretendard', system-ui, sans-serif", fontWeight: 900 }
                      : {};
                return (
                  <div className="overflow-x-auto pb-1 scrollbar-hide">
                    <div style={gridStyle(chars.length)}>
                      {chars.map((l) => {
                        const isActive = activeValue.kind === "char" && activeValue.value === l;
                        return (
                          <button
                            key={l}
                            onClick={() => pickFromGrid("char", l)}
                            className={cellCls(isActive)}
                            style={cellFont}
                          >
                            {l}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
            {/* Rotate + Scale */}
            {(() => {
              const currentRotate = activeSlot === "front" ? frontRotate : backRotate;
              const setCurrentRotate = activeSlot === "front" ? setFrontRotate : setBackRotate;
              const currentScale = activeSlot === "front" ? frontScale : backScale;
              const setCurrentScale = activeSlot === "front" ? setFrontScale : setBackScale;
              return (
                <div className="flex flex-col gap-2 mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-zinc-900 tracking-tight shrink-0 w-7">회전</span>
                    <div className="flex items-center gap-1">
                      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                        <button
                          key={deg}
                          onClick={() => setCurrentRotate(deg)}
                          className={`w-8 h-8 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                            currentRotate === deg
                              ? "bg-zinc-900 text-white shadow-sm"
                              : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                          }`}
                        >
                          {deg}°
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-zinc-900 tracking-tight shrink-0 w-7">크기</span>
                    <div className="flex items-center gap-1">
                      {[1, 1.05, 1.10, 1.15, 1.20].map((s) => (
                        <button
                          key={s}
                          onClick={() => setCurrentScale(s)}
                          className={`h-8 px-2.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                            currentScale === s
                              ? "bg-zinc-900 text-white shadow-sm"
                              : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                          }`}
                        >
                          {s === 1 ? "1x" : `${s.toFixed(2)}x`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </Section>

          {/* Color — card */}
          <Section>
            <div className="rounded-2xl bg-zinc-50 p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-bold text-zinc-900 tracking-tight">색상</span>
                <SegmentControl
                  options={[
                    { id: "solid" as const,    label: "단색"       },
                    { id: "gradient" as const, label: "그라데이션" },
                  ]}
                  value={colorMode}
                  onChange={setColorMode}
                />
              </div>
              <div className="overflow-x-auto pb-1 scrollbar-hide">
                <div style={gridStyle(LOGO_COLORS.length + 1)}>
                  {LOGO_COLORS.map(({ name, hex }) => {
                    const swatchBg = colorMode === "gradient"
                      ? `linear-gradient(135deg, ${hex}, ${autoGradientEnd(hex)})`
                      : undefined;
                    return (
                      <button
                        key={name}
                        onClick={() => setColor(hex)}
                        className={`relative w-10 h-10 rounded-lg cursor-pointer transition-all flex items-center justify-center ${color === hex ? "scale-90 shadow-md" : "hover:scale-95"}`}
                        style={swatchBg ? { background: swatchBg } : { backgroundColor: hex }}
                        title={name}
                      >
                        {color === hex && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isLightHex(hex) ? "#09090b" : "#ffffff"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                  <label className="w-10 h-10 rounded-lg cursor-pointer flex items-center justify-center bg-white hover:bg-zinc-100 transition-colors relative overflow-hidden border border-dashed border-zinc-300">
                    <span className="text-zinc-400 text-lg font-bold">+</span>
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  </label>
                </div>
              </div>
            </div>
          </Section>

          {/* Style — card */}
          <Section>
            <div className="rounded-2xl bg-zinc-50 p-3">
              <span className="text-[12px] font-bold text-zinc-900 tracking-tight block mb-3">스타일</span>
              <div className="flex gap-3">
                {STYLE_BASES.map((sb) => {
                  const sid = resolveStyleId(sb.id, colorMode);
                  const s = resolveStyle(sid, color);
                  const preview = buildLogoSvgStr(
                    front, back, s.bg, LOGO_RADIUS, 200,
                    s.bgGradEnd, s.textColor, s.textGradEnd,
                  );
                  const active = styleBase === sb.id;
                  return (
                    <button
                      key={sb.id}
                      onClick={() => setStyleBase(sb.id)}
                      className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${active ? "" : "opacity-50 hover:opacity-80"}`}
                    >
                      <div className={`relative overflow-hidden transition-all ${active ? "ring-2 ring-zinc-900 ring-offset-2" : ""}`} style={{ borderRadius: `${Math.round(56 * LOGO_RADIUS)}px` }}>
                        <LogoInline
                          svgStr={preview}
                          displaySize={56}
                          className="overflow-hidden block"
                          style={{ borderRadius: `${Math.round(56 * LOGO_RADIUS)}px` }}
                        />
                      </div>
                      <span className={`text-[11px] font-semibold ${active ? "text-zinc-900" : "text-zinc-400"}`}>{sb.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Shadow level */}
            <div className="flex items-center justify-between mt-3">
              <span className="text-[12px] font-bold text-zinc-900 tracking-tight">음영</span>
              <div className="flex items-center gap-1">
                {[
                  { v: 0, label: "없음" },
                  { v: 1, label: "약하게" },
                  { v: 2, label: "보통" },
                  { v: 3, label: "강하게" },
                ].map(({ v, label }) => (
                  <button
                    key={v}
                    onClick={() => setShadow(v)}
                    className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                      shadow === v
                        ? "bg-zinc-900 text-white shadow-sm"
                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* Download */}
          <Section>
            <PickerHeader label="다운로드" />

            {/* OG card — accordion */}
            <details className="group rounded-2xl bg-zinc-50 mb-4">
              <summary className="flex items-center gap-1.5 p-3 cursor-pointer select-none list-none">
                <svg className="w-3 h-3 text-zinc-400 transition-transform group-open:rotate-90" viewBox="0 0 12 12" fill="currentColor"><path d="M4.5 2L9 6L4.5 10V2Z"/></svg>
                <span className="text-[12px] font-bold text-zinc-900 tracking-tight">소셜 공유 카드</span>
                <span className="text-[10px] text-zinc-400 ml-auto">OG 1200×630</span>
              </summary>
              <div className="px-3 pb-3 space-y-2">
                {/* OG preview */}
                <div className="rounded-xl overflow-hidden border border-zinc-200 shadow-sm relative" style={{ aspectRatio: "1200/630" }}>
                  <div className="absolute inset-0 opacity-85" style={{ background: scheme.bgGradEnd ? `linear-gradient(135deg, ${scheme.bg}, ${scheme.bgGradEnd})` : scheme.bg }} />
                  <div className="relative w-full h-full flex items-center gap-[6%] px-[8%]">
                    <LogoInline svgStr={logoSvgStr} displaySize={90} className="shrink-0 overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.15)]" style={{ borderRadius: `${rPx(90)}px` }} />
                    {(() => {
                      const c = isLightHex(scheme.bg) ? "#09090b" : "#ffffff";
                      return (
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-[18px] font-black truncate" style={{ color: c }}>{ogTitle || "Brand"}</span>
                          <span className="text-[11px] truncate opacity-50" style={{ color: c }}>{ogDesc || "Description"}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                {/* inputs */}
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 mb-0.5 block">Service</label>
                  <input
                    type="text"
                    value={ogTitle}
                    onChange={(e) => setOgTitle(e.target.value)}
                    placeholder="브랜드명"
                    className="w-full h-7 px-2.5 rounded-lg bg-white text-[11px] font-semibold text-zinc-900 outline-none focus:ring-2 ring-zinc-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 mb-0.5 block">Slogan</label>
                  <input
                    type="text"
                    value={ogDesc}
                    onChange={(e) => setOgDesc(e.target.value)}
                    placeholder="한 줄 소개"
                    className="w-full h-7 px-2.5 rounded-lg bg-white text-[11px] text-zinc-600 outline-none focus:ring-2 ring-zinc-300"
                  />
                </div>
              </div>
            </details>

            {/* Recommended: full pack */}
            <button
              onClick={() => handleDownloadPack("all", "seo-pack")}
              className="w-full text-left rounded-2xl bg-zinc-900 text-white py-4 px-5 mb-4 hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="font-black text-base">전체 받기</div>
                <div className="text-[11px] opacity-60 mt-0.5 leading-relaxed break-keep">
                  파비콘·iOS·PWA·소셜·manifest·head.html
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] opacity-50 font-medium">~200KB</span>
                <DownloadIcon size={16} />
              </div>
            </button>

            {/* Collapsed: use-case subsets + individual files */}
            <details className="group">
              <summary className="text-[12px] text-zinc-400 font-medium cursor-pointer hover:text-zinc-600 list-none flex items-center gap-1.5 select-none py-2 transition-colors">
                <svg className="w-3 h-3 transition-transform group-open:rotate-90" viewBox="0 0 12 12" fill="currentColor"><path d="M4.5 2L9 6L4.5 10V2Z"/></svg>
                <span>용도별 · 개별 다운로드</span>
              </summary>
              <div className="pt-2 space-y-4">
                {/* Use-case based subsets */}
                <div className="space-y-1.5">
                  {[
                    { id: "favicon" as const, title: "파비콘만",        desc: "브라우저 탭에 뜨는 작은 아이콘",        size: "~10KB"  },
                    { id: "ios"     as const, title: "iOS 홈스크린",    desc: "아이폰·아이패드 홈에 추가될 아이콘",     size: "~8KB"   },
                    { id: "pwa"     as const, title: "PWA 앱 아이콘",   desc: "앱처럼 설치 가능 + manifest",           size: "~80KB"  },
                    { id: "social"  as const, title: "소셜 공유 카드",   desc: "카톡·페북·슬랙 미리보기 OG 이미지",     size: "~120KB" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleDownloadPack(c.id, c.id)}
                      className="w-full text-left rounded-xl bg-zinc-50 hover:bg-zinc-100 px-3.5 py-2.5 transition-colors cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-zinc-900">{c.title}</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{c.desc}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-zinc-300">
                        <span className="text-[10px] font-medium">{c.size}</span>
                        <DownloadIcon size={13} />
                      </div>
                    </button>
                  ))}
                </div>

                {/* Individual files */}
                <div>
                  <div className="text-[11px] text-zinc-400 font-medium mb-2">개별 파일</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button onClick={handleDownloadSvg} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer">
                      <span className="text-[12px] font-semibold text-zinc-700">SVG</span>
                      <span className="flex items-center gap-1 text-zinc-300"><span className="text-[10px]">~10KB</span><DownloadIcon size={12} /></span>
                    </button>
                    <button onClick={() => handleDownloadPng(32, "favicon-32")} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer">
                      <span className="text-[12px] font-semibold text-zinc-700">PNG 32</span>
                      <span className="flex items-center gap-1 text-zinc-300"><span className="text-[10px]">~1KB</span><DownloadIcon size={12} /></span>
                    </button>
                    <button onClick={() => handleDownloadPng(180, "apple-touch-180")} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer">
                      <span className="text-[12px] font-semibold text-zinc-700">PNG 180</span>
                      <span className="flex items-center gap-1 text-zinc-300"><span className="text-[10px]">~8KB</span><DownloadIcon size={12} /></span>
                    </button>
                    <button onClick={() => handleDownloadPng(192, "pwa-192")} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer">
                      <span className="text-[12px] font-semibold text-zinc-700">PNG 192</span>
                      <span className="flex items-center gap-1 text-zinc-300"><span className="text-[10px]">~10KB</span><DownloadIcon size={12} /></span>
                    </button>
                    <button onClick={() => handleDownloadPng(512, "pwa-512")} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer col-span-2">
                      <span className="text-[12px] font-semibold text-zinc-700">PNG 512</span>
                      <span className="flex items-center gap-1 text-zinc-300"><span className="text-[10px]">~40KB</span><DownloadIcon size={12} /></span>
                    </button>
                  </div>
                </div>

                {/* Where-to-put guide */}
                <div className="p-3.5 rounded-xl bg-zinc-50 break-keep">
                  <p className="text-[11px] text-zinc-500 font-semibold mb-1">어디에 넣어요?</p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    받은 파일을 프로젝트의 <code className="font-mono font-semibold text-zinc-600">public/</code> (Vite·Next·CRA·Astro)
                    또는 <code className="font-mono font-semibold text-zinc-600">static/</code> (Nuxt 2·Hugo) 폴더에 통째로 넣고,
                    <code className="font-mono font-semibold text-zinc-600">head.html</code> 내용을 <code className="font-mono font-semibold text-zinc-600">&lt;head&gt;</code>에 붙여넣으면 끝.
                  </p>
                </div>
              </div>
            </details>
          </Section>

          <div className="pb-6" />
          </>
          )}
        </AppShellContent>

        <TabBar>
          <Tab
            active={view === "home"}
            onClick={() => setView("home")}
            icon={<HomeIcon />}
            label="홈"
            activeColor="#09090b"
          />
          <Tab
            active={view === "create"}
            onClick={() => setView("create")}
            icon={<WandIcon />}
            label="만들기"
            activeColor="#09090b"
          />
        </TabBar>
      </AppShell>
    </Watermark>
  );
}
