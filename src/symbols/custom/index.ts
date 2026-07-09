import { buildSymbolSet, type SymbolEntry } from "../parse";

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

export type CustomSymbol = SymbolEntry;

export const CUSTOM_SYMBOLS: CustomSymbol[] = buildSymbolSet(ORDER, RAW, {
  source: "custom", labels: LABELS,
});
