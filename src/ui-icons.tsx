import type { ReactNode } from "react";

// 4개 아이콘이 공유하던 stroke 기반 <svg> 래퍼. 속성 중복 제거용.
function StrokeIcon({ size, children }: { size: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export function DiceIcon({ size = 16 }: { size?: number }) {
  return (
    <StrokeIcon size={size}>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
      <path d="M16 8h.01"/>
      <path d="M8 8h.01"/>
      <path d="M8 16h.01"/>
      <path d="M16 16h.01"/>
      <path d="M12 12h.01"/>
    </StrokeIcon>
  );
}

export function DownloadIcon({ size = 14 }: { size?: number }) {
  return (
    <StrokeIcon size={size}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </StrokeIcon>
  );
}

export function HomeIcon({ size = 22 }: { size?: number }) {
  return (
    <StrokeIcon size={size}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </StrokeIcon>
  );
}

export function WandIcon({ size = 22 }: { size?: number }) {
  return (
    <StrokeIcon size={size}>
      <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" />
      <path d="m14 7 3 3" />
      <path d="M5 6v4" />
      <path d="M19 14v4" />
      <path d="M10 2v2" />
      <path d="M7 8H3" />
      <path d="M21 16h-4" />
      <path d="M11 3H9" />
    </StrokeIcon>
  );
}
