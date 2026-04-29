import { parseSvg } from "../parse";

/**
 * Display-order for lucide symbols. `id` = filename without `.svg`.
 * Adding a new lucide icon: drop `<id>.svg` into this folder and append id here.
 */
const ORDER = [
  "codecrafters",
  "burger",
  "sharkfin",
  "volleyball",
  "trees",
  "planet",
  "popper",
  "ghost",
  "lemon",
  "hatglasses",
  "gift",
  "forkknife",
  "tulip",
  "elephant",
  "crab",
  "coffeebean",
  "cactus",
  "bottle",
  "basketball",
  "waveform",
  // simple · sophisticated
  "moon",
  "feather",
  "leaf",
  "anchor",
  "gem",
  // brand-friendly icons
  "rocket",
  "mountain",
  "camera",
  "music",
  "coffee",
  "palette",
  "globe",
  "wand",
  // concept icons
  "lightbulb",
  "shield",
  "trophy",
  "target",
  "brain",
  "cloud",
  "sun",
  "sprout",
  "gamepad",
  "infinity",
  "megaphone",
  "gradcap",
  "pen",
  "flask",
  "handshake",
  "key",
  // tool · craft
  "hammer",
  "gavel",
  "wrench",
  "settings",
  "scissors",
  "pocketknife",
  "sword",
  "paintroller",
  "box",
  "packageopen",
] as const;

/** Short display labels (fallback: id itself). */
const LABELS: Record<string, string> = {
  codecrafters: "</>",
  sharkfin: "shark",
  volleyball: "vball",
  popper: "popper",
  hatglasses: "hat",
  forkknife: "fork",
  elephant: "eleph",
  coffeebean: "bean",
  basketball: "bball",
  waveform: "wform",
  pocketknife: "knife",
  paintroller: "roller",
  packageopen: "pkg",
};

const RAW = import.meta.glob<string>("./*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

export type LucideSymbol = {
  id: string;
  label: string;
  vb: number;
  stroke: true;
  strokeWidth: number;
  d: string[];
};

export const LUCIDE_SYMBOLS: LucideSymbol[] = ORDER.map((id) => {
  const raw = RAW[`./${id}.svg`];
  if (!raw) throw new Error(`[lucide] missing svg file: ${id}.svg`);
  const p = parseSvg(raw);
  return {
    id,
    label: LABELS[id] ?? id,
    vb: p.vb,
    stroke: true,
    strokeWidth: p.strokeWidth,
    d: p.d,
  };
});
