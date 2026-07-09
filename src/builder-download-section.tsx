import { Section } from "@m1kapp/kit";
import { isLightHex } from "./logo-engine";
import { LogoInline, PickerHeader } from "./ui-parts";
import { DownloadIcon } from "./ui-icons";
import type { SeoPackCategory } from "./seo-pack";

type Scheme = { bg: string; bgGradEnd?: string; textColor?: string; textGradEnd?: string };

export function DownloadSection({
  scheme, logoSvgStr, rPx, ogTitle, setOgTitle, ogDesc, setOgDesc,
  handleDownloadPack, handleDownloadSvg, handleDownloadPng,
}: {
  scheme: Scheme;
  logoSvgStr: string;
  rPx: (s: number) => number;
  ogTitle: string;
  setOgTitle: (v: string) => void;
  ogDesc: string;
  setOgDesc: (v: string) => void;
  handleDownloadPack: (category: SeoPackCategory, suffix: string) => void;
  handleDownloadSvg: () => void;
  handleDownloadPng: (size: number, label: string) => void;
}) {
  return (
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
  );
}
