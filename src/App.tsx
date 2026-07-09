import { useEffect, useMemo, useState } from "react";
import {
  Watermark,
  AppShell, AppShellHeader, AppShellContent,
  TabBar, Tab,
  Section,
  Tooltip, Badge, Button, ShareButton,
  useToast,
} from "@m1kapp/kit";
import { buildSeoPack, type SeoPackCategory } from "./seo-pack";
import {
  LOGO_SYMBOLS, isLightHex, autoGradientEnd,
  type Slot, type SlotKind, type TextRenderer,
  buildLogoSvgStr, buildLogoSvgStrForExport, buildLogoSvgStrForMaskable,
  downloadSvg, downloadPng,
} from "./logo-engine";

/* ══════════════════════════════════════════════
   UI helpers
══════════════════════════════════════════════ */
function LogoInline({ svgStr, displaySize, className, style }: {
  svgStr: string; displaySize: number; className?: string; style?: React.CSSProperties;
}) {
  const sized = svgStr.replace(
    /(<svg[^>]+)width="\d+" height="\d+"/,
    `$1width="${displaySize}" height="${displaySize}"`,
  );
  return (
    <div
      className={className}
      style={{ width: displaySize, height: displaySize, flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: sized }}
    />
  );
}

function SymbolIcon({ sym, size = 18 }: { sym: typeof LOGO_SYMBOLS[0]; size?: number }) {
  const vb = sym.vb ?? 100;
  if (sym.isRing) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="currentColor">
        <path fillRule="evenodd" d="M50 5 A45 45 0 1 1 50 95 A45 45 0 1 1 50 5 Z M50 20 A30 30 0 1 0 50 80 A30 30 0 1 0 50 20 Z" />
      </svg>
    );
  }
  const rot = sym.rotate != null ? `rotate(${sym.rotate}, ${vb / 2}, ${vb / 2})` : undefined;
  const dList = Array.isArray(sym.d) ? sym.d : [sym.d as string];
  if (sym.stroke) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill="none" stroke="currentColor" strokeWidth={sym.strokeWidth ?? 2} strokeLinecap="round" strokeLinejoin="round">
        {dList.map((d, i) => <path key={i} d={d} transform={rot} />)}
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill="currentColor">
      {dList.map((d, i) => (
        <path key={i} d={d} fillRule={(sym.fillRule as React.SVGAttributes<SVGPathElement>["fillRule"]) ?? "nonzero"} transform={rot} />
      ))}
    </svg>
  );
}

function PickerHeader({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-[12px] font-bold text-zinc-900 tracking-tight">{label}</span>
      {right}
    </div>
  );
}

function SegmentControl<T extends string>({ options, value, onChange }: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex p-0.5 rounded-lg bg-zinc-100">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
            value === o.id
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════
   Constants
══════════════════════════════════════════════ */
const ALPHABET_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const ALPHABET_LOWER = "abcdefghijklmnopqrstuvwxyz".split("");
const NUMBERS = Array.from({ length: 100 }, (_, i) => String(i)); // "0" ~ "99"
// Curated single-syllable Hangul characters that read well as a logo glyph.
const HANGUL_CHARS = [
  "한","꿈","별","불","빛","달","해","산","강","길",
  "꽃","봄","눈","비","물","흙","힘","솔","숲","섬",
  "품","멋","맛","곰","숨","잎","뜻","돌","뜰","맘",
  "용","햇","첫","온","앞","글","맥","참","끝","님",
];

type CharMode = "upper" | "lower" | "num" | "hangul";
type PickerMode = CharMode | "symbol";
const MODE_OPTIONS: { id: PickerMode; label: string }[] = [
  { id: "upper",  label: "AA" },
  { id: "lower",  label: "Aa" },
  { id: "num",    label: "12" },
  { id: "hangul", label: "한글" },
  { id: "symbol", label: "심볼" },
];
function charsForMode(m: CharMode) {
  switch (m) {
    case "upper":  return ALPHABET_UPPER;
    case "lower":  return ALPHABET_LOWER;
    case "num":    return NUMBERS;
    case "hangul": return HANGUL_CHARS;
  }
}
// black → reverse rainbow (violet → red) → neutrals
const LOGO_COLORS = [
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
  { name: "netflix",   hex: "#E50914" },
  { name: "twitch",    hex: "#9146FF" },
  { name: "reddit",    hex: "#FF4500" },
];
const LOGO_RADIUS = 0.15;

/* ══════════════════════════════════════════════
   Style presets: bg × text color scheme
══════════════════════════════════════════════ */
const LOGO_STYLES = [
  { id: "solid",       label: "solid"    },
  { id: "gradient",    label: "gradient" },
  { id: "onWhite",     label: "white"    },
  { id: "onWhiteGrad", label: "white +"  },
  { id: "onBlack",     label: "dark"     },
  { id: "onBlackGrad", label: "dark +"   },
  { id: "colorWhite",     label: "color w"  },
  { id: "colorWhiteGrad", label: "color w+" },
] as const;
type StyleId = typeof LOGO_STYLES[number]["id"];

/** 4 base style families × {solid, gradient} colorMode = 8 actual style ids. */
type StyleBaseId = "color" | "colorWhite" | "onWhite" | "onBlack";
const STYLE_BASES: { id: StyleBaseId; label: string }[] = [
  { id: "colorWhite", label: "흰 문자"   },
  { id: "color",      label: "다크 문자" },
  { id: "onWhite",    label: "화이트"    },
  { id: "onBlack",    label: "다크"      },
];
function resolveStyleId(base: StyleBaseId, mode: "solid" | "gradient"): StyleId {
  if (base === "color")      return mode === "gradient" ? "gradient"      : "solid";
  if (base === "colorWhite") return mode === "gradient" ? "colorWhiteGrad" : "colorWhite";
  if (base === "onWhite")    return mode === "gradient" ? "onWhiteGrad"   : "onWhite";
  return mode === "gradient" ? "onBlackGrad" : "onBlack";
}

function resolveStyle(styleId: StyleId, color: string): {
  bg: string;
  bgGradEnd?: string;
  textColor?: string;
  textGradEnd?: string;
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
  }
}

type ShowcaseLogo = {
  front: Slot;
  back: Slot;
  color: string;
  style: StyleId;
  fr?: number; // front rotate
  br?: number; // back rotate
  fs?: number; // front scale
  bs?: number; // back scale
};

// Hand-picked combinations that showcase the tool's range.
// Color hues are intentionally distributed across the spectrum.
// fr/br = front/back rotate, fs/bs = front/back scale
const HOME_SHOWCASE: ShowcaseLogo[] = [
  // 1. Markdown 아이덴티티 — 반드시 첫 번째
  { front: { kind: "char", value: "M"  }, back: { kind: "symbol", value: "down"     }, color: "#09090b", style: "solid"                                 },
  // 2. 로켓 발사 — 45° 기울어진 로켓, 그라데이션
  { front: { kind: "char", value: "N"  }, back: { kind: "symbol", value: "rocket"   }, color: "#3b82f6", style: "gradient",     br: 45, bs: 1.10         },
  // 3. 심볼 앞 배치 — 톱니바퀴 + 이니셜, 화이트 위 컬러
  { front: { kind: "symbol", value: "settings" }, back: { kind: "char", value: "k"  }, color: "#0d9488", style: "onWhiteGrad",  fr: 0, fs: 1.15          },
  // 4. 한글 · 별 — 다크 배경에 골드
  { front: { kind: "char", value: "별" }, back: { kind: "symbol", value: "star"     }, color: "#eab308", style: "onBlack",      bs: 1.10                 },
  // 5. 번개 — 바이올렛 그라데
  { front: { kind: "char", value: "S"  }, back: { kind: "symbol", value: "zap"      }, color: "#7c3aed", style: "gradient",     bs: 1.15                 },
  // 6. 망치 — 오렌지, 살짝 기울임
  { front: { kind: "char", value: "B"  }, back: { kind: "symbol", value: "hammer"   }, color: "#f97316", style: "solid",        br: 315                  },
  // 7. 다이아몬드 — 틸, 45° 회전으로 정사각형처럼
  { front: { kind: "char", value: "D"  }, back: { kind: "symbol", value: "diamond"  }, color: "#06b6d4", style: "solid",        br: 45                   },
  // 8. 소문자 필기체 + 깃털 — 로즈, 우아하게
  { front: { kind: "char", value: "a"  }, back: { kind: "symbol", value: "feather"  }, color: "#fb7185", style: "onWhite",      br: 315, bs: 1.10        },
  // 9. 검 — 다크 배경에 퍼플, 대각선
  { front: { kind: "char", value: "X"  }, back: { kind: "symbol", value: "sword"    }, color: "#a855f7", style: "onBlackGrad",  br: 0, bs: 1.15          },
  // 10. 한글 꿈 + 혜성 — 푸시아
  { front: { kind: "char", value: "꿈" }, back: { kind: "symbol", value: "meteor2"  }, color: "#d946ef", style: "onBlackGrad",  bs: 1.05                 },
  // 11. 불꽃 + 스케일업 — 레드
  { front: { kind: "char", value: "F"  }, back: { kind: "symbol", value: "flame"    }, color: "#ef4444", style: "gradient",     bs: 1.20                 },
  // 12. 렌치 — 라임, 공구 느낌
  { front: { kind: "symbol", value: "wrench" }, back: { kind: "char", value: "42"   }, color: "#84cc16", style: "solid",        fr: 315, fs: 1.10        },
];

function DiceIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
      <path d="M16 8h.01"/>
      <path d="M8 8h.01"/>
      <path d="M8 16h.01"/>
      <path d="M16 16h.01"/>
      <path d="M12 12h.01"/>
    </svg>
  );
}

// Row-major 2-row grid with horizontal scroll: fills row 1 fully, then row 2.
function ColorSwatch({ name, hex, active, gradient, onClick }: {
  name: string; hex: string; active: boolean; gradient: boolean; onClick: () => void;
}) {
  const swatchBg = gradient ? `linear-gradient(135deg, ${hex}, ${autoGradientEnd(hex)})` : undefined;
  // 흰색/거의-흰색 스와치는 카드 배경(zinc-50 ≈ #fafafa)과 구분이 안 돼 '빈칸'처럼
  // 보이므로 테두리 추가 (일반 밝은 색은 채도가 있어 문제없음, near-white만 타겟)
  const [r, g, b] = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((h) => parseInt(h, 16) || 0);
  const needsBorder = !gradient && r > 235 && g > 235 && b > 235;
  return (
    <button
      onClick={onClick}
      className={`relative w-10 h-10 rounded-lg cursor-pointer transition-all flex items-center justify-center ${active ? "scale-90 shadow-md" : "hover:scale-95"} ${needsBorder ? "border border-zinc-300" : ""}`}
      style={swatchBg ? { background: swatchBg } : { backgroundColor: hex }}
      title={name}
    >
      {active && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isLightHex(hex) ? "#09090b" : "#ffffff"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );
}

function gridStyle(itemCount: number, cellSize = "2.5rem"): React.CSSProperties {
  const cols = Math.max(1, Math.ceil(itemCount / 2));
  return {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, ${cellSize})`,
    gridTemplateRows: `repeat(2, ${cellSize})`,
    gap: "0.375rem",
  };
}

function DownloadIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function HomeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function WandIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" />
      <path d="m14 7 3 3" />
      <path d="M5 6v4" />
      <path d="M19 14v4" />
      <path d="M10 2v2" />
      <path d="M7 8H3" />
      <path d="M21 16h-4" />
      <path d="M11 3H9" />
    </svg>
  );
}

function HomeView({ onStart }: { onStart: () => void }) {
  const rowA = useMemo(() => {
    const half = HOME_SHOWCASE.slice(0, 6);
    return [...half, ...half];
  }, []);
  const rowB = useMemo(() => {
    const half = HOME_SHOWCASE.slice(6, 12);
    return [...half, ...half];
  }, []);
  const renderCfg = (c: ShowcaseLogo, size: number) => {
    const s = resolveStyle(c.style, c.color);
    return buildLogoSvgStr(c.front, c.back, s.bg, LOGO_RADIUS, size, s.bgGradEnd, s.textColor, s.textGradEnd,
      { frontRotate: c.fr, backRotate: c.br, frontScale: c.fs, backScale: c.bs });
  };

  const initialCount = ALPHABET_UPPER.length + ALPHABET_LOWER.length + NUMBERS.length + HANGUL_CHARS.length;
  const symbolCount = LOGO_SYMBOLS.filter((s) => s.id !== "none").length;

  // Auto-rotating hero logo — cycles through showcase every 1.6s
  const [heroIdx, setHeroIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % HOME_SHOWCASE.length), 1600);
    return () => clearInterval(t);
  }, []);
  const hero = HOME_SHOWCASE[heroIdx];

  return (
    <div className="pb-8">
      {/* HERO ─ giant logo + brand + slogan + primary CTA */}
      <Section className="pt-4 pb-2">
        <div className="flex items-center justify-center mb-5">
          <LogoInline
            svgStr={renderCfg(hero, 400)}
            displaySize={140}
            className="shadow-2xl overflow-hidden transition-all duration-500"
            style={{ borderRadius: `${Math.round(140 * LOGO_RADIUS)}px` }}
          />
        </div>
        <h1 className="text-[44px] font-black leading-none text-zinc-900 tracking-tighter mb-2 text-center">
          logodown
        </h1>
        <p className="text-[15px] text-zinc-500 leading-relaxed mb-4 text-center break-keep">
          Make logos like <span className="font-black text-zinc-700">markdown logo</span>.<br />
          한 글자 + 한 심볼 → <span className="font-black text-zinc-700">파비콘부터 PWA까지</span>
        </p>
        <Button variant="dark" full onClick={onStart} className="py-3 mb-3">
          1분 만에 로고 만들기 →
        </Button>
        {(() => {
          const slotOpts = initialCount + symbolCount;
          const rotateCount = 8;                                // 0° ~ 315°
          const scaleCount = 5;                                 // 1x ~ 1.20x
          const slotCombos = slotOpts * rotateCount * scaleCount;
          const styleCount = 4;                                 // 흰문자 / 다크문자 / 화이트 / 다크
          const modeCount = 2;                                  // 단색 / 그라데
          const paletteColors = LOGO_COLORS.length;             // 24
          const total = slotCombos * slotCombos * styleCount * modeCount * paletteColors;
          const billion = total / 1_0000_0000;
          return (
            <div className="rounded-2xl bg-zinc-50 p-3 break-keep">
              <div className="text-[11px] text-zinc-500 mb-2 leading-relaxed text-center space-y-0.5">
                <div>
                  <span className="font-bold text-zinc-700">이니셜</span>
                  <span className="text-zinc-400"> ({initialCount}) </span>+
                  <span className="font-bold text-zinc-700"> 심볼</span>
                  <span className="text-zinc-400"> ({symbolCount}) </span>×
                  <span className="font-bold text-zinc-700"> 회전</span>
                  <span className="text-zinc-400"> ({rotateCount}) </span>×
                  <span className="font-bold text-zinc-700"> 크기</span>
                  <span className="text-zinc-400"> ({scaleCount})</span>
                  <span className="text-zinc-400"> = {slotCombos.toLocaleString()} / 슬롯</span>
                </div>
                <div>
                  <span className="font-bold text-zinc-700">앞·뒤</span>
                  <span className="text-zinc-400"> ({slotCombos.toLocaleString()})² </span>×
                  <span className="font-bold text-zinc-700"> 스타일</span>
                  <span className="text-zinc-400"> ({styleCount}) </span>×
                  <span className="font-bold text-zinc-700"> 모드</span>
                  <span className="text-zinc-400"> ({modeCount}) </span>×
                  <span className="font-bold text-zinc-700"> 색상</span>
                  <span className="text-zinc-400"> ({paletteColors})</span>
                </div>
              </div>
              <div className="text-lg font-black text-zinc-900 text-center tabular-nums">
                {billion >= 1
                  ? <>{billion.toFixed(1)}<span className="text-zinc-500 text-sm font-bold">억 가지</span></>
                  : <>{total.toLocaleString()}<span className="text-zinc-500 text-sm font-bold">+ 가지</span></>
                }
              </div>
              <div className="text-[10px] text-zinc-400 mt-2 text-center leading-relaxed break-keep">
                두 슬롯 각각 자유 조합, 커스텀 hex 색상까지 포함하면 사실상 무한
              </div>
            </div>
          );
        })()}
      </Section>

      {/* CROSSING MARQUEE ─ visual proof of variety */}
      <div className="my-6 space-y-3 overflow-hidden">
        <div className="flex gap-3 lm-marquee">
          {rowA.map((c, i) => (
            <LogoInline
              key={`a-${i}`}
              svgStr={renderCfg(c, 200)}
              displaySize={84}
              className="shadow-lg overflow-hidden"
              style={{ borderRadius: `${Math.round(84 * LOGO_RADIUS)}px` }}
            />
          ))}
        </div>
        <div className="flex gap-3 lm-marquee" style={{ animationDirection: "reverse" }}>
          {rowB.map((c, i) => (
            <LogoInline
              key={`b-${i}`}
              svgStr={renderCfg(c, 200)}
              displaySize={84}
              className="shadow-lg overflow-hidden"
              style={{ borderRadius: `${Math.round(84 * LOGO_RADIUS)}px` }}
            />
          ))}
        </div>
      </div>

      {/* WHY ─ 3 stacked feature cards with strong typography */}
      <Section className="my-2">
        <h2 className="text-2xl font-black text-zinc-900 mb-4 leading-tight tracking-tight break-keep">
          왜 logodown인가
        </h2>
        <div className="space-y-2">
          <div className="rounded-2xl bg-zinc-50 p-4 break-keep">
            <div className="text-xs font-black text-zinc-400 mb-1 tracking-widest">01</div>
            <div className="text-base font-black text-zinc-900 mb-1">최소 요소, 최대 식별성</div>
            <p className="text-[13px] text-zinc-600 leading-relaxed">
              16px 파비콘부터 빌보드까지 한 번에 살아남는 공식. Markdown · Next · Vue가 증명.
            </p>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4 break-keep">
            <div className="text-xs font-black text-zinc-400 mb-1 tracking-widest">02</div>
            <div className="text-base font-black text-zinc-900 mb-1">AI보다 명확하게</div>
            <p className="text-[13px] text-zinc-600 leading-relaxed">
              "그럴싸한" 로고 대신 이니셜 + 심볼 두 조각. 0.5초 만에 읽히는 브랜드.
            </p>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4 break-keep">
            <div className="text-xs font-black text-zinc-400 mb-1 tracking-widest">03</div>
            <div className="text-base font-black text-zinc-900 mb-1">한글도 동등하게</div>
            <p className="text-[13px] text-zinc-600 leading-relaxed">
              "한", "별", "꿈" — 한 글자 완결 K-로고. 영문 수준의 디자인 일관성.
            </p>
          </div>
        </div>
      </Section>

      {/* OUTPUT FORMATS ─ what you actually get */}
      <Section className="my-7">
        <h2 className="text-2xl font-black text-zinc-900 mb-4 leading-tight tracking-tight break-keep">
          어디든 쓸 수 있어요
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-zinc-900 text-white p-4 break-keep">
            <div className="text-2xl font-black mb-1">파비콘</div>
            <div className="text-[11px] text-white/60 mb-3">favicon.ico · 16/32 PNG</div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/10 w-fit">
              <LogoInline svgStr={renderCfg(hero, 200)} displaySize={12} className="overflow-hidden" style={{ borderRadius: `${Math.round(12 * LOGO_RADIUS)}px` }} />
              <span className="text-[10px] font-medium">logodown</span>
            </div>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4 break-keep">
            <div className="text-2xl font-black text-zinc-900 mb-1">iOS</div>
            <div className="text-[11px] text-zinc-500 mb-3">apple-touch 180px</div>
            <LogoInline svgStr={renderCfg(hero, 200)} displaySize={48} className="shadow-md overflow-hidden" style={{ borderRadius: `${Math.round(48 * LOGO_RADIUS)}px` }} />
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4 break-keep">
            <div className="text-2xl font-black text-zinc-900 mb-1">PWA</div>
            <div className="text-[11px] text-zinc-500 mb-3">192/512 + manifest</div>
            <div className="flex gap-1.5 items-end">
              <LogoInline svgStr={renderCfg(hero, 200)} displaySize={36} className="shadow-sm overflow-hidden" style={{ borderRadius: `${Math.round(36 * LOGO_RADIUS)}px` }} />
              <LogoInline svgStr={renderCfg(hero, 200)} displaySize={52} className="shadow-md overflow-hidden" style={{ borderRadius: `${Math.round(52 * LOGO_RADIUS)}px` }} />
            </div>
          </div>
          <div className="rounded-2xl bg-zinc-900 text-white p-4 break-keep">
            <div className="text-2xl font-black mb-1">소셜</div>
            <div className="text-[11px] text-white/60 mb-3">OG 1200×630</div>
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/10">
              <LogoInline svgStr={renderCfg(hero, 200)} displaySize={20} className="overflow-hidden" style={{ borderRadius: `${Math.round(20 * LOGO_RADIUS)}px` }} />
              <span className="text-xs font-bold">logodown</span>
            </div>
          </div>
        </div>
      </Section>

      {/* BOTTOM CTA */}
      <Section>
        <div className="rounded-2xl bg-zinc-900 text-white p-5 text-center break-keep">
          <div className="text-xl font-black mb-1">시작 준비 완료</div>
          <p className="text-[13px] text-white/60 mb-4 leading-relaxed">
            가입·결제 없음. 브라우저에서 바로, 1분 안에.
          </p>
          <button
            onClick={onStart}
            className="w-full py-3 rounded-xl bg-white text-zinc-900 font-black text-sm hover:opacity-90 transition-opacity cursor-pointer"
          >
            지금 만들기 →
          </button>
        </div>
      </Section>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Main App
══════════════════════════════════════════════ */
export default function App() {
  const [view, setView] = useState<"home" | "create">("home");
  const [front, setFront] = useState<Slot>({ kind: "char", value: "M" });
  const [back, setBack] = useState<Slot>({ kind: "symbol", value: "down" });
  const [activeSlot, setActiveSlot] = useState<"front" | "back">("back");
  const [pickerMode, setPickerMode] = useState<PickerMode>("symbol");
  const [color, setColor] = useState<string>("#09090b");
  const [colorMode, setColorMode] = useState<"solid" | "gradient">("solid");
  const [styleBase, setStyleBase] = useState<StyleBaseId>("colorWhite");
  const [frontRotate, setFrontRotate] = useState(0);
  const [backRotate, setBackRotate] = useState(0);
  const [frontScale, setFrontScale] = useState(1);
  const [backScale, setBackScale] = useState(1);
  const [shadow, setShadow] = useState(0);
  const [ogTitle, setOgTitle] = useState("logodown");
  const [ogDesc, setOgDesc] = useState("Make logos like markdown logo");
  const style: StyleId = resolveStyleId(styleBase, colorMode);
  const toast = useToast();

  const scheme = resolveStyle(style, color);
  const renderLogo = (size: number, opts?: { textRenderer?: TextRenderer; embedFonts?: boolean }) =>
    buildLogoSvgStr(
      front, back, scheme.bg, LOGO_RADIUS, size,
      scheme.bgGradEnd, scheme.textColor, scheme.textGradEnd,
      { ...opts, frontRotate, backRotate, frontScale, backScale, shadow, uid: "p" },
    );
  const logoSvgStr = renderLogo(200);
  const rPx = (s: number) => Math.round(s * LOGO_RADIUS);
  const wordmarkLabel =
    (front.kind === "char" && front.value) ||
    (back.kind === "char" && back.value) ||
    "M";

  const activeValue = activeSlot === "front" ? front : back;
  const setActiveValue = (slot: Slot) => {
    if (activeSlot === "front") setFront(slot);
    else setBack(slot);
  };

  const pickFromGrid = (kind: SlotKind, value: string) => {
    setActiveValue({ kind, value });
  };

  const randomSlot = (): Slot => {
    const syms = LOGO_SYMBOLS.filter((s) => s.id !== "none");
    const modes: CharMode[] = ["upper", "lower", "num", "hangul"];
    if (Math.random() < 0.5) {
      const m = modes[Math.floor(Math.random() * modes.length)];
      const chars = charsForMode(m);
      return { kind: "char", value: chars[Math.floor(Math.random() * chars.length)] };
    }
    return { kind: "symbol", value: syms[Math.floor(Math.random() * syms.length)].id };
  };

  const handleRandomSlots = () => {
    setFront(randomSlot());
    setBack(randomSlot());
  };

  // Randomize only the currently-active slot — lets user lock one side and roll the other.
  const handleRandomActiveSlot = () => {
    setActiveValue(randomSlot());
  };

  const handleRandomColor = () => {
    setColor(LOGO_COLORS[Math.floor(Math.random() * LOGO_COLORS.length)].hex);
    setColorMode(Math.random() < 0.5 ? "solid" : "gradient");
    setStyleBase(STYLE_BASES[Math.floor(Math.random() * STYLE_BASES.length)].id);
  };

  const handleRandom = () => {
    handleRandomSlots();
    handleRandomColor();
  };

  const baseName = (
    (front.kind === "char" ? front.value : "") ||
    (back.kind === "char" ? back.value : "") ||
    "logo"
  ).toLowerCase();

  const tweaks = { frontRotate, backRotate, frontScale, backScale, shadow };
  const renderExportLogo = (size: number) =>
    buildLogoSvgStrForExport(
      front, back, scheme.bg, LOGO_RADIUS, size,
      scheme.bgGradEnd, scheme.textColor, scheme.textGradEnd, tweaks,
    );

  const handleDownloadSvg = async () => {
    const filename = `${baseName}.svg`;
    try {
      const svg = await renderExportLogo(512);
      downloadSvg(svg, filename);
      toast(`${filename} 다운로드 완료`, { variant: "success" });
    } catch {
      toast("SVG 생성 실패 (폰트 로드 오류)", { variant: "error" });
    }
  };

  const handleDownloadPng = async (size: number, label: string) => {
    const filename = `${baseName}-${label}.png`;
    try {
      const svg = await renderExportLogo(512);
      await downloadPng(svg, size, filename);
      toast(`${filename} (${size}×${size}) 다운로드 완료`, { variant: "success" });
    } catch {
      toast("PNG 변환 실패", { variant: "error" });
    }
  };

  const handleDownloadPack = async (category: SeoPackCategory, suffix: string) => {
    toast("패키지 빌드 중…", { variant: "info" });
    try {
      const needsMaskable = category === "all" || category === "pwa";
      const [iconSvg, maskableSvg] = await Promise.all([
        buildLogoSvgStrForExport(
          front, back, scheme.bg, LOGO_RADIUS, 512,
          scheme.bgGradEnd, scheme.textColor, scheme.textGradEnd, tweaks,
        ),
        needsMaskable
          ? buildLogoSvgStrForMaskable(
              front, back, scheme.bg, 512,
              scheme.bgGradEnd, scheme.textColor, scheme.textGradEnd, tweaks,
            )
          : Promise.resolve(""),
      ]);
      const textColor = scheme.textColor ?? (isLightHex(scheme.bg) ? "#09090b" : "#ffffff");
      const zipBytes = await buildSeoPack({
        iconSvg,
        maskableSvg,
        brandName: ogTitle,
        slogan: ogDesc,
        bgColor: scheme.bg,
        bgGradEnd: scheme.bgGradEnd,
        textColor,
      }, category);
      const blob = new Blob([zipBytes as BlobPart], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename = `logodown-${baseName}-${suffix}.zip`;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      const sizeKb = Math.round(zipBytes.byteLength / 1024);
      toast(`${filename} (${sizeKb}KB) 다운로드 완료`, { variant: "success" });
    } catch (e) {
      console.error(e);
      toast("패키지 빌드 실패", { variant: "error" });
    }
  };

  const cellCls = (active: boolean) =>
    `w-10 h-10 flex items-center justify-center rounded-lg font-bold text-[13px] cursor-pointer transition-all select-none shrink-0 ${
      active
        ? "bg-zinc-900 text-white shadow-sm"
        : "bg-white text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
    }`;

  return (
    <Watermark color="#09090b" text="logodown" speed={60}>
      <AppShell>
        <AppShellHeader>
          <span className="text-lg font-black text-zinc-900 tracking-tight">
            logodown
          </span>
          <div className="flex items-center gap-2">
            <a href="https://m1k.app/gl" target="_blank" rel="noopener noreferrer">
              <img src="https://m1k.app/badge/gl.svg" alt="hits" className="h-5" />
            </a>
            <ShareButton
              title="logodown"
              text="Make logos like markdown logo"
              label="공유"
            />
          </div>
        </AppShellHeader>

        <AppShellContent>
          {view === "home" ? (
            <HomeView onStart={() => setView("create")} />
          ) : (
          <>
          {/* Preview — sticky canvas */}
          <div className="sticky top-0 z-10 px-3 pt-2 pb-4">
            <div className="rounded-2xl bg-white flex flex-col items-center justify-center py-5 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)]">
              <LogoInline svgStr={logoSvgStr} displaySize={120} className="shadow-2xl transition-all duration-300 overflow-hidden" style={{ borderRadius: `${rPx(120)}px` }} />
              {/* Action bar */}
              <div className="flex items-center gap-1.5 mt-4 px-4 w-full">
                {([
                  { label: "전체", onClick: handleRandom },
                  { label: `${activeSlot === "front" ? "앞" : "뒤"} 슬롯`, onClick: handleRandomActiveSlot },
                  { label: "색상", onClick: handleRandomColor },
                ] as const).map(({ label, onClick }) => (
                  <button
                    key={label}
                    onClick={onClick}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors cursor-pointer"
                  >
                    <DiceIcon size={12} />
                    <span className="text-[11px] font-semibold">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Slot picker — card */}
          <Section>
            <div className="rounded-2xl bg-zinc-50 p-3">
              <div className="flex items-center justify-between mb-3">
                <SegmentControl
                  options={[{ id: "front" as const, label: "앞 슬롯" }, { id: "back" as const, label: "뒤 슬롯" }]}
                  value={activeSlot}
                  onChange={setActiveSlot}
                />
              </div>
              <div className="flex items-center justify-between mb-3">
                <SegmentControl
                  options={MODE_OPTIONS}
                  value={pickerMode}
                  onChange={setPickerMode}
                />
                <span className="text-[11px] text-zinc-400 font-medium tabular-nums">
                  {pickerMode === "symbol"
                    ? LOGO_SYMBOLS.filter((s) => s.id !== "none").length
                    : charsForMode(pickerMode).length}
                </span>
              </div>
              {pickerMode === "symbol" ? (() => {
                const symbols = LOGO_SYMBOLS.filter((s) => s.id !== "none");
                return (
                  <div className="overflow-x-auto pb-1 scrollbar-hide">
                    <div style={gridStyle(symbols.length)}>
                      {symbols.map((s) => {
                        const isActive = activeValue.kind === "symbol" && activeValue.value === s.id;
                        return (
                          <Tooltip key={s.id} label={s.id}>
                            <button onClick={() => pickFromGrid("symbol", s.id)} className={cellCls(isActive)}>
                              <SymbolIcon sym={s} size={16} />
                            </button>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                );
              })() : (() => {
                const chars = charsForMode(pickerMode);
                const cellFont: React.CSSProperties =
                  pickerMode === "lower"
                    ? { fontFamily: "Pacifico, cursive", fontWeight: 400, fontSize: "1.15rem" }
                    : pickerMode === "hangul"
                      ? { fontFamily: "'Pretendard Variable', 'Pretendard', system-ui, sans-serif", fontWeight: 900 }
                      : {};
                return (
                  <div className="overflow-x-auto pb-1 scrollbar-hide">
                    <div style={gridStyle(chars.length)}>
                      {chars.map((l) => {
                        const isActive = activeValue.kind === "char" && activeValue.value === l;
                        return (
                          <button
                            key={l}
                            onClick={() => pickFromGrid("char", l)}
                            className={cellCls(isActive)}
                            style={cellFont}
                          >
                            {l}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
            {/* Rotate + Scale */}
            {(() => {
              const currentRotate = activeSlot === "front" ? frontRotate : backRotate;
              const setCurrentRotate = activeSlot === "front" ? setFrontRotate : setBackRotate;
              const currentScale = activeSlot === "front" ? frontScale : backScale;
              const setCurrentScale = activeSlot === "front" ? setFrontScale : setBackScale;
              return (
                <div className="flex flex-col gap-2 mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-zinc-900 tracking-tight shrink-0 w-7">회전</span>
                    <div className="flex items-center gap-1">
                      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                        <button
                          key={deg}
                          onClick={() => setCurrentRotate(deg)}
                          className={`w-8 h-8 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                            currentRotate === deg
                              ? "bg-zinc-900 text-white shadow-sm"
                              : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                          }`}
                        >
                          {deg}°
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-zinc-900 tracking-tight shrink-0 w-7">크기</span>
                    <div className="flex items-center gap-1">
                      {[1, 1.05, 1.10, 1.15, 1.20].map((s) => (
                        <button
                          key={s}
                          onClick={() => setCurrentScale(s)}
                          className={`h-8 px-2.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                            currentScale === s
                              ? "bg-zinc-900 text-white shadow-sm"
                              : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                          }`}
                        >
                          {s === 1 ? "1x" : `${s.toFixed(2)}x`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </Section>

          {/* Color — card */}
          <Section>
            <div className="rounded-2xl bg-zinc-50 p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-bold text-zinc-900 tracking-tight">색상</span>
                <SegmentControl
                  options={[
                    { id: "solid" as const,    label: "단색"       },
                    { id: "gradient" as const, label: "그라데이션" },
                  ]}
                  value={colorMode}
                  onChange={setColorMode}
                />
              </div>
              <div className="overflow-x-auto pb-1 scrollbar-hide">
                <div style={gridStyle(LOGO_COLORS.length + 1)}>
                  {LOGO_COLORS.map(({ name, hex }) => (
                    <ColorSwatch key={name} name={name} hex={hex} active={color === hex} gradient={colorMode === "gradient"} onClick={() => setColor(hex)} />
                  ))}
                  <label className="w-10 h-10 rounded-lg cursor-pointer flex items-center justify-center bg-white hover:bg-zinc-100 transition-colors relative overflow-hidden border border-dashed border-zinc-300">
                    <span className="text-zinc-400 text-lg font-bold">+</span>
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  </label>
                </div>
              </div>
            </div>
          </Section>

          {/* Style — card */}
          <Section>
            <div className="rounded-2xl bg-zinc-50 p-3">
              <span className="text-[12px] font-bold text-zinc-900 tracking-tight block mb-3">스타일</span>
              <div className="flex gap-3">
                {STYLE_BASES.map((sb) => {
                  const sid = resolveStyleId(sb.id, colorMode);
                  const s = resolveStyle(sid, color);
                  const preview = buildLogoSvgStr(
                    front, back, s.bg, LOGO_RADIUS, 200,
                    s.bgGradEnd, s.textColor, s.textGradEnd,
                  );
                  const active = styleBase === sb.id;
                  return (
                    <button
                      key={sb.id}
                      onClick={() => setStyleBase(sb.id)}
                      className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${active ? "" : "opacity-50 hover:opacity-80"}`}
                    >
                      <div className={`relative overflow-hidden transition-all ${active ? "ring-2 ring-zinc-900 ring-offset-2" : ""}`} style={{ borderRadius: `${Math.round(56 * LOGO_RADIUS)}px` }}>
                        <LogoInline
                          svgStr={preview}
                          displaySize={56}
                          className="overflow-hidden block"
                          style={{ borderRadius: `${Math.round(56 * LOGO_RADIUS)}px` }}
                        />
                      </div>
                      <span className={`text-[11px] font-semibold ${active ? "text-zinc-900" : "text-zinc-400"}`}>{sb.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Shadow level */}
            <div className="flex items-center justify-between mt-3">
              <span className="text-[12px] font-bold text-zinc-900 tracking-tight">음영</span>
              <div className="flex items-center gap-1">
                {[
                  { v: 0, label: "없음" },
                  { v: 1, label: "약하게" },
                  { v: 2, label: "보통" },
                  { v: 3, label: "강하게" },
                ].map(({ v, label }) => (
                  <button
                    key={v}
                    onClick={() => setShadow(v)}
                    className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                      shadow === v
                        ? "bg-zinc-900 text-white shadow-sm"
                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* Download */}
          <Section>
            <PickerHeader label="다운로드" />

            {/* OG card — accordion */}
            <details className="group rounded-2xl bg-zinc-50 mb-4">
              <summary className="flex items-center gap-1.5 p-3 cursor-pointer select-none list-none">
                <svg className="w-3 h-3 text-zinc-400 transition-transform group-open:rotate-90" viewBox="0 0 12 12" fill="currentColor"><path d="M4.5 2L9 6L4.5 10V2Z"/></svg>
                <span className="text-[12px] font-bold text-zinc-900 tracking-tight">소셜 공유 카드</span>
                <span className="text-[10px] text-zinc-400 ml-auto">OG 1200×630</span>
              </summary>
              <div className="px-3 pb-3 space-y-2">
                {/* OG preview */}
                <div className="rounded-xl overflow-hidden border border-zinc-200 shadow-sm relative" style={{ aspectRatio: "1200/630" }}>
                  <div className="absolute inset-0 opacity-85" style={{ background: scheme.bgGradEnd ? `linear-gradient(135deg, ${scheme.bg}, ${scheme.bgGradEnd})` : scheme.bg }} />
                  <div className="relative w-full h-full flex items-center gap-[6%] px-[8%]">
                    <LogoInline svgStr={logoSvgStr} displaySize={90} className="shrink-0 overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.15)]" style={{ borderRadius: `${rPx(90)}px` }} />
                    {(() => {
                      const c = isLightHex(scheme.bg) ? "#09090b" : "#ffffff";
                      return (
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-[18px] font-black truncate" style={{ color: c }}>{ogTitle || "Brand"}</span>
                          <span className="text-[11px] truncate opacity-50" style={{ color: c }}>{ogDesc || "Description"}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                {/* inputs */}
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 mb-0.5 block">Service</label>
                  <input
                    type="text"
                    value={ogTitle}
                    onChange={(e) => setOgTitle(e.target.value)}
                    placeholder="브랜드명"
                    className="w-full h-7 px-2.5 rounded-lg bg-white text-[11px] font-semibold text-zinc-900 outline-none focus:ring-2 ring-zinc-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 mb-0.5 block">Slogan</label>
                  <input
                    type="text"
                    value={ogDesc}
                    onChange={(e) => setOgDesc(e.target.value)}
                    placeholder="한 줄 소개"
                    className="w-full h-7 px-2.5 rounded-lg bg-white text-[11px] text-zinc-600 outline-none focus:ring-2 ring-zinc-300"
                  />
                </div>
              </div>
            </details>

            {/* Recommended: full pack */}
            <button
              onClick={() => handleDownloadPack("all", "seo-pack")}
              className="w-full text-left rounded-2xl bg-zinc-900 text-white py-4 px-5 mb-4 hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="font-black text-base">전체 받기</div>
                <div className="text-[11px] opacity-60 mt-0.5 leading-relaxed break-keep">
                  파비콘·iOS·PWA·소셜·manifest·head.html
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] opacity-50 font-medium">~200KB</span>
                <DownloadIcon size={16} />
              </div>
            </button>

            {/* Collapsed: use-case subsets + individual files */}
            <details className="group">
              <summary className="text-[12px] text-zinc-400 font-medium cursor-pointer hover:text-zinc-600 list-none flex items-center gap-1.5 select-none py-2 transition-colors">
                <svg className="w-3 h-3 transition-transform group-open:rotate-90" viewBox="0 0 12 12" fill="currentColor"><path d="M4.5 2L9 6L4.5 10V2Z"/></svg>
                <span>용도별 · 개별 다운로드</span>
              </summary>
              <div className="pt-2 space-y-4">
                {/* Use-case based subsets */}
                <div className="space-y-1.5">
                  {[
                    { id: "favicon" as const, title: "파비콘만",        desc: "브라우저 탭에 뜨는 작은 아이콘",        size: "~10KB"  },
                    { id: "ios"     as const, title: "iOS 홈스크린",    desc: "아이폰·아이패드 홈에 추가될 아이콘",     size: "~8KB"   },
                    { id: "pwa"     as const, title: "PWA 앱 아이콘",   desc: "앱처럼 설치 가능 + manifest",           size: "~80KB"  },
                    { id: "social"  as const, title: "소셜 공유 카드",   desc: "카톡·페북·슬랙 미리보기 OG 이미지",     size: "~120KB" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleDownloadPack(c.id, c.id)}
                      className="w-full text-left rounded-xl bg-zinc-50 hover:bg-zinc-100 px-3.5 py-2.5 transition-colors cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-zinc-900">{c.title}</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{c.desc}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-zinc-300">
                        <span className="text-[10px] font-medium">{c.size}</span>
                        <DownloadIcon size={13} />
                      </div>
                    </button>
                  ))}
                </div>

                {/* Individual files */}
                <div>
                  <div className="text-[11px] text-zinc-400 font-medium mb-2">개별 파일</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button onClick={handleDownloadSvg} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer">
                      <span className="text-[12px] font-semibold text-zinc-700">SVG</span>
                      <span className="flex items-center gap-1 text-zinc-300"><span className="text-[10px]">~10KB</span><DownloadIcon size={12} /></span>
                    </button>
                    <button onClick={() => handleDownloadPng(32, "favicon-32")} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer">
                      <span className="text-[12px] font-semibold text-zinc-700">PNG 32</span>
                      <span className="flex items-center gap-1 text-zinc-300"><span className="text-[10px]">~1KB</span><DownloadIcon size={12} /></span>
                    </button>
                    <button onClick={() => handleDownloadPng(180, "apple-touch-180")} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer">
                      <span className="text-[12px] font-semibold text-zinc-700">PNG 180</span>
                      <span className="flex items-center gap-1 text-zinc-300"><span className="text-[10px]">~8KB</span><DownloadIcon size={12} /></span>
                    </button>
                    <button onClick={() => handleDownloadPng(192, "pwa-192")} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer">
                      <span className="text-[12px] font-semibold text-zinc-700">PNG 192</span>
                      <span className="flex items-center gap-1 text-zinc-300"><span className="text-[10px]">~10KB</span><DownloadIcon size={12} /></span>
                    </button>
                    <button onClick={() => handleDownloadPng(512, "pwa-512")} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer col-span-2">
                      <span className="text-[12px] font-semibold text-zinc-700">PNG 512</span>
                      <span className="flex items-center gap-1 text-zinc-300"><span className="text-[10px]">~40KB</span><DownloadIcon size={12} /></span>
                    </button>
                  </div>
                </div>

                {/* Where-to-put guide */}
                <div className="p-3.5 rounded-xl bg-zinc-50 break-keep">
                  <p className="text-[11px] text-zinc-500 font-semibold mb-1">어디에 넣어요?</p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    받은 파일을 프로젝트의 <code className="font-mono font-semibold text-zinc-600">public/</code> (Vite·Next·CRA·Astro)
                    또는 <code className="font-mono font-semibold text-zinc-600">static/</code> (Nuxt 2·Hugo) 폴더에 통째로 넣고,
                    <code className="font-mono font-semibold text-zinc-600">head.html</code> 내용을 <code className="font-mono font-semibold text-zinc-600">&lt;head&gt;</code>에 붙여넣으면 끝.
                  </p>
                </div>
              </div>
            </details>
          </Section>

          <div className="pb-6" />
          </>
          )}
        </AppShellContent>

        <TabBar>
          <Tab
            active={view === "home"}
            onClick={() => setView("home")}
            icon={<HomeIcon />}
            label="홈"
            activeColor="#09090b"
          />
          <Tab
            active={view === "create"}
            onClick={() => setView("create")}
            icon={<WandIcon />}
            label="만들기"
            activeColor="#09090b"
          />
        </TabBar>
      </AppShell>
    </Watermark>
  );
}
