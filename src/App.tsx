import { useState, useEffect } from "react";
import {
  AppShell, AppShellHeader, AppShellContent,
  Section, Divider, colors,
  ThemeButton, ThemeDialog,
  Tooltip,
} from "@m1kapp/kit";

/* ══════════════════════════════════════════════
   Symbols
══════════════════════════════════════════════ */
const ARROW_D = "M30 5 L70 5 L70 52 L95 52 L50 95 L5 52 L30 52 Z";
const LOGO_SYMBOLS: Array<{ id: string; label: string; d?: string; vb?: number; isRing?: boolean; fillRule?: string; rotate?: number }> = [
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
  { id: "codecrafters", label: "</>", vb: 24, d: "M1 12 L10 2 L17 2 L8 12 L17 22 L10 22 Z M7 22 L13 22 L17 2 L11 2 Z M23 12 L14 2 L7 2 L16 12 L7 22 L14 22 Z" },
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
];

/* ══════════════════════════════════════════════
   Logo SVG builder
══════════════════════════════════════════════ */
function invertHex(hex: string): string {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = (255 - parseInt(h.slice(0, 2), 16)).toString(16).padStart(2, "0");
  const g = (255 - parseInt(h.slice(2, 4), 16)).toString(16).padStart(2, "0");
  const b = (255 - parseInt(h.slice(4, 6), 16)).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

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

function buildLogoSvgStr(text: string, symbolId: string, bg: string, radius: number, size = 200, gradientEnd?: string): string {
  const r = Math.round(size * radius);
  const sym = LOGO_SYMBOLS.find((s) => s.id === symbolId);
  const hasSymbol = !!sym && sym.id !== "none" && (sym.d || sym.isRing);
  const tColor = "#ffffff";
  const cy = size / 2;
  const displayText = (text || "A").slice(0, 3);

  const useGrad = !!gradientEnd;
  const isAllLowerCheck = /^[a-z]+$/.test((text || "A").slice(0, 3));
  const fontImport = isAllLowerCheck
    ? `<style>@import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');</style>`
    : "";
  const defsEl = useGrad
    ? `<defs>${fontImport}<linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg}"/><stop offset="100%" stop-color="${gradientEnd}"/></linearGradient></defs>`
    : isAllLowerCheck ? `<defs>${fontImport}</defs>` : "";
  const bgFill = useGrad ? "url(#lg)" : bg;
  const borderColor = invertHex(bg);

  const E = size * 0.30;
  const gap = size * 0.06;
  const groupW = hasSymbol ? E + gap + E : E;
  const groupLeft = (size - groupW) / 2;

  const textCx = groupLeft + E / 2;
  const charCount = displayText.length;
  const isAllLower = /^[a-z]+$/.test(displayText);
  const div1 = isAllLower ? 0.60 : 0.72;
  const fontSize = charCount === 1
    ? E / div1
    : charCount === 2
      ? (isAllLower ? E * 1.20 : E)
      : (isAllLower ? E * 0.94 : E * 0.78);
  const textY = isAllLower ? cy - fontSize * 0.18 : cy;
  const fontFamily = isAllLower
    ? "Pacifico,cursive"
    : "-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif";
  const fontWeight = isAllLower ? "400" : "900";
  const textEl = `<text x="${textCx.toFixed(1)}" y="${textY.toFixed(1)}" font-family="${fontFamily}" font-size="${fontSize.toFixed(1)}" font-weight="${fontWeight}" fill="${tColor}" text-anchor="middle" dominant-baseline="central">${displayText}</text>`;

  let symbolEl = "";
  if (hasSymbol) {
    const symCx = groupLeft + E + gap + E / 2;
    const ringInner = gradientEnd ?? bg;
    if (sym!.isRing) {
      symbolEl = `<circle cx="${symCx.toFixed(1)}" cy="${cy}" r="${(E*0.50).toFixed(1)}" fill="${tColor}"/><circle cx="${symCx.toFixed(1)}" cy="${cy}" r="${(E*0.29).toFixed(1)}" fill="${ringInner}"/>`;
    } else {
      const vb = sym!.vb ?? 100;
      const sc = E / vb;
      const tx = symCx - (vb/2)*sc, ty = cy - (vb/2)*sc;
      const fr = sym!.fillRule ? ` fill-rule="${sym!.fillRule}"` : "";
      const rot = sym!.rotate != null ? ` transform="rotate(${sym!.rotate}, ${(vb/2)}, ${(vb/2)})"` : "";
      symbolEl = `<g transform="translate(${tx.toFixed(1)},${ty.toFixed(1)}) scale(${sc.toFixed(4)})"><path d="${sym!.d}" fill="${tColor}"${fr}${rot}/></g>`;
    }
  }

  const bw = size * 0.03;
  const borderEl = `<rect x="${bw/2}" y="${bw/2}" width="${size-bw}" height="${size-bw}" rx="${Math.max(0, r - bw/2)}" fill="none" stroke="${borderColor}" stroke-width="${bw}" stroke-opacity="0.4"/>`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    defsEl,
    `<rect width="${size}" height="${size}" rx="${r}" fill="${bgFill}"/>`,
    borderEl, textEl, symbolEl,
    `</svg>`,
  ].join("");
}

function buildLogoDataUrl(text: string, symbolId: string, bg: string, radius: number, size = 200, gradientEnd?: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildLogoSvgStr(text, symbolId, bg, radius, size, gradientEnd))}`;
}

function downloadSvg(svgStr: string, filename: string) {
  const blob = new Blob([svgStr], { type: "image/svg+xml" });
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
  return (
    <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill="currentColor">
      <path d={sym.d} fillRule={(sym.fillRule as React.SVGAttributes<SVGPathElement>["fillRule"]) ?? "nonzero"} transform={rot} />
    </svg>
  );
}

function PickerLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-2">{children}</p>;
}

/* ══════════════════════════════════════════════
   Constants
══════════════════════════════════════════════ */
const ALPHABET_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const ALPHABET_LOWER = "abcdefghijklmnopqrstuvwxyz".split("");
const LOGO_COLORS = [
  ...Object.entries(colors).map(([name, hex]) => ({ name, hex })),
  { name: "black",    hex: "#09090b" },
  { name: "white",    hex: "#fafafa" },
  { name: "slate",    hex: "#334155" },
  { name: "navy",     hex: "#1e3a5f" },
  { name: "forest",   hex: "#14532d" },
  { name: "maroon",   hex: "#7f1d1d" },
  { name: "fuchsia",  hex: "#d946ef" },
  { name: "coral",    hex: "#f97316" },
  { name: "emerald",  hex: "#10b981" },
  { name: "sky",      hex: "#38bdf8" },
  { name: "rose",     hex: "#fb7185" },
  { name: "amber",    hex: "#f59e0b" },
  { name: "indigo",   hex: "#312e81" },
  { name: "teal",     hex: "#0d9488" },
  { name: "lime",     hex: "#84cc16" },
  { name: "cyan",     hex: "#06b6d4" },
  { name: "violet",   hex: "#7c3aed" },
  { name: "pink",     hex: "#ec4899" },
  { name: "brown",    hex: "#78350f" },
  { name: "charcoal", hex: "#27272a" },
];
const RADIUS_PRESETS = [
  { label: "□", value: 0 },
  { label: "▢", value: 0.15 },
  { label: "⬜", value: 0.25 },
  { label: "●", value: 0.5 },
];

/* ══════════════════════════════════════════════
   Main App
══════════════════════════════════════════════ */
export default function App() {
  const [initial, setInitial] = useState("M");
  const [symbol, setSymbol] = useState("down");
  const [color, setColor] = useState(colors.blue);
  const [radius, setRadius] = useState(0.22);
  const [gradient, setGradient] = useState(false);
  const [uppercase, setUppercase] = useState(true);
  const [themeOpen, setThemeOpen] = useState(false);
  const [dark, setDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const handleRandom = () => {
    const syms = LOGO_SYMBOLS.filter((s) => s.id !== "none");
    setSymbol(syms[Math.floor(Math.random() * syms.length)].id);
    const alpha = uppercase ? ALPHABET_UPPER : ALPHABET_LOWER;
    setInitial(alpha[Math.floor(Math.random() * alpha.length)]);
    setColor(LOGO_COLORS[Math.floor(Math.random() * LOGO_COLORS.length)].hex);
    setRadius(RADIUS_PRESETS[Math.floor(Math.random() * RADIUS_PRESETS.length)].value);
  };

  const gradientEnd = gradient ? autoGradientEnd(color) : undefined;
  const logoSvgStr = buildLogoSvgStr(initial, symbol, color, radius, 200, gradientEnd);
  const rPx = (s: number) => Math.round(s * radius);

  const cellCls = (active: boolean) =>
    `w-11 h-11 flex items-center justify-center rounded-2xl font-black text-sm cursor-pointer transition-all select-none flex-shrink-0 ${
      active
        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 scale-95 shadow-md"
        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
    }`;
  const scrollRow = "grid grid-rows-2 grid-flow-col gap-1.5 overflow-x-auto pb-1 scrollbar-hide";

  return (
    <>
      <AppShell>
        <AppShellHeader>
          <span className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
            Logo Maker
          </span>
          <ThemeButton color={color} dark={dark} onClick={() => setThemeOpen(true)} />
        </AppShellHeader>

        <AppShellContent>
          {/* Preview + Random */}
          <Section className="pt-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-zinc-900 dark:text-white">미리보기</h2>
              <button
                onClick={handleRandom}
                className="px-4 py-2 rounded-2xl text-sm font-black bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-80 transition-opacity cursor-pointer"
              >
                랜덤
              </button>
            </div>

            <div className="flex justify-center mb-2">
              <LogoInline svgStr={logoSvgStr} displaySize={112} className="shadow-2xl transition-all duration-200 overflow-hidden" style={{ borderRadius: `${rPx(112)}px` }} />
            </div>

            <div className="flex items-center justify-center gap-4 mb-1">
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <LogoInline svgStr={logoSvgStr} displaySize={16} className="overflow-hidden" style={{ borderRadius: `${rPx(16)}px` }} />
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-300 font-semibold">{initial}</span>
                </div>
                <span className="text-[9px] text-zinc-400">탭바</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900">
                  <LogoInline svgStr={logoSvgStr} displaySize={24} className="overflow-hidden" style={{ borderRadius: `${rPx(24)}px` }} />
                  <span className="text-sm font-black text-zinc-900 dark:text-white">{initial}</span>
                </div>
                <span className="text-[9px] text-zinc-400">워드마크</span>
              </div>
            </div>
          </Section>

          <Divider />

          {/* Initials */}
          <Section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">이니셜</p>
              <button
                onClick={() => {
                  const next = !uppercase;
                  setUppercase(next);
                  setInitial((prev) => next ? prev.toUpperCase() : prev.toLowerCase());
                }}
                className={`text-[10px] font-black px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${uppercase ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"}`}
              >
                {uppercase ? "AA" : "Aa"}
              </button>
            </div>
            <div className={scrollRow}>
              {(uppercase ? ALPHABET_UPPER : ALPHABET_LOWER).map((l) => (
                <button key={l} onClick={() => setInitial(l)} className={cellCls(initial === l)}>
                  {l}
                </button>
              ))}
            </div>
          </Section>

          <Divider />

          {/* Symbol */}
          <Section>
            <PickerLabel>심볼</PickerLabel>
            <div className={scrollRow}>
              <button
                onClick={() => setSymbol("none")}
                className={`w-11 h-11 flex items-center justify-center rounded-2xl cursor-pointer transition-all select-none flex-shrink-0 border-2 border-dashed ${
                  symbol === "none"
                    ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 scale-95 shadow-md"
                    : "border-zinc-300 dark:border-zinc-600 text-zinc-400 dark:text-zinc-500 hover:border-zinc-500 dark:hover:border-zinc-400"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="1" y1="1" x2="13" y2="13"/>
                  <line x1="13" y1="1" x2="1" y2="13"/>
                </svg>
              </button>
              {LOGO_SYMBOLS.filter((s) => s.id !== "none").map((s) => (
                <Tooltip key={s.id} label={s.id}>
                  <button onClick={() => setSymbol(s.id)} className={cellCls(symbol === s.id)}>
                    <SymbolIcon sym={s} size={18} />
                  </button>
                </Tooltip>
              ))}
            </div>
          </Section>

          <Divider />

          {/* Color */}
          <Section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">색상</p>
              <button
                onClick={() => setGradient((g) => !g)}
                className={`text-[10px] font-black px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${gradient ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"}`}
              >
                그라데이션
              </button>
            </div>
            <div className={scrollRow}>
              {LOGO_COLORS.map(({ name, hex }) => (
                <button
                  key={name}
                  onClick={() => setColor(hex)}
                  className={`w-11 h-11 rounded-2xl cursor-pointer transition-all flex-shrink-0 ${color === hex ? "scale-90 ring-2 ring-offset-2 ring-zinc-900 dark:ring-white" : "hover:scale-95"}`}
                  style={gradient ? { background: `linear-gradient(135deg, ${hex}, ${autoGradientEnd(hex)})` } : { backgroundColor: hex }}
                  title={name}
                />
              ))}
              <label className="w-11 h-11 rounded-2xl cursor-pointer flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 transition-colors relative overflow-hidden flex-shrink-0">
                <span className="text-zinc-400 text-lg font-black">+</span>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              </label>
            </div>
          </Section>

          <Divider />

          {/* Radius */}
          <Section>
            <PickerLabel>모서리</PickerLabel>
            <div className="flex gap-1.5">
              {RADIUS_PRESETS.map((p) => (
                <button key={p.value} onClick={() => setRadius(p.value)} className={cellCls(radius === p.value)}>
                  {p.label}
                </button>
              ))}
            </div>
          </Section>

          <Divider />

          {/* Download */}
          <Section>
            <button
              onClick={() => downloadSvg(buildLogoSvgStr(initial, symbol, color, radius, 512, gradientEnd), `${initial || "logo"}-icon.svg`)}
              className="w-full py-3 rounded-2xl text-sm font-black bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity cursor-pointer mb-3"
            >
              SVG 다운로드 (512×512)
            </button>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900">
              <p className="text-[10px] text-zinc-400 mb-1 font-semibold uppercase tracking-wider">파비콘 CLI</p>
              <code className="text-xs text-zinc-700 dark:text-zinc-300 font-mono">
                npx m1kkit favicon --text={initial || "M"} --color={color}
              </code>
            </div>
          </Section>

          <div className="pb-6" />
        </AppShellContent>
      </AppShell>

      <ThemeDialog
        open={themeOpen}
        onClose={() => setThemeOpen(false)}
        current={color}
        onSelect={setColor}
        dark={dark}
        onDarkToggle={() => setDark((v) => !v)}
      />
    </>
  );
}
