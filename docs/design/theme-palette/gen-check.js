// Emits theme-check.html — the derived palette rendered as real widget cards
// and as the new picker swatch, so the design can be judged by eye and not by
// a table of hex values.
const fs = require('fs');
const K = require('./oklch.js');
const { derived } = require('./derive.js');

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const f = K.fmt;

// A wallpaper stand-in for the transparent themes, so the scrim can be judged
// against something busy rather than against flat grey.
const WALL = 'linear-gradient(135deg,#6f8fa8 0%,#b9c8a6 38%,#7e6f8e 68%,#c9a07a 100%)';

function card(d) {
  const clear = d.isClear;
  const plate = clear ? `background:${d.scrimPlate};opacity:1;` : '';
  const surface = clear
    ? `background:${hexToRgba(d.scrimPlate, 0.82)};backdrop-filter:blur(6px);`
    : `background:${d.bg};`;
  const widget = `<div class="widget" style="${surface}color:${d.ink};">
      <div class="whead">
        <span class="wtitle" style="color:${d.soft};">${esc(d.name.toUpperCase())}</span>
        <span class="wdots" style="color:${d.soft};">•••</span>
      </div>
      <div class="wbody">
        <p class="wtext">Line up in twos.</p>
        <p class="wsoft" style="color:${d.soft};">Secondary note</p>
        <div class="wrow">
          <button class="wbtn" style="background:${d.accent};color:${d.onAccent};">Start</button>
          <button class="wghost" style="background:${d.accentSoft};color:${d.accentInk};">Reset</button>
        </div>
      </div>
    </div>`;
  return `
  <figure class="wcard${clear ? ' on-wall' : ''}">
    ${clear ? `<span class="wall">${widget}</span>` : widget}
    <figcaption>
      <strong>${esc(d.name)}</strong>
      <span class="mono">ink ${f(d.m.ink)} · label ${f(d.m.label)} · edge ${f(d.m.edge)}</span>
    </figcaption>
  </figure>`;
}

function hexToRgba(hex, a) {
  const [r, g, b] = K.hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

// The new picker swatch: the theme's real ink as "Aa", its real accent as a
// button pill, and a visible name. Nothing abstract, nothing that has to be
// decoded — and nothing resembling a bar-and-dot.
function swatch(d) {
  const clear = d.isClear;
  const surface = clear
    ? `background:${hexToRgba(d.scrimPlate, 0.82)};`
    : `background:${d.bg};`;
  return `
  <button class="sw${clear ? ' sw-clear' : ''}" title="${esc(d.name)}" aria-label="${esc(d.name)} theme">
    <span class="sw-face" style="${surface}">
      <span class="sw-aa" style="color:${d.ink};">Aa</span>
      <span class="sw-pill" style="background:${d.accent};"></span>
    </span>
    <span class="sw-name">${esc(d.name)}</span>
  </button>`;
}

const html = `<!doctype html>
<meta charset="utf-8">
<title>Sage Stage — derived theme palette</title>
<style>
  :root { color-scheme: light; }
  body {
    margin: 0; padding: 14px 18px 40px;
    font: 12px/1.45 "Quicksand", "Lexend", system-ui, -apple-system, sans-serif;
    background: #eef2f1; color: #22303c;
  }
  h1 { font-size: 15px; font-weight: 700; margin: 0 0 2px; }
  h2 { font-size: 12.5px; font-weight: 700; margin: 20px 0 7px; letter-spacing: .3px; }
  .lede { color: #5b6b7b; margin: 0 0 4px; max-width: 92ch; font-size: 11px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(158px, 1fr)); gap: 9px; }
  .wcard { margin: 0; }
  .wcard.on-wall .widget { box-shadow: none; border-color: transparent; }
  .wcard.on-wall .widget { margin: 0; }
  .wcard.on-wall .wall {
    background: ${WALL}; border-radius: 14px; padding: 7px; display: block;
  }
  .widget {
    border-radius: 12px; border: 1px solid rgba(15,30,45,.10);
    box-shadow: 0 5px 14px rgba(20,40,60,.13); overflow: hidden;
  }
  .whead { display: flex; align-items: center; padding: 5px 8px 1px 10px; }
  .wtitle { font-size: 8px; font-weight: 700; letter-spacing: .6px; flex: 1; }
  .wdots { font-size: 8px; letter-spacing: 1px; }
  .wbody { padding: 2px 10px 9px; }
  .wtext { font-size: 11.5px; font-weight: 600; margin: 0 0 1px; }
  .wsoft { font-size: 9.5px; margin: 0 0 7px; }
  .wrow { display: flex; gap: 5px; }
  .wbtn, .wghost {
    border: 0; font: inherit; font-size: 10px; font-weight: 600;
    padding: 4px 9px; border-radius: 7px; cursor: pointer;
  }
  figcaption { display: flex; flex-direction: column; margin-top: 4px; font-size: 10px; }
  figcaption strong { font-weight: 700; }
  .mono { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 8.5px; color: #6b7b8b; }

  .swgrid { display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); gap: 8px; }
  .sw {
    border: 0; background: none; padding: 0; cursor: pointer; font: inherit;
    display: flex; flex-direction: column; align-items: stretch; gap: 5px;
  }
  .sw-face {
    height: 42px; border-radius: 11px; display: flex; align-items: center;
    justify-content: center; gap: 6px; border: 1px solid rgba(15,30,45,.10);
    box-shadow: 0 2px 5px rgba(20,40,60,.10);
  }
  .sw-clear .sw-face { background-image: ${WALL} !important; }
  .sw-aa { font-size: 15px; font-weight: 700; letter-spacing: .3px; }
  .sw-pill { width: 20px; height: 10px; border-radius: 99px; display: block; }
  .sw-name { font-size: 10px; font-weight: 600; color: #46566a; text-align: center; }
  .sw:hover .sw-face { transform: scale(1.05); transition: transform .12s ease; }
  .note { font-size: 11px; color: #5b6b7b; max-width: 92ch; margin: 0 0 9px; }
</style>

<h1>Derived theme palette</h1>
<p class="lede">Every value below is solved from one rule and verified: text ≥ 4.5:1, button edge ≥ 3:1, accent ink perceptually separated from body ink. Zero measurements fall below the floor, including under simulated deuteranopia and protanopia.</p>

<h2>The new picker swatch</h2>
<p class="note">The theme's real ink as “Aa”, its real accent as a button pill, and a visible name. An honest preview of what the card will look like — and nothing like a bar-and-dot.</p>
<div class="swgrid">
${derived.map(swatch).join('\n')}
</div>

<h2>The twenty themes, as real cards</h2>
<p class="note">Each card shows body ink, secondary ink, a solid button with its label, and a ghost button — the four things a theme actually controls. The two transparent themes sit on a stand-in wallpaper to show the scrim doing its job.</p>
<div class="grid">
${derived.map(card).join('\n')}
</div>
`;

const out = process.argv[2] || 'theme-check.html';
fs.writeFileSync(out, html);
console.log('wrote ' + out + ' (' + derived.length + ' themes)');
