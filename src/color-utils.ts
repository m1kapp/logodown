// "#rrggbb"(또는 "#rgb" 축약 아님) → [r,g,b] 0–255
function hexToRgb255(hex: string): [number, number, number] {
  const h = hex.replace("#", "").padEnd(6, "0");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// max 채널이 어느 색이냐에 따른 색상(hue) 0–1. 무채색이면 0.
function hueFrom(r: number, g: number, b: number, max: number, d: number): number {
  let hh: number;
  if (max === r) hh = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) hh = (b - r) / d + 2;
  else hh = (r - g) / d + 4;
  return hh / 6;
}

function hexToHsl(hex: string): [number, number, number] {
  const [r255, g255, b255] = hexToRgb255(hex);
  const r = r255 / 255, g = g255 / 255, b = b255 / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const hh = hueFrom(r, g, b, max, d);
  return [hh * 360, s * 100, l * 100];
}

function hslToHex(hh: number, s: number, l: number): string {
  hh /= 360; s /= 100; l /= 100;
  const q = l < 0.5 ? l*(1+s) : l+s-l*s, p = 2*l-q;
  const f = (t: number) => {
    if(t<0) t+=1; if(t>1) t-=1;
    if(t<1/6) return p+(q-p)*6*t;
    if(t<1/2) return q;
    if(t<2/3) return p+(q-p)*(2/3-t)*6;
    return p;
  };
  return "#"+[f(hh+1/3),f(hh),f(hh-1/3)].map(x=>Math.round(x*255).toString(16).padStart(2,"0")).join("");
}

export function autoGradientEnd(hex: string): string {
  const [hh, s, l] = hexToHsl(hex);
  return hslToHex((hh + 45) % 360, Math.min(s, 90), Math.max(l - 8, 25));
}

export function isLightHex(hex: string): boolean {
  const [r, g, b] = hexToRgb255(hex);
  // YIQ perceived brightness (0–255)
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}
