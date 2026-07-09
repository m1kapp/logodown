import { Section } from "@m1kapp/kit";
import { LogoInline } from "./ui-parts";
import { LOGO_RADIUS } from "./logo-styles";

export function WhySection() {
  return (
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
  );
}

export function OutputFormatsSection({ heroSvgStr }: { heroSvgStr: string }) {
  return (
    <Section className="my-7">
      <h2 className="text-2xl font-black text-zinc-900 mb-4 leading-tight tracking-tight break-keep">
        어디든 쓸 수 있어요
      </h2>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-zinc-900 text-white p-4 break-keep">
          <div className="text-2xl font-black mb-1">파비콘</div>
          <div className="text-[11px] text-white/60 mb-3">favicon.ico · 16/32 PNG</div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/10 w-fit">
            <LogoInline svgStr={heroSvgStr} displaySize={12} className="overflow-hidden" style={{ borderRadius: `${Math.round(12 * LOGO_RADIUS)}px` }} />
            <span className="text-[10px] font-medium">logodown</span>
          </div>
        </div>
        <div className="rounded-2xl bg-zinc-50 p-4 break-keep">
          <div className="text-2xl font-black text-zinc-900 mb-1">iOS</div>
          <div className="text-[11px] text-zinc-500 mb-3">apple-touch 180px</div>
          <LogoInline svgStr={heroSvgStr} displaySize={48} className="shadow-md overflow-hidden" style={{ borderRadius: `${Math.round(48 * LOGO_RADIUS)}px` }} />
        </div>
        <div className="rounded-2xl bg-zinc-50 p-4 break-keep">
          <div className="text-2xl font-black text-zinc-900 mb-1">PWA</div>
          <div className="text-[11px] text-zinc-500 mb-3">192/512 + manifest</div>
          <div className="flex gap-1.5 items-end">
            <LogoInline svgStr={heroSvgStr} displaySize={36} className="shadow-sm overflow-hidden" style={{ borderRadius: `${Math.round(36 * LOGO_RADIUS)}px` }} />
            <LogoInline svgStr={heroSvgStr} displaySize={52} className="shadow-md overflow-hidden" style={{ borderRadius: `${Math.round(52 * LOGO_RADIUS)}px` }} />
          </div>
        </div>
        <div className="rounded-2xl bg-zinc-900 text-white p-4 break-keep">
          <div className="text-2xl font-black mb-1">소셜</div>
          <div className="text-[11px] text-white/60 mb-3">OG 1200×630</div>
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/10">
            <LogoInline svgStr={heroSvgStr} displaySize={20} className="overflow-hidden" style={{ borderRadius: `${Math.round(20 * LOGO_RADIUS)}px` }} />
            <span className="text-xs font-bold">logodown</span>
          </div>
        </div>
      </div>
    </Section>
  );
}

export function BottomCta({ onStart }: { onStart: () => void }) {
  return (
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
  );
}
