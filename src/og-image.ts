import { loadExportFonts } from "./fonts";
import type { SeoPackInput } from "./seo-pack";

/* ══════════════════════════════════════════════
   OG 이미지 (1200×630) — 로고 + 워드마크 + 슬로건
══════════════════════════════════════════════ */

const W = 1200, H = 630;
const LOGO = 320, LOGO_X = 110;
const TEXT_X = LOGO_X + LOGO + 70;
const TEXT_MAX = W - TEXT_X - 60; // 글자가 오른쪽 끝을 넘지 않게

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/** SVG 루트 태그를 벗겨 내부 콘텐츠만 돌려준다. */
function inner(svgStr: string): string {
  const open = svgStr.indexOf(">");
  const close = svgStr.lastIndexOf("</svg>");
  return open < 0 || close < 0 ? svgStr : svgStr.slice(open + 1, close);
}

/** 아이콘 정의는 루트 defs로 올리고, 실제 도형은 그림자/본체에 재사용한다. */
function splitInner(svgStr: string): { defs: string; drawable: string } {
  const content = inner(svgStr);
  const defs = [...content.matchAll(/<defs>([\s\S]*?)<\/defs>/g)]
    .map((match) => match[1])
    .join("");
  return { defs, drawable: content.replace(/<defs>[\s\S]*?<\/defs>/g, "") };
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

  /** 이 폭 안에 들어가는 글자 크기(넘치면 줄인다). */
  const fit = (text: string, size: number) => Math.min(size, (size * TEXT_MAX) / pretendard.getAdvanceWidth(text, size));

  // 브랜드명이 한 줄에 80px 아래로 줄어들 만큼 길면, 띄어쓰기에서 두 줄로 나눈다(두 줄 폭이 가장 비슷한 곳)
  let title = [input.brandName], titleSize = fit(input.brandName, 110);
  const words = input.brandName.split(" ");
  if (titleSize < 80 && words.length > 1) {
    const splits = words.slice(1).map((_, i) => [words.slice(0, i + 1).join(" "), words.slice(i + 1).join(" ")]);
    title = splits.reduce((a, b) => (Math.max(...b.map((t) => pretendard.getAdvanceWidth(t, 100))) < Math.max(...a.map((t) => pretendard.getAdvanceWidth(t, 100))) ? b : a));
    titleSize = Math.min(96, ...title.map((t) => fit(t, 96)));
  }
  const lead = titleSize * 1.15;
  const titleTop = H / 2 - (lead * (title.length - 1) + 90) / 2; // 제목 줄들 + 슬로건 묶음을 세로 가운데로

  const side = viewBoxSide(input.iconSvg);
  const sc = LOGO / side;
  const logoY = (H - LOGO) / 2;
  const icon = splitInner(input.iconSvg);

  // feDropShadow는 원본 그래픽까지 필터 안에서 다시 합성해, 그라디언트 아이콘을
  // 축소할 때 밴딩이 생긴다. SourceAlpha로 그림자만 만들고 본체는 밖에서 그린다.
  const defs = [
    input.bgGradEnd
      ? `<linearGradient id="og" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${esc(input.bgColor)}"/><stop offset="100%" stop-color="${esc(input.bgGradEnd)}"/></linearGradient>`
      : "",
    icon.defs,
    `<filter id="ogs" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceAlpha" stdDeviation="18" result="blur"/><feOffset in="blur" dx="0" dy="10" result="offset"/><feFlood flood-color="#000000" flood-opacity="0.28" result="color"/><feComposite in="color" in2="offset" operator="in"/></filter>`,
  ].join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    `<defs>${defs}</defs>`,
    `<rect width="${W}" height="${H}" fill="${input.bgGradEnd ? "url(#og)" : esc(input.bgColor)}"/>`,
    `<g filter="url(#ogs)"><g transform="translate(${LOGO_X},${logoY}) scale(${sc.toFixed(4)})">${icon.drawable}</g></g>`,
    `<g transform="translate(${LOGO_X},${logoY}) scale(${sc.toFixed(4)})">${icon.drawable}</g>`,
    ...title.map((t, i) => line(t, titleSize, titleTop + i * lead, input.textColor)),
    line(input.slogan, fit(input.slogan, 32), titleTop + (title.length - 1) * lead + 90, input.textColor, 0.7),
    `</svg>`,
  ].join("");
}
