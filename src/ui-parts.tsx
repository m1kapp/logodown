import { LOGO_SYMBOLS, isLightHex, autoGradientEnd } from "./logo-engine";

export function LogoInline({ svgStr, displaySize, className, style }: {
  svgStr: string; displaySize: number; className?: string; style?: React.CSSProperties;
}) {
  const sized = svgStr.replace(
    /(<svg[^>]+)width="\d+" height="\d+"/,
    `$1width="${displaySize}" height="${displaySize}"`,
  );
  return (
    <div
      className={className}
      style={{ width: displaySize, height: displaySize, flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: sized }}
    />
  );
}

export function SymbolIcon({ sym, size = 18 }: { sym: typeof LOGO_SYMBOLS[0]; size?: number }) {
  const vb = sym.vb ?? 100;
  if (sym.isRing) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="currentColor">
        <path fillRule="evenodd" d="M50 5 A45 45 0 1 1 50 95 A45 45 0 1 1 50 5 Z M50 20 A30 30 0 1 0 50 80 A30 30 0 1 0 50 20 Z" />
      </svg>
    );
  }
  const rot = sym.rotate != null ? `rotate(${sym.rotate}, ${vb / 2}, ${vb / 2})` : undefined;
  const dList = Array.isArray(sym.d) ? sym.d : [sym.d as string];
  if (sym.stroke) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill="none" stroke="currentColor" strokeWidth={sym.strokeWidth ?? 2} strokeLinecap="round" strokeLinejoin="round">
        {dList.map((d, i) => <path key={i} d={d} transform={rot} />)}
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill="currentColor">
      {dList.map((d, i) => (
        <path key={i} d={d} fillRule={(sym.fillRule as React.SVGAttributes<SVGPathElement>["fillRule"]) ?? "nonzero"} transform={rot} />
      ))}
    </svg>
  );
}

export function PickerHeader({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-[12px] font-bold text-zinc-900 tracking-tight">{label}</span>
      {right}
    </div>
  );
}

export function SegmentControl<T extends string>({ options, value, onChange }: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex p-0.5 rounded-lg bg-zinc-100">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
            value === o.id
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Row-major 2-row grid with horizontal scroll: fills row 1 fully, then row 2.
export function ColorSwatch({ name, hex, active, gradient, onClick }: {
  name: string; hex: string; active: boolean; gradient: boolean; onClick: () => void;
}) {
  const swatchBg = gradient ? `linear-gradient(135deg, ${hex}, ${autoGradientEnd(hex)})` : undefined;
  // 흰색/거의-흰색 스와치는 카드 배경(zinc-50 ≈ #fafafa)과 구분이 안 돼 '빈칸'처럼
  // 보이므로 테두리 추가 (일반 밝은 색은 채도가 있어 문제없음, near-white만 타겟)
  const [r, g, b] = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((h) => parseInt(h, 16) || 0);
  const needsBorder = !gradient && r > 235 && g > 235 && b > 235;
  return (
    <button
      onClick={onClick}
      className={`relative w-10 h-10 rounded-lg cursor-pointer transition-all flex items-center justify-center ${active ? "scale-90 shadow-md" : "hover:scale-95"} ${needsBorder ? "border border-zinc-300" : ""}`}
      style={swatchBg ? { background: swatchBg } : { backgroundColor: hex }}
      title={name}
    >
      {active && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isLightHex(hex) ? "#09090b" : "#ffffff"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );
}

export function gridStyle(itemCount: number, cellSize = "2.5rem"): React.CSSProperties {
  const cols = Math.max(1, Math.ceil(itemCount / 2));
  return {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, ${cellSize})`,
    gridTemplateRows: `repeat(2, ${cellSize})`,
    gap: "0.375rem",
  };
}
