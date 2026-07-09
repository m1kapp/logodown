export type ParsedSvg = {
  vb: number;        // assumes square viewBox "0 0 N N"
  stroke: boolean;   // true if SVG root has stroke="..."; otherwise treated as fill-based
  strokeWidth: number;
  d: string[];
};

function num(el: Element, attr: string, fallback = 0): number {
  return Number(el.getAttribute(attr) || fallback);
}

function circleToPath(el: Element): string {
  const cx = num(el, "cx"), cy = num(el, "cy"), r = num(el, "r");
  return `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy}`;
}

function ellipseToPath(el: Element): string {
  const cx = num(el, "cx"), cy = num(el, "cy"), rx = num(el, "rx"), ry = num(el, "ry");
  return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`;
}

function lineToPath(el: Element): string {
  const x1 = num(el, "x1"), y1 = num(el, "y1"), x2 = num(el, "x2"), y2 = num(el, "y2");
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

function roundedRectPath(x: number, y: number, w: number, h: number, rx: number): string {
  return `M ${x + rx} ${y} H ${x + w - rx} A ${rx} ${rx} 0 0 1 ${x + w} ${y + rx} V ${y + h - rx} A ${rx} ${rx} 0 0 1 ${x + w - rx} ${y + h} H ${x + rx} A ${rx} ${rx} 0 0 1 ${x} ${y + h - rx} V ${y + rx} A ${rx} ${rx} 0 0 1 ${x + rx} ${y} Z`;
}

function rectToPath(el: Element): string {
  const x = num(el, "x"), y = num(el, "y"), w = num(el, "width"), h = num(el, "height"), rx = num(el, "rx");
  return rx > 0 ? roundedRectPath(x, y, w, h, rx) : `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;
}

function pathToPath(el: Element): string | null {
  return el.getAttribute("d") || null;
}

// 태그별 → path 데이터 변환기. 지원 안 하는 태그는 조용히 무시(undefined)
const SHAPE_CONVERTERS: Record<string, (el: Element) => string | null> = {
  path: pathToPath,
  circle: circleToPath,
  ellipse: ellipseToPath,
  line: lineToPath,
  rect: rectToPath,
};

/**
 * Parse a raw SVG string into a flat list of path `d` strings + mode flags.
 * Converts <circle>, <ellipse>, <rect> primitives into equivalent path data
 * so the consumer only needs to emit <path> elements.
 */
export type SymbolEntry = {
  id: string;
  label: string;
  vb: number;
  stroke: boolean;
  strokeWidth?: number;
  d: string[];
};

/**
 * Map an ordered id list + Vite's `import.meta.glob` raw-svg record into
 * parsed symbol entries. `raw` must come from a glob call in the SAME file
 * as the caller — Vite statically analyzes `import.meta.glob` per call site,
 * so it can't be wrapped in a shared function itself.
 */
export function buildSymbolSet(
  order: readonly string[],
  raw: Record<string, string>,
  opts: { source: string; labels?: Record<string, string>; forceStroke?: boolean },
): SymbolEntry[] {
  return order.map((id) => {
    const svg = raw[`./${id}.svg`];
    if (!svg) throw new Error(`[${opts.source}] missing svg file: ${id}.svg`);
    const p = parseSvg(svg);
    return {
      id,
      label: opts.labels?.[id] ?? id,
      vb: p.vb,
      stroke: opts.forceStroke ?? p.stroke,
      strokeWidth: p.strokeWidth,
      d: p.d,
    };
  });
}

export function parseSvg(raw: string): ParsedSvg {
  const doc = new DOMParser().parseFromString(raw, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (!svg) throw new Error("parseSvg: no <svg> root");

  const vbAttr = svg.getAttribute("viewBox") || "0 0 24 24";
  const vb = Number(vbAttr.split(/\s+/)[2]) || 24;

  const strokeAttr = svg.getAttribute("stroke");
  const stroke = !!strokeAttr && strokeAttr !== "none";
  const strokeWidth = Number(svg.getAttribute("stroke-width") || "2");

  const d = Array.from(svg.children)
    .map((el) => SHAPE_CONVERTERS[el.tagName.toLowerCase()]?.(el) ?? null)
    .filter((v): v is string => v != null);

  return { vb, stroke, strokeWidth, d };
}
