import opentype from "opentype.js";

/**
 * Lazy-load Pacifico (latin) and Pretendard (latin + hangul) for text-to-path
 * conversion at download time. Preview keeps using <text> + @import for speed;
 * downloads use these fonts to convert to true vector paths so the result
 * renders identically in any environment (Figma, Illustrator, OS without the
 * fonts installed, canvas-based PNG export, etc.).
 *
 * Both fonts are SIL Open Font License — embedding/path-converting is permitted.
 */
const PACIFICO_URL = "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/pacifico/Pacifico-Regular.ttf";
const PRETENDARD_URL = "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Black.otf";

let pacificoP: Promise<opentype.Font> | null = null;
let pretendardP: Promise<opentype.Font> | null = null;

async function fetchAndParse(url: string): Promise<opentype.Font> {
  const buf = await fetch(url).then((r) => {
    if (!r.ok) throw new Error(`font fetch failed: ${r.status}`);
    return r.arrayBuffer();
  });
  return opentype.parse(buf);
}

export function getPacifico(): Promise<opentype.Font> {
  if (!pacificoP) pacificoP = fetchAndParse(PACIFICO_URL);
  return pacificoP;
}

export function getPretendard(): Promise<opentype.Font> {
  if (!pretendardP) pretendardP = fetchAndParse(PRETENDARD_URL);
  return pretendardP;
}

export type LoadedFonts = {
  pacifico: opentype.Font;
  pretendard: opentype.Font;
};

export async function loadExportFonts(): Promise<LoadedFonts> {
  const [pacifico, pretendard] = await Promise.all([getPacifico(), getPretendard()]);
  return { pacifico, pretendard };
}
