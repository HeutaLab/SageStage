// Sage Stage widget themes, v2.
// The rule proposes, the audit disposes: each theme names an intent in OKLCH,
// the engine verifies every pair against the floors, and only a value that
// MISSES gets solved automatically. So the palette stays designed, but cannot
// ship a failure.
const K = require('./oklch.js');

const FLOOR = { text: 4.5, ui: 3.0 };
// Targets sit above the floors: a classroom projector washes contrast out and
// children sit up to 8m back, so the floor is a failure line, not a goal.
const WANT = { ink: 8.0, soft: 5.0, label: 5.0, edge: 3.4, accentInk: 4.9 };

// L and C are per theme, not per tier — v1 used rigid tiers and collapsed
// Slate onto Ink and Ocean onto Navy. Tier now only groups them for the picker.
// The four themes with no hue of their own anchor on the brand teal rather than
// an invented blue. `card` is the fallback for every unset theme (app.js:9021)
// and resolves for 52 of the 94 widgets across the shipped templates, so its
// accent IS the default look of Sage Stage — it keeps #0f766e exactly.
const BRAND_TEAL = '#0f766e';
const TEAL_H = 186;

const THEMES = [
  { id: 'card',       name: 'Paper',       tier: 'neutral', h: 235, L: 0.970, C: 0.006, accentPin: BRAND_TEAL },
  { id: 'glass',      name: 'Frost',       tier: 'neutral', h: 205, L: 0.955, C: 0.014, alpha: 0.55, accentPin: BRAND_TEAL },
  { id: 'clear',      name: 'Clear',       tier: 'clear',   h: 235, L: 0.970, C: 0.006, accentPin: BRAND_TEAL },
  { id: 'clearlight', name: 'Clear light', tier: 'clear',   h: 235, L: 0.215, C: 0.028, dark: true, accentH: TEAL_H },
  // Pastel hues spread as evenly as seven allow, and lightness alternates so
  // neighbouring hues also separate by tone — hue alone leaves Rose and Blossom
  // nearly the same card at projector distance.
  { id: 'lilac',      name: 'Lilac',       tier: 'pastel',  h: 300, L: 0.918, C: 0.068 },
  { id: 'mint',       name: 'Mint',        tier: 'pastel',  h: 162, L: 0.948, C: 0.068 },
  // accentH rotates the accent off the card's own hue. Yellow and yellow-green
  // cannot darken without going olive, so their accents borrow the nearest warm
  // anchor — still unmistakably the same family, but amber instead of mud.
  { id: 'lemon',      name: 'Lemon',       tier: 'pastel',  h: 105, L: 0.960, C: 0.085, accentH: 72 },
  { id: 'peach',      name: 'Peach',       tier: 'pastel',  h: 62,  L: 0.922, C: 0.078 },
  { id: 'pink',       name: 'Blossom',     tier: 'pastel',  h: 340, L: 0.940, C: 0.060 },
  { id: 'sky',        name: 'Sky',         tier: 'pastel',  h: 238, L: 0.930, C: 0.062 },
  { id: 'rose',       name: 'Rose',        tier: 'pastel',  h: 18,  L: 0.905, C: 0.070 },
  { id: 'sun',        name: 'Sun',         tier: 'bold',    h: 100, L: 0.895, C: 0.155, accentH: 66 },
  { id: 'tangerine',  name: 'Tangerine',   tier: 'bold',    h: 55,  L: 0.835, C: 0.115 },
  { id: 'grape',      name: 'Grape',       tier: 'deep',    h: 295, L: 0.470, C: 0.200, dark: true },
  { id: 'ocean',      name: 'Ocean',       tier: 'deep',    h: 262, L: 0.460, C: 0.170, dark: true },
  { id: 'crimson',    name: 'Crimson',     tier: 'deep',    h: 27,  L: 0.400, C: 0.145, dark: true },
  { id: 'forest',     name: 'Forest',      tier: 'deep',    h: 155, L: 0.395, C: 0.100, dark: true },
  { id: 'navy',       name: 'Navy',        tier: 'deep',    h: 245, L: 0.360, C: 0.075, dark: true },
  { id: 'dark',       name: 'Slate',       tier: 'night',   h: 235, L: 0.305, C: 0.018, dark: true },
  { id: 'ink',        name: 'Ink',         tier: 'night',   h: 265, L: 0.215, C: 0.028, dark: true },
];

// Transparent themes: controls sit on a scrim plate so their contrast is
// knowable even though the wallpaper behind them is not.
const SCRIM_ALPHA = 0.82;
// Worst realistic case to audit against: a mid-grey wallpaper is the hardest
// thing for a translucent plate to sit on, in both directions.
const WORST_WALL = '#7f7f7f';

// Intent offsets, in OKLCH lightness relative to the card. Chroma is chosen so
// text reads as text and the accent reads as a control.
const INTENT = {
  light: { ink: 0.32, soft: 0.50, accent: 0.50, onAccent: 0.98, inkC: 0.022, softC: 0.030, accC: 0.135, onC: 0.012 },
  dark:  { ink: 0.965, soft: 0.80, accent: 0.875, onAccent: 0.26, inkC: 0.028, softC: 0.035, accC: 0.115, onC: 0.045 },
};

function verify(hex, bg, want, floor, hue, chroma, dir) {
  const got = K.contrast(hex, bg);
  if (got >= floor) return { hex, contrast: got, corrected: false };
  const fixed = K.solveForContrast(hue, chroma, bg, want, dir);
  return { hex: fixed.hex, contrast: fixed.contrast, corrected: true };
}

function derive(t) {
  const dark = !!t.dark;
  const I = dark ? INTENT.dark : INTENT.light;
  const dir = dark ? 'lighter' : 'darker';
  const inv = dark ? 'darker' : 'lighter';
  const isClear = t.tier === 'clear';
  const aH = t.accentH === undefined ? t.h : t.accentH;

  const cardHex = K.oklchToHex(t.L, t.C, t.h);
  // Anything the teacher can see through is measured against the worst realistic
  // wallpaper, not against its own tint. That covers the two clear themes AND
  // Frost, whose 0.55 alpha means its "passing" ratios today hold only against
  // the default stage — set a photo behind it and they quietly stop holding.
  // One rule for all three: a see-through card keeps its translucent field, but
  // its CONTROLS sit on a scrim plate, so their contrast is knowable. Frost is
  // included — at 0.55 alpha it is as see-through as Clear, and measuring it
  // honestly is what showed its accent edge was 2.93:1 on a mid-grey wallpaper.
  const seeThrough = isClear || (t.alpha !== undefined && t.alpha < 0.9);
  const bg = seeThrough ? K.overHex(cardHex, SCRIM_ALPHA, WORST_WALL) : cardHex;

  const ink = verify(K.oklchToHex(I.ink, I.inkC, t.h), bg, WANT.ink, FLOOR.text, t.h, I.inkC, dir);
  const soft = verify(K.oklchToHex(I.soft, I.softC, t.h), bg, WANT.soft, FLOOR.text, t.h, I.softC, dir);

  // The solid button. Its label is the binding constraint — a fill dark (or
  // pale) enough for its label always clears the 3:1 edge as a side effect.
  let accent = t.accentPin || K.oklchToHex(I.accent, I.accC, aH);
  let onAccent = K.oklchToHex(I.onAccent, I.onC, aH);
  // A pinned accent is a brand commitment, so it is the label that moves to meet
  // it, never the other way round.
  if (t.accentPin) {
    if (K.contrast(onAccent, accent) < WANT.label) {
      onAccent = K.solveForContrast(aH, I.onC, accent, WANT.label, inv).hex;
    }
  } else {
    for (let i = 0; i < 30 && K.contrast(onAccent, accent) < WANT.label; i++) {
      accent = K.solveForContrast(aH, I.accC, onAccent, WANT.label + 0.1, dark ? 'lighter' : 'darker').hex;
    }
  }
  const labelC = K.contrast(onAccent, accent);
  const edgeC = K.contrast(accent, bg);

  // Ghost button: a wash that stays on the card's own side of the tone scale,
  // so the pale accent still reads on top of it. Tinting a dark card 24% toward
  // its pale accent drove accentInk to near-white — indistinguishable from body
  // text, which throws away the only signal that says "this is interactive".
  // On a dark card the accent is the PALE thing, so the ghost wash has to move
  // away from it — darker, an inset plate — or the accent loses its headroom.
  // Washing lighter is only correct on light cards, where the accent is dark.
  const accentSoft = dark
    ? K.overHex('#000000', 0.12, bg)
    : K.overHex(accent, 0.13, bg);
  let accentInk = accent;
  if (K.contrast(accentInk, accentSoft) < FLOOR.text || K.contrast(accentInk, bg) < FLOOR.text) {
    accentInk = K.solveForContrast(aH, I.accC, accentSoft, WANT.accentInk, dir).hex;
  }

  // --accent-deep is always the deep tone, whatever the card. It exists for the
  // surfaces that are hardcoded white INSIDE a widget body (number line labels,
  // frame-tile chip, word bank reveal), which need a dark accent even when the
  // card around them is dark. Measured against white, not against the card.
  // A pinned accent is already a deep tone and already the brand, so it stands as
  // its own deep value rather than being re-derived from the card's hue — which
  // would hand the teal-pinned themes a blue.
  const deep = t.accentPin && K.contrast(t.accentPin, '#ffffff') >= FLOOR.text
    ? { hex: t.accentPin, contrast: K.contrast(t.accentPin, '#ffffff') }
    : K.solveForContrast(aH, INTENT.light.accC, '#ffffff', WANT.accentInk, 'darker');

  return {
    ...t, dark, isClear,
    deep: deep.hex,
    deepOnWhite: deep.contrast,
    bg: isClear ? 'transparent' : cardHex,
    scrimPlate: isClear ? cardHex : null,
    measured: bg,
    ink: ink.hex, soft: soft.hex, accent, onAccent, accentSoft, accentInk,
    corrected: [ink.corrected && 'ink', soft.corrected && 'soft'].filter(Boolean),
    m: {
      ink: K.contrast(ink.hex, bg),
      soft: K.contrast(soft.hex, bg),
      label: labelC,
      edge: edgeC,
      accentInkOnBg: K.contrast(accentInk, bg),
      accentInkOnSoft: K.contrast(accentInk, accentSoft),
      accentVsInk: K.contrast(accent, ink.hex),
      // Accent-coloured text must not read as body text. Lightness alone is a
      // weak signal, so measure perceptual separation in OKLab, not contrast.
      inkSeparation: (() => {
        const a = K.hexToOklch(accentInk), b = K.hexToOklch(ink.hex);
        let dh = Math.abs(a.h - b.h); if (dh > 180) dh = 360 - dh;
        const chromaW = Math.min(a.C, b.C) / 0.15;
        return Math.hypot((a.L - b.L) * 1.4, (a.C - b.C) * 2.2, (dh / 180) * chromaW * 0.7);
      })(),
    },
  };
}

const derived = THEMES.map(derive);

// ---------------------------------------------------------------- CVD
function simulate(hex, type) {
  const [r, g, b] = K.hexToRgb(hex).map((v) => (v / 255) ** 2.2);
  const L = 17.8824 * r + 43.5161 * g + 4.11935 * b;
  const M = 3.45565 * r + 27.1554 * g + 3.86714 * b;
  const S = 0.0299566 * r + 0.184309 * g + 1.46709 * b;
  let L2 = L, M2 = M;
  if (type === 'deuter') M2 = 0.494207 * L + 1.24827 * S;
  else L2 = 2.02344 * M - 2.52581 * S;
  const r2 = 0.080944 * L2 - 0.130504 * M2 + 0.116721 * S;
  const g2 = -0.0102485 * L2 + 0.0540194 * M2 - 0.113615 * S;
  const b2 = -0.000365294 * L2 - 0.00412163 * M2 + 0.693513 * S;
  const enc = (v) => Math.round(Math.max(0, Math.min(1, v)) ** (1 / 2.2) * 255);
  return K.rgbToHex([enc(r2), enc(g2), enc(b2)]);
}

// ---------------------------------------------------------------- report
const pad = (s, n) => String(s).padEnd(n);
const mark = (v, f) => (v < f ? '  FAIL' : '');
let fails = 0;

console.log('\nDERIVED PALETTE');
console.log(pad('theme', 13) + pad('bg', 10) + pad('ink', 10) + pad('soft', 10) +
  pad('accent', 10) + pad('on-acc', 10) + pad('acc-ink', 10) + 'auto-corrected');
console.log('-'.repeat(88));
for (const d of derived) {
  console.log(pad(d.name, 13) + pad(d.isClear ? '(scrim)' : d.bg, 10) + pad(d.ink, 10) +
    pad(d.soft, 10) + pad(d.accent, 10) + pad(d.onAccent, 10) + pad(d.accentInk, 10) +
    (d.corrected.length ? d.corrected.join(',') : '—'));
}

console.log('\nCONTRAST AUDIT   floors: text 4.5:1, UI edge 3.0:1, ink separation 0.10');
console.log(pad('theme', 13) + pad('ink', 7) + pad('soft', 7) + pad('label', 7) +
  pad('edge', 7) + pad('aink/bg', 9) + pad('aink/soft', 11) + 'ink sep');
console.log('-'.repeat(78));
const SEP_FLOOR = 0.10;
for (const d of derived) {
  const m = d.m;
  const checks = [[m.ink, FLOOR.text], [m.soft, FLOOR.text], [m.label, FLOOR.text],
    [m.edge, FLOOR.ui], [m.accentInkOnBg, FLOOR.text], [m.accentInkOnSoft, FLOOR.text],
    [m.inkSeparation, SEP_FLOOR]];
  for (const [v, f] of checks) if (v < f) fails++;
  console.log(pad(d.name, 13) + pad(K.fmt(m.ink), 7) + pad(K.fmt(m.soft), 7) +
    pad(K.fmt(m.label), 7) + pad(K.fmt(m.edge), 7) + pad(K.fmt(m.accentInkOnBg), 9) +
    pad(K.fmt(m.accentInkOnSoft), 11) + K.fmt(m.inkSeparation) +
    checks.map(([v, f]) => mark(v, f)).join(''));
}
console.log('\nmeasurements below floor: ' + fails);

console.log('\nCVD SIMULATION — button label and edge');
console.log(pad('theme', 13) + pad('deut label', 12) + pad('deut edge', 12) +
  pad('prot label', 12) + 'prot edge');
console.log('-'.repeat(62));
let cvd = 0;
for (const d of derived) {
  const out = [];
  for (const type of ['deuter', 'protan']) {
    const a = simulate(d.accent, type), o = simulate(d.onAccent, type), b = simulate(d.measured, type);
    const lab = K.contrast(o, a), edge = K.contrast(a, b);
    if (lab < FLOOR.text) cvd++;
    if (edge < FLOOR.ui) cvd++;
    out.push(K.fmt(lab) + (lab < FLOOR.text ? '!' : ''), K.fmt(edge) + (edge < FLOOR.ui ? '!' : ''));
  }
  console.log(pad(d.name, 13) + pad(out[0], 12) + pad(out[1], 12) + pad(out[2], 12) + out[3]);
}
console.log('\nCVD measurements below floor: ' + cvd);

// Distinguishability: a teacher colour-coding six groups must tell them apart.
// Weighted so lightness dominates, as it does at distance on a projector.
console.log('\nCLOSEST BACKGROUND PAIRS  (higher = easier to tell apart)');
const solid = derived.filter((d) => !d.isClear);
const pairs = [];
for (let i = 0; i < solid.length; i++) {
  for (let j = i + 1; j < solid.length; j++) {
    const a = K.hexToOklch(solid[i].bg), b = K.hexToOklch(solid[j].bg);
    let dh = Math.abs(a.h - b.h); if (dh > 180) dh = 360 - dh;
    // chroma-weighted hue: hue barely matters when both are near-grey
    const chromaW = Math.min(a.C, b.C) / 0.2;
    const dist = Math.hypot((a.L - b.L) * 1.6, (a.C - b.C) * 1.2, (dh / 180) * chromaW * 0.9);
    // Paper and Frost are meant to be near-identical opaque: what separates them
    // is that Frost is translucent and shows the wallpaper through it. Comparing
    // their flattened hexes is a false positive.
    const translucencyPair = !!solid[i].alpha !== !!solid[j].alpha;
    pairs.push({ n: solid[i].name + ' / ' + solid[j].name, dist, translucencyPair });
  }
}
pairs.sort((x, y) => x.dist - y.dist);
for (const p of pairs.slice(0, 8)) {
  const note = p.translucencyPair ? '   (separated by translucency)'
    : p.dist < 0.05 ? '   TOO CLOSE' : '';
  console.log('  ' + pad(p.n, 26) + K.fmt(p.dist) + note);
}

module.exports = { derived, THEMES, FLOOR, WANT, SCRIM_ALPHA };
