import { Section, Tooltip } from "@m1kapp/kit";
import { LOGO_SYMBOLS, type Slot, type SlotKind } from "./logo-engine";
import { SymbolIcon, SegmentControl, gridStyle } from "./ui-parts";
import { type CharMode, type PickerMode, MODE_OPTIONS, charsForMode } from "./char-data";

export function SlotPickerSection({
  activeSlot, setActiveSlot, pickerMode, setPickerMode, activeValue, pickFromGrid, cellCls,
  frontRotate, backRotate, setFrontRotate, setBackRotate,
  frontScale, backScale, setFrontScale, setBackScale,
}: {
  activeSlot: "front" | "back";
  setActiveSlot: (v: "front" | "back") => void;
  pickerMode: PickerMode;
  setPickerMode: (v: PickerMode) => void;
  activeValue: Slot;
  pickFromGrid: (kind: SlotKind, value: string) => void;
  cellCls: (active: boolean) => string;
  frontRotate: number;
  backRotate: number;
  setFrontRotate: (v: number) => void;
  setBackRotate: (v: number) => void;
  frontScale: number;
  backScale: number;
  setFrontScale: (v: number) => void;
  setBackScale: (v: number) => void;
}) {
  const currentRotate = activeSlot === "front" ? frontRotate : backRotate;
  const setCurrentRotate = activeSlot === "front" ? setFrontRotate : setBackRotate;
  const currentScale = activeSlot === "front" ? frontScale : backScale;
  const setCurrentScale = activeSlot === "front" ? setFrontScale : setBackScale;

  return (
    <Section>
      <div className="rounded-2xl bg-zinc-50 p-3">
        <div className="flex items-center justify-between mb-3">
          <SegmentControl
            options={[{ id: "front" as const, label: "앞 슬롯" }, { id: "back" as const, label: "뒤 슬롯" }]}
            value={activeSlot}
            onChange={setActiveSlot}
          />
        </div>
        <div className="flex items-center justify-between mb-3">
          <SegmentControl
            options={MODE_OPTIONS}
            value={pickerMode}
            onChange={setPickerMode}
          />
          <span className="text-[11px] text-zinc-400 font-medium tabular-nums">
            {pickerMode === "symbol"
              ? LOGO_SYMBOLS.filter((s) => s.id !== "none").length
              : charsForMode(pickerMode as CharMode).length}
          </span>
        </div>
        {pickerMode === "symbol" ? (() => {
          const symbols = LOGO_SYMBOLS.filter((s) => s.id !== "none");
          return (
            <div className="overflow-x-auto pb-1 scrollbar-hide">
              <div style={gridStyle(symbols.length)}>
                {symbols.map((s) => {
                  const isActive = activeValue.kind === "symbol" && activeValue.value === s.id;
                  return (
                    <Tooltip key={s.id} label={s.id}>
                      <button onClick={() => pickFromGrid("symbol", s.id)} className={cellCls(isActive)}>
                        <SymbolIcon sym={s} size={16} />
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          );
        })() : (() => {
          const chars = charsForMode(pickerMode as CharMode);
          const cellFont: React.CSSProperties =
            pickerMode === "lower"
              ? { fontFamily: "Pacifico, cursive", fontWeight: 400, fontSize: "1.15rem" }
              : pickerMode === "hangul"
                ? { fontFamily: "'Pretendard Variable', 'Pretendard', system-ui, sans-serif", fontWeight: 900 }
                : {};
          return (
            <div className="overflow-x-auto pb-1 scrollbar-hide">
              <div style={gridStyle(chars.length)}>
                {chars.map((l) => {
                  const isActive = activeValue.kind === "char" && activeValue.value === l;
                  return (
                    <button
                      key={l}
                      onClick={() => pickFromGrid("char", l)}
                      className={cellCls(isActive)}
                      style={cellFont}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
      {/* Rotate + Scale */}
      <div className="flex flex-col gap-2 mt-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold text-zinc-900 tracking-tight shrink-0 w-7">회전</span>
          <div className="flex items-center gap-1">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <button
                key={deg}
                onClick={() => setCurrentRotate(deg)}
                className={`w-8 h-8 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                  currentRotate === deg
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold text-zinc-900 tracking-tight shrink-0 w-7">크기</span>
          <div className="flex items-center gap-1">
            {[1, 1.05, 1.10, 1.15, 1.20].map((s) => (
              <button
                key={s}
                onClick={() => setCurrentScale(s)}
                className={`h-8 px-2.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                  currentScale === s
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                }`}
              >
                {s === 1 ? "1x" : `${s.toFixed(2)}x`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
