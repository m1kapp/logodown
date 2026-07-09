import type { Slot } from "./logo-engine";
import type { StyleId } from "./logo-styles";

export type ShowcaseLogo = {
  front: Slot;
  back: Slot;
  color: string;
  style: StyleId;
  fr?: number; // front rotate
  br?: number; // back rotate
  fs?: number; // front scale
  bs?: number; // back scale
};

// Hand-picked combinations that showcase the tool's range.
// Color hues are intentionally distributed across the spectrum.
// fr/br = front/back rotate, fs/bs = front/back scale
export const HOME_SHOWCASE: ShowcaseLogo[] = [
  // 1. Markdown 아이덴티티 — 반드시 첫 번째
  { front: { kind: "char", value: "M"  }, back: { kind: "symbol", value: "down"     }, color: "#09090b", style: "solid"                                 },
  // 2. 로켓 발사 — 45° 기울어진 로켓, 그라데이션
  { front: { kind: "char", value: "N"  }, back: { kind: "symbol", value: "rocket"   }, color: "#3b82f6", style: "gradient",     br: 45, bs: 1.10         },
  // 3. 심볼 앞 배치 — 톱니바퀴 + 이니셜, 화이트 위 컬러
  { front: { kind: "symbol", value: "settings" }, back: { kind: "char", value: "k"  }, color: "#0d9488", style: "onWhiteGrad",  fr: 0, fs: 1.15          },
  // 4. 한글 · 별 — 다크 배경에 골드
  { front: { kind: "char", value: "별" }, back: { kind: "symbol", value: "star"     }, color: "#eab308", style: "onBlack",      bs: 1.10                 },
  // 5. 번개 — 바이올렛 그라데
  { front: { kind: "char", value: "S"  }, back: { kind: "symbol", value: "zap"      }, color: "#7c3aed", style: "gradient",     bs: 1.15                 },
  // 6. 망치 — 오렌지, 살짝 기울임
  { front: { kind: "char", value: "B"  }, back: { kind: "symbol", value: "hammer"   }, color: "#f97316", style: "solid",        br: 315                  },
  // 7. 다이아몬드 — 틸, 45° 회전으로 정사각형처럼
  { front: { kind: "char", value: "D"  }, back: { kind: "symbol", value: "diamond"  }, color: "#06b6d4", style: "solid",        br: 45                   },
  // 8. 소문자 필기체 + 깃털 — 로즈, 우아하게
  { front: { kind: "char", value: "a"  }, back: { kind: "symbol", value: "feather"  }, color: "#fb7185", style: "onWhite",      br: 315, bs: 1.10        },
  // 9. 검 — 다크 배경에 퍼플, 대각선
  { front: { kind: "char", value: "X"  }, back: { kind: "symbol", value: "sword"    }, color: "#a855f7", style: "onBlackGrad",  br: 0, bs: 1.15          },
  // 10. 한글 꿈 + 혜성 — 푸시아
  { front: { kind: "char", value: "꿈" }, back: { kind: "symbol", value: "meteor2"  }, color: "#d946ef", style: "onBlackGrad",  bs: 1.05                 },
  // 11. 불꽃 + 스케일업 — 레드
  { front: { kind: "char", value: "F"  }, back: { kind: "symbol", value: "flame"    }, color: "#ef4444", style: "gradient",     bs: 1.20                 },
  // 12. 렌치 — 라임, 공구 느낌
  { front: { kind: "symbol", value: "wrench" }, back: { kind: "char", value: "42"   }, color: "#84cc16", style: "solid",        fr: 315, fs: 1.10        },
];
