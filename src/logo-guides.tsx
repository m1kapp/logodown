import { isSlotFilled, slotLayout, type Slot } from "./logo-engine";
import { LOGO_RADIUS } from "./logo-styles";

/* ══════════════════════════════════════════════
   Guide overlay — 로고 위에 겹쳐 그리는 설계 가이드.
   내보내는 SVG 에는 들어가지 않고 미리보기에만 표시된다.
══════════════════════════════════════════════ */

/** 가이드 종류별 색 — 아래 범례(GUIDE_LEGEND)와 짝이 맞아야 한다. */
const C = {
  safe: "#22d3ee",   // Android 적응형 세이프존 66%
  mask: "#a78bfa",   // maskable PNG 세이프 영역 80%
  slot: "#f43f5e",   // 슬롯 박스 E×E
  axis: "#facc15",   // 중심축
} as const;

export const GUIDE_LEGEND: { color: string; label: string }[] = [
  { color: C.slot, label: "슬롯 30%" },
  { color: C.safe, label: "세이프존 66%" },
  { color: C.mask, label: "maskable 80%" },
  { color: C.axis, label: "중심축" },
];

export function LogoGuides({ front, back, className }: {
  front: Slot;
  back: Slot;
  className?: string;
}) {
  const S = 100; // 오버레이 전용 좌표계 — 실제 렌더 크기와 무관
  const slotCount = [front, back].filter(isSlotFilled).length || 1;
  const { E, cy, cxs, groupW } = slotLayout(S, slotCount);
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

      {/* 슬롯 박스 + 슬롯별 중심 */}
      {cxs.map((cx, i) => (
        <g key={i}>
          <rect
            x={cx - E / 2} y={cy - E / 2} width={E} height={E}
            fill="none" stroke={C.slot} strokeWidth={1}
          />
          <line x1={cx} y1={cy - E / 2} x2={cx} y2={cy + E / 2} stroke={C.slot} strokeWidth={0.5} strokeOpacity={0.6} />
        </g>
      ))}

      {/* 그룹 전체 폭 표시 */}
      <line
        x1={(S - groupW) / 2} y1={S - 4} x2={(S + groupW) / 2} y2={S - 4}
        stroke={C.slot} strokeWidth={1}
      />

      {/* 중심축 */}
      <line x1={0} y1={cy} x2={S} y2={cy} stroke={C.axis} strokeWidth={0.7} strokeOpacity={0.8} />
      <line x1={S / 2} y1={0} x2={S / 2} y2={S} stroke={C.axis} strokeWidth={0.7} strokeOpacity={0.8} />
    </svg>
  );
}
