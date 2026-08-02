export type ParsedSvg = {
  vb: number;        // assumes square viewBox "0 0 N N"
  stroke: boolean;   // true if SVG root has stroke="..."; otherwise treated as fill-based
  strokeWidth: number;
  d: string[];
};

/** DOM `Element` 중 이 파서가 실제로 쓰는 부분만. Node 폴백도 이 모양을 맞춘다. */
type SvgNode = { tagName: string; getAttribute(name: string): string | null };

function num(el: SvgNode, attr: string, fallback = 0): number {
  return Number(el.getAttribute(attr) || fallback);
}

// 타원(원 포함)을 두 개의 반원 호(arc)로 그린 path 데이터. 원은 rx===ry인 특수 케이스.
function ovalPath(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`;
}

function circleToPath(el: SvgNode): string {
  const cx = num(el, "cx"), cy = num(el, "cy"), r = num(el, "r");
  return ovalPath(cx, cy, r, r);
}

function ellipseToPath(el: SvgNode): string {
  const cx = num(el, "cx"), cy = num(el, "cy"), rx = num(el, "rx"), ry = num(el, "ry");
  return ovalPath(cx, cy, rx, ry);
}

function lineToPath(el: SvgNode): string {
  const x1 = num(el, "x1"), y1 = num(el, "y1"), x2 = num(el, "x2"), y2 = num(el, "y2");
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

function roundedRectPath(x: number, y: number, w: number, h: number, rx: number): string {
  return `M ${x + rx} ${y} H ${x + w - rx} A ${rx} ${rx} 0 0 1 ${x + w} ${y + rx} V ${y + h - rx} A ${rx} ${rx} 0 0 1 ${x + w - rx} ${y + h} H ${x + rx} A ${rx} ${rx} 0 0 1 ${x} ${y + h - rx} V ${y + rx} A ${rx} ${rx} 0 0 1 ${x + rx} ${y} Z`;
}

function rectToPath(el: SvgNode): string {
  const x = num(el, "x"), y = num(el, "y"), w = num(el, "width"), h = num(el, "height"), rx = num(el, "rx");
  return rx > 0 ? roundedRectPath(x, y, w, h, rx) : `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;
}

function pathToPath(el: SvgNode): string | null {
  return el.getAttribute("d") || null;
}

// 태그별 → path 데이터 변환기. 지원 안 하는 태그는 조용히 무시(undefined)
const SHAPE_CONVERTERS: Record<string, (el: SvgNode) => string | null> = {
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

/* ── raw SVG → { root, children } ────────────────────────────── */

type SvgTree = { root: SvgNode; children: SvgNode[] };

/** 브라우저: DOMParser. */
function readWithDom(raw: string): SvgTree {
  const doc = new DOMParser().parseFromString(raw, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (!svg) throw new Error("parseSvg: no <svg> root");
  return { root: svg, children: Array.from(svg.children) };
}

const ATTR_RE = /([\w:-]+)\s*=\s*"([^"]*)"/g;

function nodeFrom(tagName: string, attrSrc: string): SvgNode {
  const attrs = new Map<string, string>();
  for (const m of attrSrc.matchAll(ATTR_RE)) attrs.set(m[1], m[2]);
  return { tagName, getAttribute: (name) => attrs.get(name) ?? null };
}

/**
 * Node(CLI): DOMParser 가 없으므로 직접 훑는다. 심볼 SVG 는 루트 바로 아래에
 * 도형이 평평하게 놓인 단순한 파일들이라 이 정도로 충분하다.
 */
function readWithRegex(raw: string): SvgTree {
  const open = /<svg\b([^>]*)>/i.exec(raw);
  if (!open) throw new Error("parseSvg: no <svg> root");
  const body = raw.slice(open.index + open[0].length);

  const children: SvgNode[] = [];
  const shapes = Object.keys(SHAPE_CONVERTERS).join("|");
  for (const m of body.matchAll(new RegExp(`<(${shapes})\\b([^>]*?)/?>`, "gi"))) {
    children.push(nodeFrom(m[1], m[2]));
  }
  return { root: nodeFrom("svg", open[1]), children };
}

export function parseSvg(raw: string): ParsedSvg {
  const { root, children } =
    typeof DOMParser === "undefined" ? readWithRegex(raw) : readWithDom(raw);

  const vbAttr = root.getAttribute("viewBox") || "0 0 24 24";
  const vb = Number(vbAttr.split(/\s+/)[2]) || 24;

  const strokeAttr = root.getAttribute("stroke");
  const stroke = !!strokeAttr && strokeAttr !== "none";
  const strokeWidth = Number(root.getAttribute("stroke-width") || "2");

  const d = children
    .map((el) => SHAPE_CONVERTERS[el.tagName.toLowerCase()]?.(el) ?? null)
    .filter((v): v is string => v != null);

  return { vb, stroke, strokeWidth, d };
}
