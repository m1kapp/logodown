import { useEffect, useMemo, useState } from "react";
import {
  Watermark,
  AppShell, AppShellHeader, AppShellContent,
  TabBar, Tab,
  Button, ShareButton,
  useToast,
} from "@m1kapp/kit";
import {
  type Slot, type SlotKind, type TextRenderer,
  buildLogoSvgStr, STROKE_WEIGHTS,
  loadExportFonts, makePathTextRenderer, type LoadedFonts,
} from "./logo-engine";
import { LogoInline } from "./ui-parts";
import { DiceIcon, HomeIcon, WandIcon } from "./ui-icons";
import { type PickerMode } from "./char-data";
import {
  LOGO_RADIUS, type StyleId, type StyleBaseId,
  resolveStyleId, resolveStyle,
} from "./logo-styles";
import { useLogoActions } from "./use-logo-actions";
import { HomeView } from "./home-view";
import { hasUrlState, urlState } from "./url-state";
import { LogoGuides, GUIDE_LEGEND } from "./logo-guides";
import { SlotPickerSection } from "./builder-slot-section";
import { ColorSection, StyleSection } from "./builder-color-style-section";
import { DownloadSection } from "./builder-download-section";

/* ══════════════════════════════════════════════
   Main App
══════════════════════════════════════════════ */
export default function App() {
  const [view, setView] = useState<"home" | "create">(urlState.view ?? (hasUrlState ? "create" : "home"));
  const [front, setFront] = useState<Slot>(urlState.front ?? { kind: "char", value: "M" });
  const [back, setBack] = useState<Slot>(urlState.back ?? { kind: "symbol", value: "down" });
  const [activeSlot, setActiveSlot] = useState<"front" | "back">("back");
  const [pickerMode, setPickerMode] = useState<PickerMode>("symbol");
  const [color, setColor] = useState<string>(urlState.color ?? "#09090b");
  const [colorMode, setColorMode] = useState<"solid" | "gradient">(urlState.colorMode ?? "solid");
  const [styleBase, setStyleBase] = useState<StyleBaseId>(urlState.styleBase ?? "colorWhite");
  const [frontRotate, setFrontRotate] = useState(urlState.frontRotate ?? 0);
  const [backRotate, setBackRotate] = useState(urlState.backRotate ?? 0);
  // 크기는 잉크 bbox 자동 정규화로 대체돼 UI 조작이 없다. URL `fs`/`bs` 로만 들어온다.
  const [frontScale] = useState(urlState.frontScale ?? 1);
  const [backScale] = useState(urlState.backScale ?? 1);
  const [shadow, setShadow] = useState(urlState.shadow ?? 0);
  // 선 굵기는 URL `sw` 로만 들어온다 (fs/bs 와 같은 취급).
  const [strokeK] = useState(STROKE_WEIGHTS[urlState.strokeWeight ?? "regular"]);
  const [guides, setGuides] = useState(false);
  // 미리보기도 다운로드와 같은 path 렌더러를 쓴다 — <text> + 웹폰트로는 글자 폭을
  // 잴 수 없어서 슬롯 fit 이 안 맞고, 미리보기와 결과물이 어긋난다.
  const [fonts, setFonts] = useState<LoadedFonts | null>(null);
  useEffect(() => {
    let alive = true;
    loadExportFonts().then((f) => { if (alive) setFonts(f); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  const [ogTitle, setOgTitle] = useState(urlState.ogTitle ?? "logodown");
  const [ogDesc, setOgDesc] = useState(urlState.ogDesc ?? "Make logos like markdown logo");
  const style: StyleId = resolveStyleId(styleBase, colorMode);
  const toast = useToast();

  const scheme = resolveStyle(style, color);
  const previewTextRenderer = useMemo(
    () => (fonts ? makePathTextRenderer(fonts) : undefined),
    [fonts],
  );
  const renderLogo = (size: number, opts?: { textRenderer?: TextRenderer; embedFonts?: boolean }) =>
    buildLogoSvgStr(
      front, back, scheme.bg, LOGO_RADIUS, size,
      scheme.bgGradEnd, scheme.textColor, scheme.textGradEnd,
      { textRenderer: previewTextRenderer, ...opts, frontRotate, backRotate, frontScale, backScale, shadow, uid: "p", frame: scheme.frame, strokeK },
    );
  const logoSvgStr = renderLogo(200);
  // 가이드는 120px 에서 선이 뭉개져 읽히지 않는다 — 켜면 미리보기를 키운다.
  const previewSize = guides ? 200 : 120;
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

  const tweaks = { frontRotate, backRotate, frontScale, backScale, shadow, strokeK };
  const {
    handleRandom, handleRandomActiveSlot, handleRandomColor,
    handleDownloadSvg, handleDownloadPng, handleDownloadPack,
  } = useLogoActions({
    front, back, scheme, tweaks, ogTitle, ogDesc, toast,
    setFront, setBack, setActiveValue, setColor, setColorMode, setStyleBase,
  });

  const cellCls = (active: boolean) =>
    `w-10 h-10 flex items-center justify-center rounded-lg font-bold text-[13px] cursor-pointer transition-all select-none shrink-0 ${
      active
        ? "bg-zinc-900 text-white shadow-sm"
        : "bg-white text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
    }`;

  return (
    <Watermark color="#09090b" text="logodown" speed={60} trackSlug="gl" claimed>
      <AppShell>
        <AppShellHeader>
          <span className="text-lg font-black text-zinc-900 tracking-tight">
            logodown
          </span>
          <div className="flex items-center gap-2">
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
              <div className="relative" style={{ width: previewSize, height: previewSize }}>
                <LogoInline svgStr={logoSvgStr} displaySize={previewSize} className="shadow-2xl transition-all duration-300 overflow-hidden" style={{ borderRadius: `${rPx(previewSize)}px` }} />
                {guides && fonts && <LogoGuides front={front} back={back} textRenderer={previewTextRenderer} />}
              </div>

              {guides && (
                <div className="flex items-center justify-center flex-wrap gap-x-3 gap-y-1 mt-3 px-4">
                  {GUIDE_LEGEND.map(({ color, label }) => (
                    <span key={label} className="flex items-center gap-1 text-[10px] font-medium text-zinc-500">
                      <span className="w-2.5 h-0.5 rounded-full" style={{ background: color }} />
                      {label}
                    </span>
                  ))}
                </div>
              )}

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
                <button
                  onClick={() => setGuides((v) => !v)}
                  aria-pressed={guides}
                  disabled={!fonts}
                  title={fonts ? undefined : "폰트 로딩 중"}
                  className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                    !fonts
                      ? "bg-zinc-100 text-zinc-300 cursor-not-allowed"
                      : guides
                        ? "bg-zinc-900 text-white cursor-pointer"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 cursor-pointer"
                  }`}
                >
                  가이드
                </button>
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
