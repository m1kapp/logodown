import { isSlotFilled, layoutSlots, LAYOUT, type Slot, type TextRenderer } from "./logo-engine";
import { LOGO_RADIUS } from "./logo-styles";

/* ══════════════════════════════════════════════
   Guide overlay — 로고 위에 겹쳐 그리는 설계 가이드.
   내보내는 SVG 에는 들어가지 않고 미리보기에만 표시된다.
══════════════════════════════════════════════ */

/** 가이드 종류별 색 — 아래 범례(GUIDE_LEGEND)와 짝이 맞아야 한다. */
const C = {
  safe: "#22d3ee",   // Android 적응형 세이프존 66%
  mask: "#a78bfa",   // maskable PNG 세이프 영역 80%
  slot: "#f43f5e",   // 슬롯 잉크 박스
  axis: "#facc15",   // 중심축 + 기준 높이
} as const;

export const GUIDE_LEGEND: { color: string; label: string }[] = [
  { color: C.slot, label: "잉크 박스" },
  { color: C.axis, label: "기준 높이 30%" },
  { color: C.safe, label: "세이프존 66%" },
  { color: C.mask, label: "maskable 80%" },
];

export function LogoGuides({ front, back, textRenderer, className }: {
  front: Slot;
  back: Slot;
  textRenderer?: TextRenderer;
  className?: string;
}) {
  const S = 100; // 오버레이 전용 좌표계 — 실제 렌더 크기와 무관
  const filled = [front, back].filter(isSlotFilled);
  const slots = (filled.length ? filled : [{ kind: "char", value: "A" } as Slot])
    .map((slot) => ({ slot, scale: 1 }));
  const { boxes, height, cy, groupW } = layoutSlots(S, slots, textRenderer);
  const r = S * LOGO_RADIUS;

  const band = (ratio: number, color: string) => {
    const side = S * ratio;
    const off = (S - side) / 2;
    return (
      <rect
        x={off} y={off} width={side} height={side}
        rx={Math.max(r - off, 0)}
        fill="none" stroke={color} strokeWidth={0.9} strokeDasharray="3 2.5"
      />
    );
  };

  return (
    <svg
      viewBox={`0 0 ${S} ${S}`}
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      {/* 캔버스 테두리 */}
      <rect x={0.25} y={0.25} width={S - 0.5} height={S - 0.5} rx={r} fill="none" stroke="#ffffff" strokeOpacity={0.4} strokeWidth={0.9} />

      {band(0.8, C.mask)}
      {band(0.66, C.safe)}

      {/* 기준 높이 밴드 — 모든 슬롯이 이 위아래 선에 맞는다.
          그룹이 세이프존을 넘어 축소된 경우 height 가 줄어 밴드도 함께 좁아진다. */}
      {[cy - height / 2, cy + height / 2].map((y) => (
        <line key={y} x1={0} y1={y} x2={S} y2={y} stroke={C.axis} strokeWidth={0.6} strokeOpacity={0.55} strokeDasharray="4 3" />
      ))}

      {/* 슬롯별 실제 잉크 박스 — 폭은 슬롯마다 다르다 */}
      {boxes.map((b, i) => (
        <rect
          key={i}
          x={b.cx - b.w / 2} y={b.cy - b.h / 2} width={b.w} height={b.h}
          fill="none" stroke={C.slot} strokeWidth={1}
        />
      ))}

      {/* 그룹 전체 폭 */}
      <line
        x1={(S - groupW) / 2} y1={S - 4} x2={(S + groupW) / 2} y2={S - 4}
        stroke={C.slot} strokeWidth={1}
      />

      {/* 중심축 */}
      <line x1={0} y1={cy} x2={S} y2={cy} stroke={C.axis} strokeWidth={0.7} strokeOpacity={0.8} />
      <line x1={S / 2} y1={0} x2={S / 2} y2={S} stroke={C.axis} strokeWidth={0.7} strokeOpacity={0.8} />

      {/* 축소가 걸렸는지 표시 — 기준 높이보다 줄었으면 그룹이 세이프존에 닿았다는 뜻 */}
      {height < S * LAYOUT.height - 0.01 && (
        <text x={S / 2} y={7} fill={C.safe} fontSize={4.5} textAnchor="middle" fontFamily="monospace">
          {`축소 ${(height / (S * LAYOUT.height) * 100).toFixed(0)}%`}
        </text>
      )}
    </svg>
  );
}
