import { Resvg } from "@resvg/resvg-js";

/**
 * Node 쪽 래스터라이저. 브라우저의 `canvas-render.ts` 와 같은 역할이지만
 * `<canvas>` 대신 resvg 를 쓴다. 로고 SVG 는 이미 텍스트가 path 로 변환된
 * 상태(`buildLogoSvgStrForExport`)라 폰트 없이도 동일하게 렌더된다.
 */
export function renderPng(svgStr: string, size: number): Uint8Array {
  const r = new Resvg(svgStr, { fitTo: { mode: "width", value: size } });
  return r.render().asPng();
}

/** SVG 루트 태그를 벗겨 내부 콘텐츠만 돌려준다. */
function innerContent(svgStr: string): string {
  const open = svgStr.indexOf(">");
  const close = svgStr.lastIndexOf("</svg>");
  return open < 0 || close < 0 ? svgStr : svgStr.slice(open + 1, close);
}

/** viewBox 의 변 길이 (정사각 전제 — 로고 SVG 는 항상 정사각). */
function viewBoxSide(svgStr: string): number {
  const m = /viewBox="0 0 ([\d.]+) [\d.]+"/.exec(svgStr);
  return m ? Number(m[1]) : 512;
}

/**
 * Android adaptive icon 용 maskable PNG.
 * 배경색으로 전체를 채우고 로고를 80% 크기로 가운데 배치 (10% 세이프 패딩).
 */
export function renderPngPadded(
  svgStr: string,
  size: number,
  ratio: number,
  bgColor: string,
): Uint8Array {
  const side = viewBoxSide(svgStr);
  const off = (side * (1 - ratio)) / 2;
  const wrapped =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}" viewBox="0 0 ${side} ${side}">` +
    `<rect width="${side}" height="${side}" fill="${bgColor}"/>` +
    `<g transform="translate(${off},${off}) scale(${ratio})">${innerContent(svgStr)}</g>` +
    `</svg>`;
  return renderPng(wrapped, size);
}
