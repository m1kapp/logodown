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

export type CharMode = "upper" | "lower" | "num" | "hangul";
export type PickerMode = CharMode | "symbol";
export const MODE_OPTIONS: { id: PickerMode; label: string }[] = [
  { id: "upper",  label: "AA" },
  { id: "lower",  label: "Aa" },
  { id: "num",    label: "12" },
  { id: "hangul", label: "한글" },
  { id: "symbol", label: "심볼" },
];
export const TOTAL_CHAR_COUNT = ALPHABET_UPPER.length + ALPHABET_LOWER.length + NUMBERS.length + HANGUL_CHARS.length;

export function charsForMode(m: CharMode) {
  switch (m) {
    case "upper":  return ALPHABET_UPPER;
    case "lower":  return ALPHABET_LOWER;
    case "num":    return NUMBERS;
    case "hangul": return HANGUL_CHARS;
  }
}
