import { useToast } from "@m1kapp/kit";
import { buildSeoPack, type SeoPackCategory } from "./seo-pack";
import {
  LOGO_SYMBOLS, isLightHex, type Slot,
  buildLogoSvgStrForExport, buildLogoSvgStrForMaskable,
  downloadSvg, downloadPng,
} from "./logo-engine";
import {
  LOGO_COLORS, LOGO_RADIUS, type StyleBaseId, STYLE_BASES, resolveStyle,
} from "./logo-styles";
import { type CharMode, charsForMode } from "./char-data";

type Toast = ReturnType<typeof useToast>;
type Scheme = ReturnType<typeof resolveStyle>;
type Tweaks = { frontRotate: number; backRotate: number; frontScale: number; backScale: number; shadow: number };

/** char/symbol 슬롯 하나를 랜덤 생성 — App/hook 양쪽에서 공유하는 순수 함수. */
function randomSlot(): Slot {
  const syms = LOGO_SYMBOLS.filter((s) => s.id !== "none");
  const modes: CharMode[] = ["upper", "lower", "num", "hangul"];
  if (Math.random() < 0.5) {
    const m = modes[Math.floor(Math.random() * modes.length)];
    const chars = charsForMode(m);
    return { kind: "char", value: chars[Math.floor(Math.random() * chars.length)] };
  }
  return { kind: "symbol", value: syms[Math.floor(Math.random() * syms.length)].id };
}

// 다운로드 파일명 접두어 — 첫 char 슬롯 값, 없으면 "logo".
function slotsBaseName(front: Slot, back: Slot): string {
  return (
    (front.kind === "char" ? front.value : "") ||
    (back.kind === "char" ? back.value : "") ||
    "logo"
  ).toLowerCase();
}

export type LogoActionsArgs = {
  front: Slot;
  back: Slot;
  scheme: Scheme;
  tweaks: Tweaks;
  ogTitle: string;
  ogDesc: string;
  toast: Toast;
  setFront: (s: Slot) => void;
  setBack: (s: Slot) => void;
  setActiveValue: (s: Slot) => void;
  setColor: (c: string) => void;
  setColorMode: (m: "solid" | "gradient") => void;
  setStyleBase: (b: StyleBaseId) => void;
};

/**
 * App의 랜덤화/다운로드 핸들러를 한데 모은 훅. 상태는 App이 소유하고,
 * 여기서는 전달받은 값을 읽고 setter/toast를 호출만 한다 (동작 동일, 구조 분리).
 */
export function useLogoActions(args: LogoActionsArgs) {
  const {
    front, back, scheme, tweaks, ogTitle, ogDesc, toast,
    setFront, setBack, setActiveValue, setColor, setColorMode, setStyleBase,
  } = args;

  const baseName = slotsBaseName(front, back);

  const handleRandomSlots = () => {
    setFront(randomSlot());
    setBack(randomSlot());
  };

  // 현재 활성 슬롯만 랜덤 — 한쪽 고정 후 다른 쪽만 굴리기.
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

  return {
    handleRandom,
    handleRandomActiveSlot,
    handleRandomColor,
    handleDownloadSvg,
    handleDownloadPng,
    handleDownloadPack,
  };
}
