import { parseSvg } from "../parse";

/**
 * Custom fill-based symbols (SVG root has no `stroke` attribute → treated as filled).
 * Add a new one: drop `<id>.svg` here and append the id to ORDER.
 */
const ORDER = [
  "heart",
  "heart2",
  "heart3",
] as const;

const LABELS: Record<string, string> = {};

const RAW = import.meta.glob<string>("./*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

export type CustomSymbol = {
  id: string;
  label: string;
  vb: number;
  stroke: boolean;
  strokeWidth?: number;
  d: string[];
};

export const CUSTOM_SYMBOLS: CustomSymbol[] = ORDER.map((id) => {
  const raw = RAW[`./${id}.svg`];
  if (!raw) throw new Error(`[custom] missing svg file: ${id}.svg`);
  const p = parseSvg(raw);
  return {
    id,
    label: LABELS[id] ?? id,
    vb: p.vb,
    stroke: p.stroke,
    strokeWidth: p.strokeWidth,
    d: p.d,
  };
});
