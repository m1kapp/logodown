import { useEffect, useMemo, useState } from "react";
import { Section, Button } from "@m1kapp/kit";
import { LOGO_SYMBOLS, buildLogoSvgStr } from "./logo-engine";
import { LogoInline } from "./ui-parts";
import { TOTAL_CHAR_COUNT } from "./char-data";
import { LOGO_COLORS, LOGO_RADIUS, resolveStyle } from "./logo-styles";
import { type ShowcaseLogo, HOME_SHOWCASE } from "./home-showcase";
import { WhySection, OutputFormatsSection, BottomCta } from "./home-sections";

export function HomeView({ onStart }: { onStart: () => void }) {
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

  const initialCount = TOTAL_CHAR_COUNT;
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

      <WhySection />
      <OutputFormatsSection heroSvgStr={renderCfg(hero, 200)} />
      <BottomCta onStart={onStart} />
    </div>
  );
}
