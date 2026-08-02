import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  type Slot,
  buildLogoSvgStrForExport,
  buildLogoSvgStrForMaskable,
  LOGO_SYMBOLS,
  STROKE_WEIGHTS,
  type StrokeWeight,
} from "../src/logo-engine";
import { LOGO_RADIUS, resolveStyle, resolveStyleId, type StyleBaseId } from "../src/logo-styles";
import { parseUrlState } from "../src/url-state";
import { packIco } from "../src/build-ico";
import { F, buildManifest, buildHeadSnippet, buildReadme } from "../src/seo-pack-files";
import { buildOgSvgStr } from "../src/og-image";
import { charsForMode } from "../src/char-data";
import { renderPng, renderPngPadded } from "./raster";

const HELP = `
logodown — 터미널에서 로고·파비콘 만들기

사용법
  npx @m1kapp/logodown --front flame --back char:C --color '#FE2C55' --gradient
  npx @m1kapp/logodown --url 'https://logodown.m1k.app/?front=symbol:flame&back=char:C'

슬롯
  -f, --front <slot>    앞 슬롯. 'flame' | 'symbol:flame' | 'char:C'
  -b, --back  <slot>    뒤 슬롯. 둘 다 생략하면 char:M + symbol:down

모양
  -c, --color <hex>     기준 색 (기본 #09090b)
  -g, --gradient        그라디언트 켜기 (끝색은 hue+45° 자동)
  -s, --style <id>      color | colorWhite | onWhite | onBlack | outline (기본 colorWhite)
      --fs, --bs <n>    앞/뒤 슬롯 크기 0.5~2 (기본 1)
      --fr, --br <n>    앞/뒤 슬롯 회전 0~360 (기본 0)
      --shadow <0-3>    그림자 세기 (기본 0)
      --sw <weight>     선 심볼 굵기. thin | light | regular | bold (기본 regular)

출력
  -o, --out <dir>       출력 폴더 (기본 ./logodown-out)
      --size <px>       icon.svg 크기 (기본 512)
      --svg-only        SVG만. PNG/ICO/manifest 생략
      --name <str>      manifest/OG 브랜드명 (기본 logodown)
      --slogan <str>    manifest/OG 설명

기타
      --url <url>       logodown 링크를 그대로 붙여넣기 (다른 옵션이 우선)
      --list [symbols|chars]  사용 가능한 심볼/문자 출력
  -h, --help
`.trim();

/* ── arg parsing ─────────────────────────────────────────────── */
type Argv = { flags: Set<string>; opts: Map<string, string>; positional: string[] };

function parseArgv(argv: string[]): Argv {
  const VALUED = new Set([
    "front", "f", "back", "b", "color", "c", "style", "s", "out", "o",
    "fs", "bs", "fr", "br", "shadow", "sw", "size", "name", "slogan", "url", "list",
  ]);
  const flags = new Set<string>();
  const opts = new Map<string, string>();
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("-")) { positional.push(a); continue; }
    const body = a.replace(/^--?/, "");
    const eq = body.indexOf("=");
    if (eq >= 0) { opts.set(body.slice(0, eq), body.slice(eq + 1)); continue; }
    // `--list` 는 값이 있어도 되고 없어도 되는 예외
    const next = argv[i + 1];
    if (VALUED.has(body) && next !== undefined && !next.startsWith("-")) {
      opts.set(body, next);
      i++;
    } else {
      flags.add(body);
    }
  }
  return { flags, opts, positional };
}

const pick = (a: Argv, ...keys: string[]) => {
  for (const k of keys) { const v = a.opts.get(k); if (v !== undefined) return v; }
  return undefined;
};

function parseSlot(raw: string | undefined): Slot | undefined {
  if (!raw) return undefined;
  const i = raw.indexOf(":");
  if (i < 0) return { kind: "symbol", value: raw };
  return { kind: raw.slice(0, i) as Slot["kind"], value: raw.slice(i + 1) };
}

function num(raw: string | undefined, min: number, max: number): number | undefined {
  if (raw === undefined) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(min, n));
}

function normalizeHex(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const v = raw.startsWith("#") ? raw : `#${raw}`;
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : undefined;
}

/* ── --list ──────────────────────────────────────────────────── */
function printList(kind: string) {
  if (kind === "chars") {
    for (const mode of ["upper", "lower", "num", "hangul"] as const) {
      console.log(`\n[${mode}]`);
      console.log(charsForMode(mode).join(" "));
    }
    return;
  }
  const ids = LOGO_SYMBOLS.map((s) => s.id);
  console.log(`심볼 ${ids.length}개:\n`);
  for (let i = 0; i < ids.length; i += 6) {
    console.log("  " + ids.slice(i, i + 6).map((s) => s.padEnd(16)).join(""));
  }
}

/* ── main ────────────────────────────────────────────────────── */
export async function main(argv = process.argv.slice(2)) {
  const a = parseArgv(argv);

  if (a.flags.has("help") || a.flags.has("h") || argv.length === 0) {
    console.log(HELP);
    return;
  }
  if (a.flags.has("list") || a.opts.has("list")) {
    printList(a.opts.get("list") ?? "symbols");
    return;
  }

  // --url 로 받은 값이 기본값, 개별 옵션이 그 위를 덮는다.
  const urlRaw = pick(a, "url");
  const u = parseUrlState(urlRaw ? (urlRaw.split("?")[1] ?? "") : "");

  const front = parseSlot(pick(a, "front", "f")) ?? u.front ?? { kind: "char", value: "M" };
  const back = parseSlot(pick(a, "back", "b")) ?? u.back ?? { kind: "symbol", value: "down" };
  const color = normalizeHex(pick(a, "color", "c")) ?? u.color ?? "#09090b";
  const colorMode: "solid" | "gradient" =
    a.flags.has("gradient") || a.flags.has("g") ? "gradient" : (u.colorMode ?? "solid");
  const styleBase = (pick(a, "style", "s") ?? u.styleBase ?? "colorWhite") as StyleBaseId;
  const tweaks = {
    frontScale: num(pick(a, "fs"), 0.5, 2) ?? u.frontScale ?? 1,
    backScale: num(pick(a, "bs"), 0.5, 2) ?? u.backScale ?? 1,
    frontRotate: num(pick(a, "fr"), 0, 360) ?? u.frontRotate ?? 0,
    backRotate: num(pick(a, "br"), 0, 360) ?? u.backRotate ?? 0,
    shadow: num(pick(a, "shadow"), 0, 3) ?? u.shadow ?? 0,
    strokeK: STROKE_WEIGHTS[((pick(a, "sw") ?? u.strokeWeight ?? "regular") as StrokeWeight)] ?? STROKE_WEIGHTS.regular,
  };

  const size = num(pick(a, "size"), 16, 4096) ?? 512;
  const outDir = resolve(process.cwd(), pick(a, "out", "o") ?? "logodown-out");
  const svgOnly = a.flags.has("svg-only");
  const brandName = pick(a, "name") ?? u.ogTitle ?? "logodown";
  const slogan = pick(a, "slogan") ?? u.ogDesc ?? "Make logos like markdown logo";

  const scheme = resolveStyle(resolveStyleId(styleBase, colorMode), color);

  const iconSvg = await buildLogoSvgStrForExport(
    front, back, scheme.bg, LOGO_RADIUS, size,
    scheme.bgGradEnd, scheme.textColor, scheme.textGradEnd, { ...tweaks, frame: scheme.frame },
  );

  await mkdir(outDir, { recursive: true });
  const written: string[] = [];
  const put = async (name: string, data: string | Uint8Array) => {
    await writeFile(resolve(outDir, name), data);
    written.push(name);
  };

  await put(F.svg, iconSvg);

  if (!svgOnly) {
    const maskableSvg = await buildLogoSvgStrForMaskable(
      front, back, scheme.bg, 512,
      scheme.bgGradEnd, scheme.textColor, scheme.textGradEnd, { ...tweaks, frame: scheme.frame },
    );

    const png = (px: number) => renderPng(iconSvg, px);
    const [p16, p32, p48, p180, p192, p512] =
      [16, 32, 48, 180, 192, 512].map(png);

    await put(F.fav16, p16);
    await put(F.fav32, p32);
    await put(F.appleTouch, p180);
    await put(F.pwa192, p192);
    await put(F.pwa512, p512);
    await put(F.maskable, renderPngPadded(maskableSvg, 512, 0.8, scheme.bg));
    await put(F.ico, packIco([16, 32, 48], [p16, p32, p48]));

    const packInput = {
      iconSvg, maskableSvg, brandName, slogan,
      bgColor: scheme.bg, bgGradEnd: scheme.bgGradEnd,
      textColor: scheme.textColor ?? "#ffffff",
    };
    await put(F.og, renderPng(await buildOgSvgStr(packInput), 1200));
    await put(F.manifest, buildManifest(packInput));
    await put(F.head, buildHeadSnippet(packInput));
    await put(F.readme, buildReadme(packInput));
  }

  const label = (s: Slot) => `${s.kind}:${s.value}`;
  console.log(`logodown — ${label(front)} + ${label(back)} · ${color}${colorMode === "gradient" ? " (gradient)" : ""}`);
  console.log(`${outDir}\n${written.map((f) => `  ${f}`).join("\n")}`);
  if (svgOnly) console.log("\n(--svg-only: PNG/ICO 생략)");
}
