import { useEffect, useMemo, useState } from "react";
import {
  Watermark,
  AppShell, AppShellHeader, AppShellContent,
  TabBar, Tab,
  Button, ShareButton,
  useToast,
} from "@m1kapp/kit";
import { buildSeoPack, type SeoPackCategory } from "./seo-pack";
import {
  LOGO_SYMBOLS, isLightHex,
  type Slot, type SlotKind, type TextRenderer,
  buildLogoSvgStr, buildLogoSvgStrForExport, buildLogoSvgStrForMaskable,
  downloadSvg, downloadPng,
} from "./logo-engine";
import { LogoInline } from "./ui-parts";
import { DiceIcon, HomeIcon, WandIcon } from "./ui-icons";
import { type CharMode, type PickerMode, charsForMode } from "./char-data";
import {
  LOGO_COLORS, LOGO_RADIUS, type StyleId, type StyleBaseId, STYLE_BASES,
  resolveStyleId, resolveStyle,
} from "./logo-styles";
import { HomeView } from "./home-view";
import { SlotPickerSection } from "./builder-slot-section";
import { ColorSection, StyleSection } from "./builder-color-style-section";
import { DownloadSection } from "./builder-download-section";

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

      <SlotPickerSection
        activeSlot={activeSlot}
        setActiveSlot={setActiveSlot}
        pickerMode={pickerMode}
        setPickerMode={setPickerMode}
        activeValue={activeValue}
        pickFromGrid={pickFromGrid}
        cellCls={cellCls}
        frontRotate={frontRotate}
        backRotate={backRotate}
        setFrontRotate={setFrontRotate}
        setBackRotate={setBackRotate}
        frontScale={frontScale}
        backScale={backScale}
        setFrontScale={setFrontScale}
        setBackScale={setBackScale}
      />

      <ColorSection color={color} setColor={setColor} colorMode={colorMode} setColorMode={setColorMode} />

      <StyleSection
        colorMode={colorMode}
        styleBase={styleBase}
        setStyleBase={setStyleBase}
        color={color}
        front={front}
        back={back}
        shadow={shadow}
        setShadow={setShadow}
      />

      <DownloadSection
        scheme={scheme}
        logoSvgStr={logoSvgStr}
        rPx={rPx}
        ogTitle={ogTitle}
        setOgTitle={setOgTitle}
        ogDesc={ogDesc}
        setOgDesc={setOgDesc}
        handleDownloadPack={handleDownloadPack}
        handleDownloadSvg={handleDownloadSvg}
        handleDownloadPng={handleDownloadPng}
      />

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
