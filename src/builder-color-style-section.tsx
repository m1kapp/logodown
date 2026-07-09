import { Section } from "@m1kapp/kit";
import { type Slot, buildLogoSvgStr } from "./logo-engine";
import { LogoInline, SegmentControl, ColorSwatch, gridStyle } from "./ui-parts";
import { LOGO_COLORS, LOGO_RADIUS, STYLE_BASES, type StyleBaseId, resolveStyleId, resolveStyle } from "./logo-styles";

export function ColorSection({ color, setColor, colorMode, setColorMode }: {
  color: string;
  setColor: (v: string) => void;
  colorMode: "solid" | "gradient";
  setColorMode: (v: "solid" | "gradient") => void;
}) {
  return (
    <Section>
      <div className="rounded-2xl bg-zinc-50 p-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] font-bold text-zinc-900 tracking-tight">색상</span>
          <SegmentControl
            options={[
              { id: "solid" as const,    label: "단색"       },
              { id: "gradient" as const, label: "그라데이션" },
            ]}
            value={colorMode}
            onChange={setColorMode}
          />
        </div>
        <div className="overflow-x-auto pb-1 scrollbar-hide">
          <div style={gridStyle(LOGO_COLORS.length + 1)}>
            {LOGO_COLORS.map(({ name, hex }) => (
              <ColorSwatch key={name} name={name} hex={hex} active={color === hex} gradient={colorMode === "gradient"} onClick={() => setColor(hex)} />
            ))}
            <label className="w-10 h-10 rounded-lg cursor-pointer flex items-center justify-center bg-white hover:bg-zinc-100 transition-colors relative overflow-hidden border border-dashed border-zinc-300">
              <span className="text-zinc-400 text-lg font-bold">+</span>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            </label>
          </div>
        </div>
      </div>
    </Section>
  );
}

export function StyleSection({ colorMode, styleBase, setStyleBase, color, front, back, shadow, setShadow }: {
  colorMode: "solid" | "gradient";
  styleBase: StyleBaseId;
  setStyleBase: (v: StyleBaseId) => void;
  color: string;
  front: Slot;
  back: Slot;
  shadow: number;
  setShadow: (v: number) => void;
}) {
  return (
    <Section>
      <div className="rounded-2xl bg-zinc-50 p-3">
        <span className="text-[12px] font-bold text-zinc-900 tracking-tight block mb-3">스타일</span>
        <div className="flex gap-3">
          {STYLE_BASES.map((sb) => {
            const sid = resolveStyleId(sb.id, colorMode);
            const s = resolveStyle(sid, color);
            const preview = buildLogoSvgStr(
              front, back, s.bg, LOGO_RADIUS, 200,
              s.bgGradEnd, s.textColor, s.textGradEnd,
            );
            const active = styleBase === sb.id;
            return (
              <button
                key={sb.id}
                onClick={() => setStyleBase(sb.id)}
                className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${active ? "" : "opacity-50 hover:opacity-80"}`}
              >
                <div className={`relative overflow-hidden transition-all ${active ? "ring-2 ring-zinc-900 ring-offset-2" : ""}`} style={{ borderRadius: `${Math.round(56 * LOGO_RADIUS)}px` }}>
                  <LogoInline
                    svgStr={preview}
                    displaySize={56}
                    className="overflow-hidden block"
                    style={{ borderRadius: `${Math.round(56 * LOGO_RADIUS)}px` }}
                  />
                </div>
                <span className={`text-[11px] font-semibold ${active ? "text-zinc-900" : "text-zinc-400"}`}>{sb.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      {/* Shadow level */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-[12px] font-bold text-zinc-900 tracking-tight">음영</span>
        <div className="flex items-center gap-1">
          {[
            { v: 0, label: "없음" },
            { v: 1, label: "약하게" },
            { v: 2, label: "보통" },
            { v: 3, label: "강하게" },
          ].map(({ v, label }) => (
            <button
              key={v}
              onClick={() => setShadow(v)}
              className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                shadow === v
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </Section>
  );
}
