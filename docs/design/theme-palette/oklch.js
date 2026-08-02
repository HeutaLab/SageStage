// Perceptual colour engine for the Sage Stage theme derivation.
// OKLCH in, sRGB hex out, with gamut mapping and WCAG contrast solving.
// Everything here is pure: no deps, no I/O.

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// ---- sRGB transfer ----
function toLinear(v) {
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
function fromLinear(v) {
  return v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
}

// ---- hex <-> rgb ----
function hexToRgb(hex) {
  const m = String(hex).trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) throw new Error('bad hex: ' + hex);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]) {
  const h = (v) => Math.round(clamp01(v / 255) * 255).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}

// ---- OKLab ----
function linRgbToOklab([r, g, b]) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  ];
}
function oklabToLinRgb([L, a, b]) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

function hexToOklch(hex) {
  const lin = hexToRgb(hex).map((v) => toLinear(v / 255));
  const [L, a, b] = linRgbToOklab(lin);
  const C = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L, C, h };
}

function inGamut([r, g, b]) {
  const eps = 1e-6;
  return r >= -eps && r <= 1 + eps && g >= -eps && g <= 1 + eps && b >= -eps && b <= 1 + eps;
}

// Reduce chroma (binary search) until the colour fits sRGB. Preserves L and hue,
// which is what keeps a derived ramp perceptually even across hues.
function oklchToHex(L, C, h) {
  const rad = (h * Math.PI) / 180;
  const at = (c) => oklabToLinRgb([L, Math.cos(rad) * c, Math.sin(rad) * c]);
  let lin = at(C);
  if (!inGamut(lin)) {
    let lo = 0, hi = C;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(at(mid))) lo = mid; else hi = mid;
    }
    lin = at(lo);
  }
  return rgbToHex(lin.map((v) => fromLinear(clamp01(v)) * 255));
}

// ---- WCAG ----
function relLum(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => toLinear(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [x, y] = [relLum(a), relLum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// Composite a translucent colour over a base. top = [r,g,b,a] 0-255 / 0-1.
function overHex(topHex, alpha, baseHex) {
  const t = hexToRgb(topHex), b = hexToRgb(baseHex);
  return rgbToHex([0, 1, 2].map((i) => t[i] * alpha + b[i] * (1 - alpha)));
}

// ---- solvers ----
// Find the OKLCH lightness at a given hue/chroma that hits a target contrast
// against `bg`. dir 'darker' searches below the bg's lightness, 'lighter' above.
// Returns the hex, or the best achievable if the target is out of reach.
function solveForContrast(hue, chroma, bg, target, dir) {
  const lo0 = dir === 'darker' ? 0 : hexToOklch(bg).L;
  const hi0 = dir === 'darker' ? hexToOklch(bg).L : 1;
  let lo = lo0, hi = hi0, best = null, bestC = dir === 'darker' ? -1 : -1;
  // contrast is monotonic in L on each side of the bg
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    const hex = oklchToHex(mid, chroma, hue);
    const c = contrast(hex, bg);
    if (c >= target) {
      best = hex; bestC = c;
      if (dir === 'darker') lo = mid; else hi = mid;
    } else {
      if (dir === 'darker') hi = mid; else lo = mid;
    }
  }
  if (best) return { hex: best, contrast: bestC, reached: true };
  // target unreachable at this chroma: return the extreme end
  const hex = oklchToHex(dir === 'darker' ? 0 : 1, chroma, hue);
  return { hex, contrast: contrast(hex, bg), reached: false };
}

// Highest-contrast of black/white against a fill — for picking an on-colour.
function bestOn(fill, darkInk, lightInk) {
  const d = contrast(darkInk, fill), l = contrast(lightInk, fill);
  return d >= l ? { hex: darkInk, contrast: d } : { hex: lightInk, contrast: l };
}

const fmt = (n) => (Math.round(n * 100) / 100).toFixed(2);

module.exports = {
  hexToRgb, rgbToHex, hexToOklch, oklchToHex,
  contrast, relLum, overHex, solveForContrast, bestOn, fmt,
};
