import { loadExportFonts } from "./fonts";
import type { SeoPackInput } from "./seo-pack";

/* ══════════════════════════════════════════════
   OG 이미지 (1200×630) — 로고 + 워드마크 + 슬로건
══════════════════════════════════════════════ */

const W = 1200, H = 630;
const LOGO = 320, LOGO_X = 110;
const TEXT_X = LOGO_X + LOGO + 70;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/** SVG 루트 태그를 벗겨 내부 콘텐츠만 돌려준다. */
function inner(svgStr: string): string {
  const open = svgStr.indexOf(">");
  const close = svgStr.lastIndexOf("</svg>");
  return open < 0 || close < 0 ? svgStr : svgStr.slice(open + 1, close);
}

function viewBoxSide(svgStr: string): number {
  const m = /viewBox="0 0 ([\d.]+) [\d.]+"/.exec(svgStr);
  return m ? Number(m[1]) : 512;
}

/**
 * OG 카드를 SVG 문자열로 만든다.
 *
 * 글자는 opentype 으로 path 변환한다 — 브라우저 canvas 의 `fillText` 나 SVG
 * `<text>` 를 쓰면 실행 환경에 그 폰트가 있어야 해서, 같은 입력이 브라우저와
 * CLI 에서 다르게 나온다. path 로 구우면 어디서 래스터화하든 동일하다.
 */
export async function buildOgSvgStr(input: SeoPackInput): Promise<string> {
  const { pretendard } = await loadExportFonts();

  /** 왼쪽 정렬 + 지정한 y 를 잉크 세로 중심으로 맞춘 path. */
  const line = (text: string, size: number, centerY: number, fill: string, opacity = 1) => {
    if (!text) return "";
    const b = pretendard.getPath(text, 0, 0, size).getBoundingBox();
    const dy = centerY - (b.y1 + b.y2) / 2;
    const p = pretendard.getPath(text, TEXT_X - b.x1, dy, size);
    const op = opacity !== 1 ? ` opacity="${opacity}"` : "";
    return `<path d="${p.toPathData(2)}" fill="${esc(fill)}"${op}/>`;
  };

  const side = viewBoxSide(input.iconSvg);
  const sc = LOGO / side;
  const logoY = (H - LOGO) / 2;

  // 로고와 카드 배경이 같은 색이라 그냥 얹으면 경계가 사라진다. 그림자로 띄운다.
  const defs = [
    input.bgGradEnd
      ? `<linearGradient id="og" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${esc(input.bgColor)}"/><stop offset="100%" stop-color="${esc(input.bgGradEnd)}"/></linearGradient>`
      : "",
    `<filter id="ogs" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="18" flood-opacity="0.28"/></filter>`,
  ].join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    `<defs>${defs}</defs>`,
    `<rect width="${W}" height="${H}" fill="${input.bgGradEnd ? "url(#og)" : esc(input.bgColor)}"/>`,
    `<g filter="url(#ogs)"><g transform="translate(${LOGO_X},${logoY}) scale(${sc.toFixed(4)})">${inner(input.iconSvg)}</g></g>`,
    line(input.brandName, 110, H / 2 - 45, input.textColor),
    line(input.slogan, 32, H / 2 + 45, input.textColor, 0.7),
    `</svg>`,
  ].join("");
}
