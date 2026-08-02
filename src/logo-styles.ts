import { isLightHex, autoGradientEnd } from "./logo-engine";

export const LOGO_COLORS = [
  { name: "black",    hex: "#09090b" },
  { name: "charcoal", hex: "#27272a" },
  { name: "slate",    hex: "#334155" },
  // violet / purple
  { name: "violet",   hex: "#7c3aed" },
  { name: "purple",   hex: "#8b5cf6" },
  { name: "fuchsia",  hex: "#d946ef" },
  // indigo / navy
  { name: "indigo",   hex: "#312e81" },
  { name: "navy",     hex: "#1e3a5f" },
  // blue / sky / cyan
  { name: "blue",     hex: "#3b82f6" },
  { name: "sky",      hex: "#38bdf8" },
  { name: "cyan",     hex: "#06b6d4" },
  // teal / green
  { name: "teal",     hex: "#0d9488" },
  { name: "emerald",  hex: "#10b981" },
  { name: "forest",   hex: "#14532d" },
  { name: "lime",     hex: "#84cc16" },
  // yellow / amber
  { name: "yellow",   hex: "#eab308" },
  { name: "amber",    hex: "#f59e0b" },
  // orange
  { name: "orange",   hex: "#f97316" },
  // red / maroon
  { name: "red",      hex: "#ef4444" },
  { name: "maroon",   hex: "#7f1d1d" },
  // pink / rose (red family)
  { name: "pink",     hex: "#ec4899" },
  { name: "rose",     hex: "#fb7185" },
  // warm neutrals / white
  { name: "brown",    hex: "#78350f" },
  { name: "white",    hex: "#fafafa" },
  // brand colors — for logos meant to sit next to these tools
  { name: "claude",    hex: "#D97757" },
  { name: "openai",    hex: "#10A37F" },
  { name: "figma",     hex: "#A259FF" },
  { name: "linear",    hex: "#5E6AD2" },
  { name: "stripe",    hex: "#635BFF" },
  { name: "slack",     hex: "#4A154B" },
  { name: "discord",   hex: "#5865F2" },
  { name: "spotify",   hex: "#1DB954" },
  { name: "instagram", hex: "#E1306C" },
  { name: "whatsapp",  hex: "#25D366" },
  { name: "telegram",  hex: "#26A5E4" },
  { name: "linkedin",  hex: "#0A66C2" },
  { name: "tiktok",    hex: "#FE2C55" },
  { name: "youtube",   hex: "#FF0000" },
  { name: "netflix",   hex: "#E50914" },
  { name: "twitch",    hex: "#9146FF" },
  { name: "reddit",    hex: "#FF4500" },
];
export const LOGO_RADIUS = 0.15;

/* ══════════════════════════════════════════════
   Style presets: bg × text color scheme
══════════════════════════════════════════════ */
export const LOGO_STYLES = [
  { id: "solid",       label: "solid"    },
  { id: "gradient",    label: "gradient" },
  { id: "onWhite",     label: "white"    },
  { id: "onWhiteGrad", label: "white +"  },
  { id: "onBlack",     label: "dark"     },
  { id: "onBlackGrad", label: "dark +"   },
  { id: "colorWhite",     label: "color w"  },
  { id: "colorWhiteGrad", label: "color w+" },
  { id: "outline",     label: "outline"  },
  { id: "outlineGrad", label: "outline +" },
] as const;
export type StyleId = typeof LOGO_STYLES[number]["id"];

/** 5 base style families × {solid, gradient} colorMode = 10 actual style ids. */
export type StyleBaseId = "color" | "colorWhite" | "onWhite" | "onBlack" | "outline";
export const STYLE_BASES: { id: StyleBaseId; label: string }[] = [
  { id: "colorWhite", label: "흰 문자"   },
  { id: "color",      label: "다크 문자" },
  { id: "onWhite",    label: "화이트"    },
  { id: "onBlack",    label: "다크"      },
  { id: "outline",    label: "아웃라인"  },
];
// base × colorMode → 실제 StyleId. 분기 대신 표로 조회.
const STYLE_ID_BY_BASE: Record<StyleBaseId, { solid: StyleId; gradient: StyleId }> = {
  color:      { solid: "solid",      gradient: "gradient" },
  colorWhite: { solid: "colorWhite", gradient: "colorWhiteGrad" },
  onWhite:    { solid: "onWhite",    gradient: "onWhiteGrad" },
  onBlack:    { solid: "onBlack",    gradient: "onBlackGrad" },
  outline:    { solid: "outline",    gradient: "outlineGrad" },
};
export function resolveStyleId(base: StyleBaseId, mode: "solid" | "gradient"): StyleId {
  return STYLE_ID_BY_BASE[base][mode];
}

export function resolveStyle(styleId: StyleId, color: string): {
  bg: string;
  bgGradEnd?: string;
  textColor?: string;
  textGradEnd?: string;
  /** 아웃라인 스타일 전용 — 둥근 사각 테두리 색. 없으면 테두리 없음. */
  frame?: string;
} {
  const WHITE = "#fafafa";
  const BLACK = "#09090b";
  const autoText = isLightHex(color) ? BLACK : "#ffffff";
  const end = autoGradientEnd(color);
  switch (styleId) {
    case "solid":       return { bg: color, textColor: autoText };
    case "gradient":    return { bg: color, bgGradEnd: end, textColor: autoText };
    case "onWhite":     return { bg: WHITE, textColor: color };
    case "onWhiteGrad": return { bg: WHITE, textColor: color, textGradEnd: end };
    case "colorWhite":     return { bg: color, textColor: "#ffffff" };
    case "colorWhiteGrad": return { bg: color, bgGradEnd: end, textColor: "#ffffff" };
    case "onBlack":       return { bg: BLACK, textColor: color };
    case "onBlackGrad":   return { bg: BLACK, textColor: color, textGradEnd: end };
    // 마크다운 마크 룩 — 배경 없이 테두리 선 + 같은 색 글리프.
    case "outline":     return { bg: "none", textColor: color, frame: color };
    case "outlineGrad": return { bg: "none", textColor: color, textGradEnd: end, frame: color };
  }
}
