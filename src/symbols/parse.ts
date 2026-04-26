export type ParsedSvg = {
  vb: number;        // assumes square viewBox "0 0 N N"
  stroke: boolean;   // true if SVG root has stroke="..."; otherwise treated as fill-based
  strokeWidth: number;
  d: string[];
};

/**
 * Parse a raw SVG string into a flat list of path `d` strings + mode flags.
 * Converts <circle>, <ellipse>, <rect> primitives into equivalent path data
 * so the consumer only needs to emit <path> elements.
 */
export function parseSvg(raw: string): ParsedSvg {
  const doc = new DOMParser().parseFromString(raw, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (!svg) throw new Error("parseSvg: no <svg> root");

  const vbAttr = svg.getAttribute("viewBox") || "0 0 24 24";
  const vb = Number(vbAttr.split(/\s+/)[2]) || 24;

  const strokeAttr = svg.getAttribute("stroke");
  const stroke = !!strokeAttr && strokeAttr !== "none";
  const strokeWidth = Number(svg.getAttribute("stroke-width") || "2");

  const d: string[] = [];
  for (const el of Array.from(svg.children)) {
    const tag = el.tagName.toLowerCase();
    if (tag === "path") {
      const dAttr = el.getAttribute("d");
      if (dAttr) d.push(dAttr);
    } else if (tag === "circle") {
      const cx = Number(el.getAttribute("cx"));
      const cy = Number(el.getAttribute("cy"));
      const r = Number(el.getAttribute("r"));
      d.push(`M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy}`);
    } else if (tag === "ellipse") {
      const cx = Number(el.getAttribute("cx"));
      const cy = Number(el.getAttribute("cy"));
      const rx = Number(el.getAttribute("rx"));
      const ry = Number(el.getAttribute("ry"));
      d.push(`M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`);
    } else if (tag === "line") {
      const x1 = Number(el.getAttribute("x1") || 0);
      const y1 = Number(el.getAttribute("y1") || 0);
      const x2 = Number(el.getAttribute("x2") || 0);
      const y2 = Number(el.getAttribute("y2") || 0);
      d.push(`M ${x1} ${y1} L ${x2} ${y2}`);
    } else if (tag === "rect") {
      const x = Number(el.getAttribute("x") || 0);
      const y = Number(el.getAttribute("y") || 0);
      const w = Number(el.getAttribute("width"));
      const h = Number(el.getAttribute("height"));
      const rx = Number(el.getAttribute("rx") || 0);
      if (rx > 0) {
        d.push(`M ${x + rx} ${y} H ${x + w - rx} A ${rx} ${rx} 0 0 1 ${x + w} ${y + rx} V ${y + h - rx} A ${rx} ${rx} 0 0 1 ${x + w - rx} ${y + h} H ${x + rx} A ${rx} ${rx} 0 0 1 ${x} ${y + h - rx} V ${y + rx} A ${rx} ${rx} 0 0 1 ${x + rx} ${y} Z`);
      } else {
        d.push(`M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`);
      }
    }
  }

  return { vb, stroke, strokeWidth, d };
}
