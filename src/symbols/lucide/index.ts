import { buildSymbolSet, type SymbolEntry } from "../parse";

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
  // animals
  "rabbit",
  "fish",
  "bird",
  "dog",
  "cat",
  "panda",
  // weather · nature (flame·diamond은 LOGO_SYMBOLS에 이미 손그림 버전이 있어 제외 — id 충돌)
  "droplet",
  "snowflake",
  "wind",
  "waves",
  "tornado",
  "sparkles",
  "flower",
  "clover",
  // luxe · abstract
  "crown",
  "puzzle",
  "magnet",
  // exploration
  "compass",
  "map",
  "telescope",
  "binoculars",
  "satellite",
  "orbit",
  // science
  "atom",
  "dna",
  "microscope",
  "beaker",
  "pill",
  "syringe",
  "stethoscope",
  // food · drink
  "apple",
  "carrot",
  "pizza",
  "cookie",
  "cake",
  "wine",
  "beer",
  "donut",
  "fan",
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

export type LucideSymbol = SymbolEntry & { stroke: true };

export const LUCIDE_SYMBOLS = buildSymbolSet(ORDER, RAW, {
  source: "lucide", labels: LABELS, forceStroke: true,
}) as LucideSymbol[];
