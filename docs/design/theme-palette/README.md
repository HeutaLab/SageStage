# Widget theme palette — derivation

The source of truth for the 20 widget theme colours in
[`../../widget-theme-design.md`](../../widget-theme-design.md). The values in that spec's
§4 are this script's output; nothing there was picked by eye.

Node only, no dependencies, nothing to install.

```bash
node docs/design/theme-palette/derive.js          # palette + contrast + CVD audit
node docs/design/theme-palette/gen-check.js theme-check.html   # regenerate the preview
```

- **`oklch.js`** — the colour engine. OKLCH ↔ sRGB with chroma-reducing gamut mapping,
  WCAG contrast, alpha compositing, and a binary-search solver that finds the lightness
  at a given hue hitting a target contrast against a background. Round-trips every
  sample hex with zero channel error.
- **`derive.js`** — the rule. Each theme names a hue and an intent; the engine measures
  every pair and auto-corrects only values that miss their floor. Prints the palette,
  the contrast audit, a Viénot deuteranopia/protanopia simulation, and the closest
  background pairs. **It must report `measurements below floor: 0`.**
- **`gen-check.js`** — writes `theme-check.html`, the visual check page (same convention
  as `icon-check.html` and `print-check.html`).

To change a theme, edit its `h` / `L` / `C` in the `THEMES` table in `derive.js` and
re-run. To add one, add a row — the rest is derived. Do not hand-edit hex values into
the spec or into `app.js`; change the rule and regenerate, or the two will drift.

Floors are `4.5:1` for text and `3:1` for non-text, the standard already documented in
`style.css` around `--ink-faint` and `--danger-ink`. Targets sit above the floors on
purpose: a projector washes contrast out and children sit at the back of the room.
