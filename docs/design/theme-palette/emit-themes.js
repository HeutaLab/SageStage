// Emits the THEMES array exactly as it should appear in app.js, so no hex value
// is ever transcribed by hand. Run after changing the rule in derive.js:
//   node docs/design/theme-palette/emit-themes.js
const { derived } = require('./derive.js');
const K = require('./oklch.js');

const q = (s) => "'" + s + "'";
const pad = (s, n) => String(s).padEnd(n);

// A theme with an alpha stays translucent on the card — that is its character.
// Only its CONTROLS sit on the opaque scrim, so bg carries the alpha and scrim
// carries the flat tone.
const cardValue = (d) => {
  if (d.isClear) return 'transparent';
  if (d.alpha === undefined) return d.bg;
  const [r, g, b] = K.hexToRgb(d.bg);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + d.alpha + ')';
};

const lines = derived.map((d) => {
  const parts = [
    'id: ' + pad(q(d.id) + ',', 14),
    'name: ' + pad(q(d.name) + ',', 15),
    'bg: ' + pad(q(cardValue(d)) + ',', 26),
    'ink: ' + pad(q(d.ink) + ',', 12),
    'soft: ' + pad(q(d.soft) + ',', 12),
    'acc: ' + pad(q(d.accent) + ',', 12),
    'accInk: ' + pad(q(d.onAccent) + ',', 12),
    'accWash: ' + pad(q(d.accentSoft) + ',', 12),
    'accSoft: ' + pad(q(d.accentInk) + ',', 12),
    'accDeep: ' + pad(q(d.deep) + ',', 12),
  ];
  if (d.isClear) parts.push('scrim: ' + q(d.scrimPlate) + ', clear: true, ');
  else if (d.alpha !== undefined) parts.push('scrim: ' + q(d.bg) + ', ');
  if (d.dark) parts.push('dark: true, ');
  return '    { ' + parts.join('') .replace(/,\s*$/, '') + ' },';
});

console.log('  const THEMES = [');
console.log(lines.join('\n'));
console.log('  ];');
