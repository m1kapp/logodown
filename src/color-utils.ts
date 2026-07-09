function hexToHsl(hex: string): [number, number, number] {
  const h = hex.replace("#", "").padEnd(6, "0");
  let r = parseInt(h.slice(0,2),16)/255, g = parseInt(h.slice(2,4),16)/255, b = parseInt(h.slice(4,6),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let hh = 0, s = 0, l = (max+min)/2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    if (max===r) hh = (g-b)/d + (g<b?6:0);
    else if (max===g) hh = (b-r)/d + 2;
    else hh = (r-g)/d + 4;
    hh /= 6;
  }
  return [hh*360, s*100, l*100];
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
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // YIQ perceived brightness (0–255)
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}
