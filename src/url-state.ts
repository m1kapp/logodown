import type { Slot, SlotKind } from "./logo-engine";
import type { StyleBaseId } from "./logo-styles";
import { STROKE_WEIGHTS, type StrokeWeight } from "./logo-engine";

/* ══════════════════════════════════════════════
   URL deep link — ?front=char:F&back=symbol:flame&color=%23ef4444...
   빈 값/이상한 값은 조용히 무시하고 기본값 유지.
   브라우저(App)와 CLI(`--url`) 양쪽이 같은 파서를 쓴다.
══════════════════════════════════════════════ */

export type UrlState = ReturnType<typeof parseUrlState>;

export function parseUrlState(search: string) {
  const params = new URLSearchParams(search);

  const str = (key: string) => params.get(key)?.trim() || null;

  const num = (key: string, min: number, max: number) => {
    const raw = str(key);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null;
  };

  const oneOf = <T extends string>(key: string, allowed: readonly T[]): T | null => {
    const raw = str(key);
    return raw !== null && (allowed as readonly string[]).includes(raw) ? (raw as T) : null;
  };

  /** `char:F` / `symbol:flame` / prefix 없으면 symbol 취급 */
  const slot = (key: string): Slot | null => {
    const raw = str(key);
    if (!raw) return null;
    const i = raw.indexOf(":");
    if (i < 0) return { kind: "symbol", value: raw };
    const kind = raw.slice(0, i) as SlotKind;
    const value = raw.slice(i + 1);
    if (!value) return null;
    return { kind, value };
  };

  const hex = (key: string) => {
    const raw = str(key);
    if (!raw) return null;
    const v = raw.startsWith("#") ? raw : `#${raw}`;
    return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : null;
  };

  return {
    any: [...params.keys()].length > 0,
    view: oneOf("view", ["home", "create"] as const),
    front: slot("front"),
    back: slot("back"),
    color: hex("color"),
    colorMode: oneOf("mode", ["solid", "gradient"] as const),
    styleBase: oneOf<StyleBaseId>("style", ["color", "colorWhite", "onWhite", "onBlack", "outline"]),
    frontRotate: num("fr", 0, 360),
    backRotate: num("br", 0, 360),
    frontScale: num("fs", 0.5, 2),
    backScale: num("bs", 0.5, 2),
    shadow: num("shadow", 0, 3),
    strokeWeight: oneOf<StrokeWeight>("sw", Object.keys(STROKE_WEIGHTS) as StrokeWeight[]),
    ogTitle: str("title"),
    ogDesc: str("desc"),
  };
}

export const urlState = parseUrlState(
  typeof window === "undefined" ? "" : window.location.search,
);
export const hasUrlState = urlState.any;
