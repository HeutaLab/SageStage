/* Sage Stage — English widgets, Sentence & Text grains.
   Design: docs/genre-toolkit-design.md, implementing docs/english-widgets-design.md §8.4.
   Slice 1: genre toolkit — the success criteria that grow on the working wall
   across a unit, the model text they were found in, and the genre's word bank.
   Three faces, one pack. Registered into the app at boot via
   SageEnglishText.init(deps), the export.js dependency-injection pattern.

   §10 of the English set design puts the sentence builder in this file too. It
   shipped inside english-word.js and it stays there: moving it is an unrelated
   refactor with real regression risk on a widget reviewed two days ago, and no
   gain (genre-toolkit-design.md §12 records the drift on purpose). The Story Map
   is the next thing that belongs here. */
(function () {
  'use strict';

  let D = null; // injected by SageEnglishText.init from app.js

  // ---------------------------------------------------------------- the genre pack
  // Defaults ship in english-packs.js. The normaliser runs on our own file too,
  // so an imported school pack inherits identical hardening for free — the
  // phonics pack's pattern (english-word.js:16), and the same reasoning: this is
  // the class of input sanitizeTemplate exists for.
  const GT_BANDS = [['ks1', 'Reception – Year 2'], ['lks2', 'Years 3–4'], ['uks2', 'Years 5–6']];
  const GT_BAND_IDS = GT_BANDS.map((b) => b[0]);
  const GT_LANG = [['openers', 'Openers'], ['connectives', 'Connectives'], ['vocabulary', 'Vocabulary']];
  const GT_CAP = {
    name: 60, id: 60, items: 20, item: 200, struct: 12, box: 60, hint: 200,
    lang: 50, word: 60, text: 20000, file: 400000,
  };
  // Reception, 1, 2 → ks1 · 3, 4 → lks2 · 5, 6 → uks2. A deck with no year group
  // set returns null, which means "offer every band" rather than "offer none".
  const GT_YEAR_BAND = { R: 'ks1', 1: 'ks1', 2: 'ks1', 3: 'lks2', 4: 'lks2', 5: 'uks2', 6: 'uks2' };
  const gtBandFor = (yg) => GT_YEAR_BAND[String(yg == null ? '' : yg)] || null;

  // Picker identity: each default genre wears a solid Soft Daylight tint (t, the
  // GT_COLS register extended to twelve) with a deep same-hue ink (k) stroking a
  // little specimen of the text-form itself — an envelope, a comedy mask, a
  // quill. The hues are laid out so no two neighbours in the 4-across grid
  // share a family; newspaper is deliberately the one newsprint-grey card.
  // Colour is looked up by pack id and never stored: an imported or renamed
  // genre falls back to the neutral card, and position never carries meaning.
  const GT_LOOK = {
    'narrative': { t: '#ddd6fe', k: '#6d28d9' },
    'recount': { t: '#fde68a', k: '#b45309' },
    'diary': { t: '#fbcfe8', k: '#be185d' },
    'letter': { t: '#bae6fd', k: '#0369a1' },
    'instructions': { t: '#fed7aa', k: '#c2410c' },
    'explanation': { t: '#99f6e4', k: '#0f766e' },
    'non-chronological-report': { t: '#d9f99d', k: '#4d7c0f' },
    'persuasion': { t: '#fecaca', k: '#b91c1c' },
    'newspaper-report': { t: '#e2e8f0', k: '#475569' },
    'playscript': { t: '#f5d0fe', k: '#a21caf' },
    'poetry': { t: '#c7d2fe', k: '#4338ca' },
    'book-review': { t: '#a7f3d0', k: '#047857' },
  };
  // Drawn in the icons.js idiom: 24×24, stroke 1.7, round caps, honest geometry.
  const GT_ART = {
    'narrative': '<path d="M12 6.3C10.2 4.9 7.6 4.5 4.5 4.8v13.7c3.1-.3 5.7.1 7.5 1.5 1.8-1.4 4.4-1.8 7.5-1.5V4.8c-3.1-.3-5.7.1-7.5 1.5z"/><path d="M12 6.3v13.7"/>',
    'recount': '<circle cx="4.5" cy="19.5" r="1.3" fill="currentColor" stroke="none"/><path d="M4.5 19.5c7 0 3.5-7 9.5-7 4.5 0 3.5-5 5.5-6" stroke-dasharray="2.6 2.8"/><path d="M19.5 3.8v5.7"/><path d="M19.5 4l-3 .9 3 1.2"/>',
    'diary': '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M8.7 3.5v17"/><path d="M14 9.3c-.8-.9-2.3-.6-2.3.7 0 1 1.2 1.9 2.3 2.7 1.1-.8 2.3-1.7 2.3-2.7 0-1.3-1.5-1.6-2.3-.7z"/>',
    'letter': '<rect x="3.5" y="6" width="17" height="12" rx="1.8"/><path d="M4.8 7.5L12 12.8l7.2-5.3"/>',
    'instructions': '<circle cx="5.2" cy="6" r="1.7"/><circle cx="5.2" cy="12" r="1.7"/><path d="M9.5 6h10M9.5 12h10M9.5 18h6.5"/><path d="M3.7 18.1l1 1.1 1.9-2.2"/>',
    'explanation': '<path d="M6.3 9.2a6.6 6.6 0 0 1 11.2-2.3"/><path d="M17.8 3.4v3.6h-3.6"/><path d="M17.7 14.8a6.6 6.6 0 0 1-11.2 2.3"/><path d="M6.2 20.6v-3.6h3.6"/>',
    'non-chronological-report': '<circle cx="10.2" cy="9.8" r="5.8"/><path d="M14.5 14.1l5 5"/><path d="M7.8 8.4h4.8M7.8 11.2h3.4"/>',
    'persuasion': '<path d="M14.5 5v13l-7-3.4H5a1.6 1.6 0 0 1-1.6-1.6v-3A1.6 1.6 0 0 1 5 8.4h2.5L14.5 5z"/><path d="M17.6 9.3a4 4 0 0 1 0 5.4"/><path d="M19.9 7.4a7 7 0 0 1 0 9.2"/>',
    'newspaper-report': '<rect x="3.5" y="4.5" width="17" height="15" rx="1.6"/><path d="M6.3 8h11.4"/><path d="M6.3 11.2h5.2M6.3 13.8h5.2M6.3 16.4h5.2"/><rect x="13.7" y="10.9" width="3.9" height="5.6"/>',
    'playscript': '<path d="M5.5 4.6c4.2 1.4 8.8 1.4 13 0v7.2a6.5 6.5 0 0 1-13 0z"/><path d="M8.8 9.4c.6-.7 1.7-.7 2.3 0M12.9 9.4c.6-.7 1.7-.7 2.3 0"/><path d="M9 13c1.7 1.5 4.3 1.5 6 0"/>',
    'poetry': '<path d="M19 4.6C13.6 4.6 8.4 8.6 6.9 14.6L5.8 19.4"/><path d="M19 4.6c.9 5.6-2.8 10.4-8.7 11.2"/><path d="M9.3 11.9h4.4M7.9 15h3.5"/>',
    'book-review': '<rect x="4.5" y="5.5" width="12.5" height="15" rx="1.8"/><path d="M7.5 5.5v15"/><path d="M17.8 2.6l.8 1.7 1.9.3-1.4 1.3.3 1.9-1.6-.9-1.7.9.3-1.9-1.3-1.3 1.9-.3z" fill="currentColor" stroke="none"/>',
  };
  const GT_ART_FALLBACK = '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4.5"/>';
  const gtLook = (id) => GT_LOOK[id] || { t: 'rgba(255,255,255,.6)', k: '#64748b' };
  function gtArtEl(id) {
    // D.el, not a bare el — top-level helpers sit outside register()'s
    // destructure, the mount guard would swallow the ReferenceError silently
    const s = D.el('span', { class: 'gt-pick-art', 'aria-hidden': 'true' });
    s.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" '
      + 'stroke-linecap="round" stroke-linejoin="round">' + (GT_ART[id] || GT_ART_FALLBACK) + '</svg>';
    return s;
  }
  const gtBandName = (id) => (GT_BANDS.find((b) => b[0] === id) || [null, ''])[1];

  // Eight fills, drawn from the accents already in use across the set: each
  // legible with dark slate on top, each printing without turning to mud. Colour
  // is NEVER stored on an item — it is the item's index into this list, so an
  // edited or reordered list can't orphan a mark to a dead colour. Past eight the
  // list cycles; identity lives in marks[].item, and tapping a highlight names
  // its criterion, so a repeated colour is a cosmetic collision, never a data one.
  //
  // Stepped up one register 2026-07-29 (Glenn: "the colours of the pills need to
  // be slightly more prominent — it's dim on the board even on dynamic
  // setting"). These were the palest usable tints, which is exactly the trap the
  // word bank already recorded: an interactive whiteboard is badly
  // colour-calibrated and a tasteful tint disappears on a projector. One step
  // is the whole change: 20% denser on average, and measured against the slate
  // the chips and rows are set in the worst of the eight is still 7.9:1 — above
  // AAA — so nothing on the board or the poster loses legibility, and the hues
  // stay as widely separated as before because every one moved together.
  const GT_COLS = ['#fcd34d', '#6ee7b7', '#93c5fd', '#f9a8d4',
    '#c4b5fd', '#fdba74', '#bef264', '#7dd3fc'];

  // C0 controls other than tab/newline/return are illegal in XML 1.0, so a pack
  // carrying one produces a poster SVG the print dialog cannot parse — the
  // criteria sheet simply vanishes. Stripped at the door, before anything else
  // sees the string.
  const GT_BAD_CH = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uFFFE\uFFFF]/g;
  const gtStr = (v, cap) => String(v == null ? '' : v)
    .replace(GT_BAD_CH, '').replace(/\s+/g, ' ').trim().slice(0, cap);
  const gtSlug = (s) => gtStr(s, GT_CAP.id).toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, GT_CAP.id) || 'genre';

  // Model text keeps its line breaks — paragraphing is part of what a class reads
  // off a WAGOLL — so it gets its own cleaner rather than gtStr's whitespace
  // collapse. Over the cap it stops at the last sentence end rather than
  // mid-clause, and says so, rather than losing the tail silently.
  function gtCleanText(v) {
    let s = typeof v === 'string' ? v : '';
    // trimmed on BOTH branches (the clipped one always was): an untrimmed
    // whitespace-only string is truthy but tokenises to nothing, which put the
    // widget on the "a model text is in" path showing an empty board instead of
    // the paste target, and made the print page count a sheet nothing built.
    // Only the ends go — a poem's interior line breaks are its form.
    s = s.replace(/\r\n?/g, '\n').replace(/[\t\v\f ]/g, ' ').replace(GT_BAD_CH, '').trim();
    if (s.length <= GT_CAP.text) return { text: s, clipped: false };
    const cut = s.slice(0, GT_CAP.text);
    const stop = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('!'), cut.lastIndexOf('?'));
    return { text: (stop > GT_CAP.text / 2 ? cut.slice(0, stop + 1) : cut).trim(), clipped: true };
  }

  // Returns { genre, clamped } — clamped names what the caps threw away, so an
  // import can say what happened instead of silently loading two thirds of a file.
  //
  // keepIds matters. Coming from a FILE or one of our defaults, every item gets a
  // fresh id (false). Coming from a widget's own saved props (true), each item
  // keeps the id it had, because that id is what its reveals, ticks and marks
  // reference. Re-minting there — or restoring ids by position afterwards, which
  // is what the first cut of this did — silently re-points a highlight at a
  // different criterion the moment the normaliser drops one empty line.
  function gtNormalize(raw, keepIds) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { genre: null, clamped: [] };
    const clamped = [];
    const name = gtStr(raw.name, GT_CAP.name) || 'Genre';

    // items are objects with a band here; §9 of the set design wrote them as bare
    // strings under `toolkit`, so both shapes load and a bare string lands in the
    // middle band rather than being guessed at
    const src = Array.isArray(raw.items) ? raw.items
      : Array.isArray(raw.toolkit) ? raw.toolkit : [];
    const items = [];
    const seenIds = new Set();
    for (const it of src) {
      if (items.length >= GT_CAP.items) { clamped.push('criteria past ' + GT_CAP.items); break; }
      const t = gtStr(typeof it === 'string' ? it : (it && it.t), GT_CAP.item);
      if (!t) continue;
      const band = it && GT_BAND_IDS.includes(it.band) ? it.band : 'lks2';
      let id = keepIds && it && typeof it.id === 'string' && it.id && it.id.length <= 40
        ? it.id : D.uid();
      if (seenIds.has(id)) id = D.uid();
      seenIds.add(id);
      items.push({ id, t, band });
    }

    const structure = [];
    for (const row of Array.isArray(raw.structure) ? raw.structure : []) {
      if (structure.length >= GT_CAP.struct) { clamped.push('structure rows past ' + GT_CAP.struct); break; }
      const box = gtStr(row && row.box, GT_CAP.box);
      if (!box) continue;
      structure.push({ box, hint: gtStr(row && row.hint, GT_CAP.hint) });
    }

    // `language: "nonsense"` and `language: []` both land here as three empty
    // lists rather than a throw — which also hides the word bank face (§8.5)
    const lang = raw.language && typeof raw.language === 'object' && !Array.isArray(raw.language)
      ? raw.language : {};
    const language = {};
    for (const [key, label] of GT_LANG) {
      const out = [];
      for (const wd of Array.isArray(lang[key]) ? lang[key] : []) {
        if (out.length >= GT_CAP.lang) { clamped.push(label.toLowerCase() + ' past ' + GT_CAP.lang); break; }
        const s = gtStr(wd, GT_CAP.word);
        if (s) out.push(s);
      }
      language[key] = out;
    }

    const model = gtCleanText(raw.model);
    if (model.clipped) clamped.push('model text shortened');
    const id = gtStr(raw.id, GT_CAP.id).toLowerCase().replace(/[^a-z0-9-]/g, '') || gtSlug(name);
    return { genre: { id, name, items, structure, language, model: model.text }, clamped };
  }

  let gtDefaultCache = null;
  function gtDefaults() {
    if (!gtDefaultCache) {
      const packs = Array.isArray(window.SAGE_ENGLISH_PACKS) ? window.SAGE_ENGLISH_PACKS : [];
      gtDefaultCache = packs.filter((b) => b && b.kind === 'genre')
        .map((b) => gtNormalize(b, false).genre).filter(Boolean);
    }
    // fresh ids on every read: two toolkit widgets on one genre are two
    // independent lesson artefacts, and sharing item ids between them would let a
    // reveal in one look like a reveal in the other after a reload
    return gtDefaultCache.map(gtCopy);
  }
  const gtCopy = (g) => ({
    id: g.id,
    name: g.name,
    items: g.items.map((it) => ({ id: D.uid(), t: it.t, band: it.band })),
    structure: g.structure.map((r) => ({ box: r.box, hint: r.hint })),
    language: GT_LANG.reduce((o, [k]) => { o[k] = (g.language[k] || []).slice(); return o; }, {}),
    model: g.model,
  });
  const gtBlank = () => ({
    id: 'genre', name: 'Genre', items: [], structure: [],
    language: GT_LANG.reduce((o, [k]) => { o[k] = []; return o; }, {}), model: '',
  });
  const gtHasBank = (g) => !!g && GT_LANG.some(([k]) => (g.language[k] || []).length);
  // Always mutate the existing genre object rather than swapping in a new one, so
  // an open settings panel's reference stays live. Every key of the shape is
  // assigned, so nothing of the old genre survives — this is a replacement that
  // happens to preserve identity, not a merge.
  function gtSetGenre(p, next) {
    if (p.genre && typeof p.genre === 'object') Object.assign(p.genre, next);
    else p.genre = next;
    return p.genre;
  }
  const gtPackOf = (g) => ({
    format: 'sage-pack@1', kind: 'genre', id: g.id, name: g.name,
    items: g.items.map((it) => ({ t: it.t, band: it.band })),
    structure: g.structure.map((r) => ({ box: r.box, hint: r.hint })),
    language: GT_LANG.reduce((o, [k]) => { o[k] = (g.language[k] || []).slice(); return o; }, {}),
    model: g.model || '',
  });

  // ---------------------------------------------------------------- tokens
  // The model text tokenises ONCE and is immutable after, so a token index can
  // never drift under a mark. Whitespace is not a token: it rides on the
  // following token as `pre`, which is what lets a painted phrase bridge its own
  // gaps and still reproduce the text exactly.
  const GT_WORD_RE = /[\p{L}\p{N}]/u;
  const gtWordCh = (c) => GT_WORD_RE.test(c);

  // Every leading and every trailing punctuation character peels off as its own
  // token, working inwards, and the core splits before each apostrophe. So
  // `"Help!"` is four tokens and `fox's` is two — which is what makes "comma
  // after the fronted adverbial" and "apostrophe for possession" things a teacher
  // can actually point at. Hyphens stay inside: `well-known` is one adjective and
  // highlighting half of it means nothing.
  function gtSplitChunk(chunk) {
    const parts = [];
    let s = chunk;
    const lead = [], tail = [];
    while (s && !gtWordCh(s[0])) { lead.push(s[0]); s = s.slice(1); }
    while (s && !gtWordCh(s[s.length - 1])) { tail.unshift(s[s.length - 1]); s = s.slice(0, -1); }
    for (const c of lead) parts.push({ s: c, w: false });
    if (s) for (const part of s.split(/(?=['’])/)) if (part) parts.push({ s: part, w: true });
    for (const c of tail) parts.push({ s: c, w: false });
    return parts;
  }

  function gtTokens(text) {
    const src = String(text == null ? '' : text);
    const out = [];
    let i = 0;
    while (i < src.length) {
      let ws = '';
      while (i < src.length && /\s/.test(src[i])) { ws += src[i]; i++; }
      let chunk = '';
      while (i < src.length && !/\s/.test(src[i])) { chunk += src[i]; i++; }
      if (!chunk) break; // trailing whitespace: invisible, nothing to carry it
      gtSplitChunk(chunk).forEach((pt, k) => out.push({ s: pt.s, w: pt.w, pre: k === 0 ? ws : '' }));
    }
    return out;
  }

  // ---------------------------------------------------------------- marks
  // { a, b, item } — an inclusive token range. The list is kept sorted,
  // non-overlapping, and with same-item neighbours merged, so "adjacent marks of
  // one item merge into one range" is an invariant of the store rather than
  // something every caller has to remember. Each mutation returns a fresh list.
  function gtNormMarks(marks, n) {
    const rows = (Array.isArray(marks) ? marks : [])
      .map((m) => (m && typeof m === 'object'
        ? { a: m.a | 0, b: m.b | 0, item: typeof m.item === 'string' ? m.item : '' } : null))
      .filter((m) => m && m.item && m.a >= 0 && m.b >= m.a && m.b < n)
      .sort((x, y) => x.a - y.a || x.b - y.b);
    const out = [];
    for (const m of rows) {
      const last = out[out.length - 1];
      if (last && last.item === m.item && m.a <= last.b + 1) {
        last.b = Math.max(last.b, m.b);
        continue;
      }
      // a hand-edited store can hand us overlapping marks of DIFFERENT items;
      // clip rather than trust, so the non-overlap invariant holds even then
      if (last && m.a <= last.b) m.a = last.b + 1;
      if (m.b >= m.a) out.push(m);
    }
    return out;
  }

  function gtErase(marks, a, b, n) {
    const lo = Math.max(0, Math.min(a, b));
    const hi = Math.min(n - 1, Math.max(a, b));
    if (hi < lo) return marks;
    const out = [];
    for (const m of marks) {
      if (m.b < lo || m.a > hi) { out.push(m); continue; }
      if (m.a < lo) out.push({ a: m.a, b: lo - 1, item: m.item });
      if (m.b > hi) out.push({ a: hi + 1, b: m.b, item: m.item });
    }
    return gtNormMarks(out, n);
  }

  function gtPaint(marks, a, b, item, n) {
    const lo = Math.max(0, Math.min(a, b));
    const hi = Math.min(n - 1, Math.max(a, b));
    if (hi < lo || !item) return marks;
    return gtNormMarks([...gtErase(marks, lo, hi, n), { a: lo, b: hi, item }], n);
  }

  const gtMarkAt = (marks, i) => (marks || []).find((m) => i >= m.a && i <= m.b) || null;

  // ---------------------------------------------------------------- print
  // §11: toPrintablePages, because there is more than one sheet and the app's
  // dialog already lets the teacher tick which are worth the paper. Pure vector,
  // attribute styling, no ids, no external references; every string XML-escaped
  // (criteria and word bank entries carry apostrophes as a matter of course).
  // One known deviation from the poster checklist, the same one the sound mat
  // logs: text rides the system font stack until chrome-font embedding lands.
  const XML_ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
  const xmlEsc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => XML_ESC[c]);
  const GT_FONT = 'system-ui, sans-serif';
  const GT_W = 1000, GT_PAD = 56;
  // leading/trailing spaces become non-breaking ones, so they measure and render
  // instead of being collapsed away (see gtSnippetGroups for the measurements)
  const gtHardSpaces = (s) => String(s)
    .replace(/^ +/, (m) => '\u00a0'.repeat(m.length))
    .replace(/ +$/, (m) => '\u00a0'.repeat(m.length));

  // Exact text widths, measured in the document the poster is built in. The
  // alternative is a characters-times-em guess, and a guess is precisely what
  // puts a highlight one word to the left of the word it highlights. Falls back
  // to the guess if measurement comes back empty, so a poster is always produced.
  let gtMeasHost = null, gtMeasText = null;
  function gtWidth(str, size, weight) {
    const s = String(str == null ? '' : str);
    if (!s) return 0;
    try {
      if (!gtMeasHost) {
        const NS = 'http://www.w3.org/2000/svg';
        gtMeasHost = document.createElementNS(NS, 'svg');
        gtMeasHost.setAttribute('width', '10');
        gtMeasHost.setAttribute('height', '10');
        gtMeasHost.setAttribute('style', 'position:absolute;left:-10000px;top:0;overflow:hidden;');
        gtMeasText = document.createElementNS(NS, 'text');
        gtMeasHost.append(gtMeasText);
        document.body.append(gtMeasHost);
      }
      gtMeasText.setAttribute('font-family', GT_FONT);
      gtMeasText.setAttribute('font-size', String(size));
      gtMeasText.setAttribute('font-weight', String(weight || 400));
      // preserve, because the snippet runs carry their own boundary spaces and a
      // measurement that silently drops a trailing space renders "a" and "fox" as
      // "afox" — SVG strips boundary whitespace at BOTH ends of the pipeline
      gtMeasText.setAttribute('xml:space', 'preserve');
      gtMeasText.textContent = s;
      const n = gtMeasText.getComputedTextLength();
      if (n > 0) return n;
    } catch (err) { /* fall through to the estimate */ }
    return s.length * size * 0.54;
  }

  // Greedy word wrap against measured widths. A single word wider than the box is
  // left long rather than broken: a poster with a hyphenated criterion reads
  // worse than one with a slightly wide line.
  function gtWrap(text, width, size, weight) {
    const words = String(text == null ? '' : text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const wd of words) {
      const next = line ? line + ' ' + wd : wd;
      if (line && gtWidth(next, size, weight) > width) { lines.push(line); line = wd; }
      else line = next;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  const gtColOf = (g, id) => {
    const i = ((g && g.items) || []).findIndex((it) => it.id === id);
    return i < 0 ? GT_COLS[0] : GT_COLS[i % GT_COLS.length];
  };

  // §11's snippet: the sentence a mark sits in, clipped to fit the sheet.
  //
  // Grouped BY SENTENCE, not by mark. Three highlights in one sentence print as
  // one line with three painted runs, not as three near-identical copies of the
  // same sentence — which is what one-snippet-per-mark produced, and it read as
  // noise on the wall.
  //
  // Clipping is by measured width rather than a character count, because a
  // character count cannot know how wide the sheet is: 160 characters at 22px is
  // nearly twice the column, so it silently wrapped or ran off the page.
  function gtSnippetGroups(toks, marks, avail, size) {
    const isStop = (t) => !t.w && /[.!?]/.test(t.s);
    const sentenceOf = (m) => {
      let a = m.a, b = m.b;
      while (a > 0 && !isStop(toks[a - 1])) a--;
      while (b < toks.length - 1 && !isStop(toks[b])) b++;
      return a + ':' + b;
    };
    const groups = new Map();
    for (const m of marks) {
      const key = sentenceOf(m);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(m);
    }

    const out = [];
    for (const [key, ms] of groups) {
      const bounds = key.split(':').map(Number);
      let from = bounds[0], to = bounds[1];
      const lo = Math.min(...ms.map((x) => x.a));
      const hi = Math.max(...ms.map((x) => x.b));
      const on = (i) => ms.some((x) => i >= x.a && i <= x.b);
      // the gap between two tokens is painted only when BOTH sides are painted,
      // so a run reads continuous and a boundary stays plain
      const build = () => {
        const units = [];
        for (let i = from; i <= to; i++) {
          const pre = i > from ? toks[i].pre.replace(/\s+/g, ' ') : '';
          if (pre) units.push({ s: pre, on: on(i - 1) && on(i) });
          units.push({ s: toks[i].s, on: on(i) });
        }
        const segs = [];
        for (const u of units) {
          const last = segs[segs.length - 1];
          if (last && last.on === u.on) last.s += u.s;
          else segs.push({ s: u.s, on: u.on });
        }
        return segs;
      };
      const widthOf = (segs) => segs.reduce((n, s) => n + gtWidth(s.s, size, s.on ? 500 : 400), 0);

      let segs = build(), cutL = false, cutR = false;
      // trim the unmarked context first, from whichever side has more of it
      while (widthOf(segs) > avail && (from < lo || to > hi)) {
        if (from < lo && (lo - from) >= (to - hi)) { from++; cutL = true; }
        else if (to > hi) { to--; cutR = true; }
        else { from++; cutL = true; }
        segs = build();
      }
      // last resort: a teacher who highlighted forty words gets it truncated
      // rather than running off the sheet
      while (widthOf(segs) > avail && to > from) { to--; cutR = true; segs = build(); }
      if (cutL) segs.unshift({ s: '… ', on: false });
      if (cutR) segs.push({ s: ' …', on: false });
      // A run's leading or trailing space IS the gap between it and its
      // neighbour, and the poster positions each run by its measured width — so a
      // boundary space that measures zero puts the next run flush against this
      // one and prints "a fox" as "afox".
      //
      // xml:space="preserve" does NOT fix it. Measured in Chrome: the attribute
      // works on a PARSED node (199.47 vs 194.41) but is ignored on one built
      // with setAttribute + textContent, which is what the measuring host is —
      // so render and measurement disagree by a space every time. A non-breaking
      // space is not XML whitespace at all, so it survives collapsing in both
      // paths with no attribute involved.
      for (const seg of segs) seg.s = gtHardSpaces(seg.s);
      out.push({ segs });
    }
    return out;
  }

  function gtSvg(inner, h) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + GT_W + ' ' + h + '" width="'
      + GT_W + '" height="' + h + '"><rect x="0" y="0" width="' + GT_W + '" height="' + h
      + '" fill="#ffffff"/>' + inner + '</svg>';
  }
  function gtHead(parts, title, y0) {
    let y = y0 + 46;
    // a teacher-named genre can be 60 characters, and "Long Victorian Diary Entry
    // — word bank" at 46px overruns the sheet, so the title shrinks to fit rather
    // than walking off the edge
    let size = 46;
    const room = GT_W - GT_PAD * 2;
    while (size > 26 && gtWidth(title, size, 700) > room) size -= 2;
    parts.push('<text x="' + GT_PAD + '" y="' + y + '" font-family="' + GT_FONT
      + '" font-size="' + size + '" font-weight="700" fill="#0f172a">' + xmlEsc(title) + '</text>');
    y += 16;
    parts.push('<path d="M' + GT_PAD + ' ' + y + 'H' + (GT_W - GT_PAD)
      + '" stroke="#94a3b8" stroke-width="2" fill="none"/>');
    return y;
  }

  function gtPosterSvg(p) {
    const g = p.genre;
    if (!g) return null;
    // REVEAL order, not pack order — the poster has to match the board a class has
    // been reading for three weeks, and p.revealed is the order they met them in
    const byId = (id) => (g.items || []).find((it) => it.id === id);
    const shown = (p.revealed || []).map(byId).filter(Boolean);
    if (!shown.length) return null;
    const toks = gtTokens(p.text || '');
    const marks = gtNormMarks(p.marks, toks.length);
    const parts = [];
    let y = gtHead(parts, g.name, GT_PAD) + 14;

    const swW = 30, boxW = 32, gap = 16;
    const textX = GT_PAD + swW + gap;
    const textW = GT_W - GT_PAD - boxW - gap - textX;
    for (const it of shown) {
      const col = gtColOf(g, it.id);
      const mine = marks.filter((m) => m.item === it.id);
      const lines = gtWrap(it.t, textW, 28, 500);
      y += 8;
      lines.forEach((ln, k) => {
        parts.push('<text x="' + textX + '" y="' + (y + 22 + k * 36) + '" font-family="' + GT_FONT
          + '" font-size="28" font-weight="500" fill="#0f172a">' + xmlEsc(ln) + '</text>');
      });
      parts.push('<rect x="' + GT_PAD + '" y="' + (y + 2) + '" width="' + swW + '" height="' + swW
        + '" rx="6" fill="' + col + '" stroke="#64748b" stroke-width="1.5"/>');
      // the tick box prints as it sits on screen — the screen is already the control
      const bx = GT_W - GT_PAD - boxW;
      parts.push('<rect x="' + bx + '" y="' + (y + 1) + '" width="' + boxW + '" height="' + boxW
        + '" rx="6" fill="#ffffff" stroke="#64748b" stroke-width="2"/>');
      // hand ticks only, the same rule the checklist face now follows: the
      // poster is the thing that goes on the wall, so a box ticked here is the
      // class saying they can do it, never the widget saying it found evidence
      if ((p.ticked || []).includes(it.id)) {
        parts.push('<path d="M' + (bx + 7) + ' ' + (y + 17) + 'l7 7 11-13" stroke="#0f172a"'
          + ' stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>');
      }
      y += lines.length * 36 + 6;

      // the evidence, directly under its criterion — the whole argument for the widget
      const inX = textX + 12;
      const snipAvail = GT_W - GT_PAD - inX;
      for (const grp of gtSnippetGroups(toks, mine, snipAvail, 22)) {
        let x = inX;
        for (const seg of grp.segs) {
          const wSeg = gtWidth(seg.s, 22, seg.on ? 500 : 400);
          if (seg.on) {
            parts.push('<rect x="' + (x - 3) + '" y="' + (y + 2) + '" width="' + (wSeg + 6)
              + '" height="28" rx="5" fill="' + col + '"/>');
          }
          // the gaps between runs are non-breaking spaces (gtHardSpaces); the
          // attribute is belt-and-braces for the parsed document, not the fix
          parts.push('<text x="' + x + '" y="' + (y + 22) + '" xml:space="preserve" font-family="'
            + GT_FONT + '" font-size="22"' + (seg.on ? ' font-weight="500" fill="#0f172a"' : ' fill="#475569"')
            + '>' + xmlEsc(seg.s) + '</text>');
          x += wSeg;
        }
        y += 34;
      }
      y += 6;
      parts.push('<path d="M' + GT_PAD + ' ' + y + 'H' + (GT_W - GT_PAD)
        + '" stroke="#e2e8f0" stroke-width="1.5" fill="none"/>');
    }
    return gtSvg(parts.join(''), Math.max(y + GT_PAD, 300));
  }

  // §11 addendum (Glenn, 2026-07-28): the marked-up WAGOLL itself prints. The
  // class spent a session finding the evidence; the sheet is that work — the
  // text with its highlights, and a colour key of the criteria they point at,
  // so the artefact stands alone on the wall. Source line breaks are hard
  // breaks (a poem's line breaks ARE the form); everything else wraps against
  // measured widths, and a break only ever happens where the source had a
  // space, so punctuation stays glued to its word.
  function gtTextSvg(p) {
    const g = p.genre;
    if (!g || !p.text) return null;
    const toks = gtTokens(p.text);
    if (!toks.length) return null;
    const marks = gtNormMarks(p.marks, toks.length);
    const size = 30, lh = 44;
    const avail = GT_W - GT_PAD * 2;

    // lines of segments { s, item } — item is a mark's criterion id or null.
    // A gap between two tokens is painted only when one mark covers both sides
    // (object identity: marks are ranges, so the same mark means the same run).
    const lines = [];
    let segs = [], x = 0;
    const put = (s, item) => {
      if (!s) return;
      const last = segs[segs.length - 1];
      if (last && last.item === item) last.s += s;
      else segs.push({ s, item });
      x += gtWidth(s, size, item ? 500 : 400);
    };
    const flush = () => { lines.push(segs); segs = []; x = 0; };
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      const nl = ((t.pre || '').match(/\n/g) || []).length;
      if (nl && (segs.length || lines.length)) {
        flush();
        if (nl > 1) lines.push(null); // stanza / paragraph gap, one spacer
      }
      const m = gtMarkAt(marks, i);
      const item = m ? m.item : null;
      const gap = nl ? '' : (t.pre || '').replace(/\s+/g, ' ');
      const gapItem = gap && i > 0 && m && gtMarkAt(marks, i - 1) === m ? item : null;
      if (segs.length && gap && x + gtWidth(gap + t.s, size, 400) > avail) {
        flush();
        put(t.s, item);
      } else {
        put(gap, gapItem);
        put(t.s, item);
      }
    }
    flush();

    const parts = [];
    let y = gtHead(parts, g.name + ' — model text', GT_PAD) + 26;
    for (const ln of lines) {
      if (!ln || !ln.length) { y += Math.round(lh * 0.55); continue; }
      let lx = GT_PAD;
      for (const seg of ln) {
        const s = gtHardSpaces(seg.s);
        const wSeg = gtWidth(s, size, seg.item ? 500 : 400);
        if (seg.item) {
          parts.push('<rect x="' + (lx - 3) + '" y="' + (y + 3) + '" width="' + (wSeg + 6)
            + '" height="38" rx="6" fill="' + gtColOf(g, seg.item) + '"/>');
        }
        parts.push('<text x="' + lx + '" y="' + (y + size) + '" xml:space="preserve" font-family="'
          + GT_FONT + '" font-size="' + size + '"' + (seg.item ? ' font-weight="500"' : '')
          + ' fill="#0f172a">' + xmlEsc(s) + '</text>');
        lx += wSeg;
      }
      y += lh;
    }

    // the colour key: every criterion the class actually evidenced, reveal
    // order first — the order they met them in, the poster's rule
    const marked = [];
    const seen = new Set();
    for (const id of p.revealed || []) {
      if (!seen.has(id) && marks.some((m) => m.item === id)) { seen.add(id); marked.push(id); }
    }
    for (const m of marks) {
      if (!seen.has(m.item)) { seen.add(m.item); marked.push(m.item); }
    }
    if (marked.length) {
      y += 16;
      parts.push('<path d="M' + GT_PAD + ' ' + y + 'H' + (GT_W - GT_PAD)
        + '" stroke="#94a3b8" stroke-width="2" fill="none"/>');
      y += 14;
      const sw = 26, tx = GT_PAD + sw + 14, tw = GT_W - GT_PAD - tx;
      for (const id of marked) {
        const it = (g.items || []).find((q) => q.id === id);
        if (!it) continue;
        const ls = gtWrap(it.t, tw, 24, 500);
        parts.push('<rect x="' + GT_PAD + '" y="' + (y + 6) + '" width="' + sw + '" height="' + sw
          + '" rx="6" fill="' + gtColOf(g, id) + '" stroke="#64748b" stroke-width="1.5"/>');
        ls.forEach((l, k) => {
          parts.push('<text x="' + tx + '" y="' + (y + 26 + k * 32) + '" font-family="' + GT_FONT
            + '" font-size="24" font-weight="500" fill="#0f172a">' + xmlEsc(l) + '</text>');
        });
        y += ls.length * 32 + 10;
      }
    }
    return gtSvg(parts.join(''), Math.max(y + GT_PAD, 300));
  }

  function gtBankSvg(p) {
    const g = p.genre;
    if (!gtHasBank(g)) return null;
    const parts = [];
    let y = gtHead(parts, g.name + ' — word bank', GT_PAD) + 26;
    const avail = GT_W - GT_PAD * 2;
    for (const [key, label] of GT_LANG) {
      const words = g.language[key] || [];
      if (!words.length) continue;
      y += 26;
      parts.push('<text x="' + GT_PAD + '" y="' + y + '" font-family="' + GT_FONT
        + '" font-size="26" font-weight="700" fill="#475569">' + xmlEsc(label) + '</text>');
      y += 16;
      let x = GT_PAD;
      for (const wd of words) {
        const cw = gtWidth(wd, 26, 500) + 32;
        if (x > GT_PAD && x + cw > GT_PAD + avail) { x = GT_PAD; y += 50; }
        parts.push('<rect x="' + x + '" y="' + y + '" width="' + cw + '" height="40" rx="8"'
          + ' fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>');
        parts.push('<text x="' + (x + cw / 2) + '" y="' + (y + 27) + '" text-anchor="middle"'
          + ' font-family="' + GT_FONT + '" font-size="26" font-weight="500" fill="#0f172a">'
          + xmlEsc(wd) + '</text>');
        x += cw + 10;
      }
      y += 62;
    }
    return gtSvg(parts.join(''), Math.max(y + GT_PAD, 300));
  }

  // Which sheets exist, and in what order — decided in ONE place, because
  // `toPrintablePages` and `printCurrent` both need the answer and they used to
  // work it out separately. printCurrent restated the presence tests as its own
  // arithmetic and got one of them looser than the builder's: it counted a Model
  // text sheet whenever `text` was truthy, while gtTextSvg also requires the
  // text to tokenise to something. A whitespace-only model text from a
  // hand-authored pack therefore shifted every later index by one, and on the
  // word bank face with a modelwrite sibling supplying Cold and Hot it
  // pre-ticked "Cold task" instead of the word bank — silently, because
  // print.js clamps the index into range.
  //
  // Each predicate below is the same condition its builder guards on. The
  // builders keep their own guards; this is the list, not a replacement for
  // them.
  const GT_PAGES = [
    ['poster', 'Success criteria', gtPosterSvg],
    ['text', 'Model text', gtTextSvg],
    ['bank', 'Word bank', gtBankSvg],
  ];
  function gtPageKinds(p) {
    const g = p && p.genre;
    if (!g) return [];
    const kinds = [];
    if ((p.revealed || []).some((id) => (g.items || []).some((it) => it.id === id))) kinds.push('poster');
    if (p.text && gtTokens(p.text).length) kinds.push('text');
    if (gtHasBank(g)) kinds.push('bank');
    return kinds;
  }
  const GT_FACE_PAGE = { list: 'poster', text: 'text', bank: 'bank' };

  // §11: the Cold and Hot pages join the list when a modelwrite widget on THIS
  // screen carries both bookends. A read plus a public method — modelwrite gains
  // no knowledge of this widget. The widget's own id finds its screen exactly;
  // deck.current can point elsewhere while a pinned screen is being viewed
  // (the sentence builder's note at english-word.js:3197).
  function gtColdHotPages(w) {
    const MW = D.WIDGETS && D.WIDGETS.modelwrite;
    if (!MW || typeof MW.toPrintablePages !== 'function') return [];
    const d = D.deck() || {};
    const screens = d.screens || [];
    const scr = screens.find((s) => (s.widgets || []).some((x) => x && x.id === w.id));
    if (!scr) return [];
    // this screen's widgets first, then any modelwrite pinned "show on all
    // screens" from elsewhere in the deck — a pinned widget lives on its home
    // screen but displays on every one (app.js:9327), so searching only this
    // screen misses the case where the unit is pinned and the toolkit is not
    const siblings = [...(scr.widgets || [])];
    for (const s of screens) {
      if (s === scr) continue;
      for (const x of s.widgets || []) if (x && x.everywhere) siblings.push(x);
    }
    for (const other of siblings) {
      if (!other || other.type !== 'modelwrite' || !other.props) continue;
      const pages = Array.isArray(other.props.pages) ? other.props.pages : [];
      const cold = pages.findIndex((q) => q && q.bookend === 'cold');
      const hot = pages.findIndex((q) => q && q.bookend === 'hot');
      if (cold < 0 || hot < 0) continue;
      let all = [];
      try { all = MW.toPrintablePages(other) || []; } catch (err) { continue; }
      const out = [];
      for (const [i, fallback] of [[cold, 'Cold task'], [hot, 'Hot task']]) {
        if (all[i] && all[i].svg) out.push({ svg: all[i].svg, label: all[i].label || fallback });
      }
      if (out.length === 2) return out;
    }
    return [];
  }

  // ---------------------------------------------------------------- pack files
  // Packs move as files the teacher owns, not over a distribution rail: a rail
  // only pays off when several teachers coordinate, and the unit of adoption here
  // is one teacher on one machine. Plain JSON, no zip — unlike the word bank
  // there are no pictures to carry, and a zip would be ceremony around one file.
  function gtSavePack(w) {
    const g = w.props.genre;
    if (!g) return;
    const blob = new Blob([JSON.stringify(gtPackOf(g), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = D.el('a', { href: url, download: gtSlug(g.name) + '.genre.json' });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function gtOpenPack(w, api) {
    const p = w.props;
    const fileIn = D.el('input', {
      type: 'file', style: 'display:none;', accept: '.json,.genre,application/json',
    });
    fileIn.addEventListener('change', () => {
      const f = (fileIn.files || [])[0];
      fileIn.value = '';
      if (!f) return;
      if (f.size > GT_CAP.file) { D.toast('That file is too big to be a genre pack'); return; }
      const fr = new FileReader();
      fr.onerror = () => D.toast('Could not read that file');
      fr.onload = () => {
        let raw = null;
        try { raw = JSON.parse(String(fr.result || '')); }
        catch (err) { D.toast('That is not a genre pack we can read'); return; }
        if (raw && raw.kind && raw.kind !== 'genre') {
          D.toast('That is a ' + gtStr(raw.kind, 20) + ' pack, not a genre one');
          return;
        }
        const res = gtNormalize(raw, false);
        if (!res.genre || !res.genre.items.length) { D.toast('No criteria in that pack'); return; }
        const apply = () => {
          if (typeof D.snapshotBefore === 'function') D.snapshotBefore(w, 'Genre toolkit');
          // supersede, never accumulate: the incoming lists replace what was here.
          // An incoming list is somebody's considered current version of it, and
          // half of an old one mixed in is the stale-word problem the rule exists
          // to prevent (Glenn, 2026-07-27).
          gtSetGenre(p, res.genre);
          p.src = null;
          p.revealed = []; p.ticked = []; p.marks = []; p.active = null;
          if (res.genre.model) p.text = res.genre.model;
          D.toast(res.clamped.length ? 'Loaded, trimmed: ' + res.clamped.join(', ')
            : 'Loaded ' + res.genre.name);
          api.refresh();
        };
        // a pack carrying its own model text overwrites the teacher's — so the
        // pasted WAGOLL counts as something to lose, not just reveals and marks
        const losesText = !!(res.genre.model && p.text);
        const losesWork = p.revealed.length || p.marks.length;
        if (p.genre && (losesWork || losesText)) {
          D.confirmDialog('Load “' + res.genre.name + '”? Its criteria and word bank replace what is '
            + 'here'
            + (losesWork ? ', and this unit’s reveals and highlights go with them' : '')
            + (losesText ? '. Its own model text replaces the one you pasted' : '') + '.',
          apply, { label: 'Load', danger: true });
        } else apply();
      };
      fr.readAsText(f);
    });
    fileIn.click();
  }

  // ---------------------------------------------------------------- widget
  function register() {
    const { WIDGETS, el, iconEl, uid, clamp, save, toast } = D;
    const settingRowOr = (label, control) => (D.settingRow ? D.settingRow(label, control)
      : el('div', { class: 'row' }, el('span', {}, label), control));

    /* ---------------------------------------------------------------- story map
       The shell. Registered first and deliberately empty, so the widget can be seen
       to arrive in the real app — in the menu, on a screen, through a save and a
       reload — before any of the interesting code exists to hide a wiring fault.
       Behaviour lands per docs/story-map-design.md; the mock at .sm-mock.html is the
       authority on what it should do. */
    WIDGETS.storymap = {
      title: 'Story map', icon: 'storymap', accent: '#c7d2fe', w: 1180, h: 660,
      defaults: () => ({ face: 'map', stage: 'model', lock: false, room: 'board' }),
      mount(body, w, api) {
        body.classList.add('mntray', 'smwidget');
        const p = w.props;
        const face = el('div', { class: 'sm-face' });
        face.append(el('div', { class: 'ct-hint' },
          'Story map — the shell is wired. Faces land next.'));
        const bar = el('div', { class: 'sm-quick' });
        const row = el('div', { class: 'row' });
        [['map', 'Text map'], ['box', 'Boxing up'], ['graph', 'Emotion graph']].forEach(([id, label]) => {
          const b = el('button', {
            class: 'tq-btn' + (p.face === id ? ' active' : ''),
            onclick: () => { p.face = id; save(); api.refresh(); },
          }, label);
          row.append(b);
        });
        bar.append(row);
        body.append(face, bar);
      },
    };

    WIDGETS.genretoolkit = {
      title: 'Genre toolkit', icon: 'genretoolkit', accent: '#c7d2fe', w: 780, h: 560,
      defaults: () => ({
        genre: null, src: null, face: 'text',
        revealed: [], ticked: [], text: '', marks: [], active: null,
        allBands: false, size: 1, coverList: false, coverBank: false,
      }),
      toPrintablePages(w) {
        const p = w.props;
        const pages = [];
        // built FROM gtPageKinds, so the list printCurrent indexes into and the
        // list the dialog shows are the same list, in the same order
        for (const kind of gtPageKinds(p)) {
          const row = GT_PAGES.find((r) => r[0] === kind);
          const svg = row && row[2](p);
          if (svg) pages.push({ svg, label: row[1] });
        }
        for (const pg of gtColdHotPages(w)) pages.push(pg);
        return pages;
      },
      // One page ticked — SagePrint's paper-waste principle (print.js:751) —
      // and it is the CURRENT face's sheet: the screen is already the control.
      // Same shape as modelwrite's (modelwrite.js:929): find the page in the
      // list, fall back to the first one. No arithmetic to drift.
      printCurrent(w) {
        const p = w.props || {};
        const i = gtPageKinds(p).indexOf(GT_FACE_PAGE[p.face] || 'poster');
        return i < 0 ? 0 : i;
      },

      mount(body, w, api) {
        body.classList.add('mntray', 'gtwidget');
        const p = w.props;

        // ---- mount-time coercion: props may be years old or hand-edited ----
        // Normalised IN PLACE, keeping the same genre object. The settings panel
        // holds a reference to it and app.js remounts the widget without
        // rebuilding the panel (app.js:9200 is save() + remount()), so replacing
        // the object here orphaned the open panel: its edits went to a dead object
        // and were silently lost, while it still pruned the LIVE reveals, ticks
        // and marks against the new ids — losing a criterion's highlights while
        // keeping its old wording. Identity is what keeps the two in step.
        if (p.genre && typeof p.genre === 'object') {
          Object.assign(p.genre, gtNormalize(p.genre, true).genre);
        } else p.genre = null;
        const g = p.genre;
        const ids = new Set(g ? g.items.map((it) => it.id) : []);
        p.revealed = [...new Set((Array.isArray(p.revealed) ? p.revealed : []).filter((id) => ids.has(id)))];
        p.ticked = [...new Set((Array.isArray(p.ticked) ? p.ticked : []).filter((id) => ids.has(id)))];
        p.text = gtCleanText(p.text).text;
        p.marks = gtNormMarks(
          (Array.isArray(p.marks) ? p.marks : []).filter((m) => m && ids.has(m.item)),
          gtTokens(p.text).length,
        );
        if (!ids.has(p.active)) p.active = null;
        if (typeof p.src !== 'string') p.src = null;
        p.allBands = !!p.allBands;
        // Cover is per-face. A widget saved before that split carries one boolean;
        // read it as the checklist's, which is the face it was almost certainly on.
        if (typeof p.cover === 'boolean') {
          if (p.cover && p.coverList === undefined) p.coverList = true;
          delete p.cover;
        }
        p.coverList = !!p.coverList;
        p.coverBank = !!p.coverBank;
        p.size = clamp(p.size | 0, 0, 2);
        // 'bank' on a genre with three empty lists falls back, because §8.5 hides
        // that face rather than showing a blank panel
        if (!['list', 'text', 'bank'].includes(p.face) || (p.face === 'bank' && !gtHasBank(g))) {
          p.face = 'text';
        }

        const toks = gtTokens(p.text);
        let tkEls = [];
        // held so the bar can update the chip strip and the text size in place
        // rather than rebuilding the token DOM and losing the scroll position
        let chipsEl = null, textEl = null;

        const face = el('div', { class: 'gt-face grow' });
        const quick = el('div', { class: 'tclock-quick gt-quick' });
        body.append(face, quick);

        // Re-render only what changed. On the model text face the token container
        // IS the scroller, so a reveal or an active-criterion change must leave it
        // alone — otherwise every tap in a WAGOLL session scrolls the class back to
        // line one. Switching face is the only thing that rebuilds (paintAll).
        const commit = () => {
          save();
          if (p.face === 'text' && p.text) { paintChips(); restyle(0, toks.length - 1); }
          else if (p.face === 'bank') paintBank();
          else if (p.face === 'list') paintList();
          else paintAll();
          paintQuick();
        };
        const items = () => (g ? g.items : []);
        const byId = (id) => items().find((it) => it.id === id) || null;
        const colOf = (id) => gtColOf(g, id);
        const revealedItems = () => p.revealed.map(byId).filter(Boolean);
        const deckBand = () => gtBandFor((D.deck() || {}).yearGroup);
        // Reveal walks the deck's band; the chevron list shows every item, so any
        // criterion can still be revealed out of band — Glenn's call: the widget
        // follows the year group, the teacher overrules it
        const queue = () => {
          const band = p.allBands ? null : deckBand();
          return items().filter((it) => !p.revealed.includes(it.id) && (!band || it.band === band));
        };
        const marksOf = (id) => p.marks.filter((m) => m.item === id);

        // ---------------------------------------------------------- genre picker
        function paintPick() {
          face.replaceChildren();
          const grid = el('div', { class: 'gt-pick' });
          for (const def of gtDefaults()) {
            const words = GT_LANG.reduce((n, [k]) => n + (def.language[k] || []).length, 0);
            const look = gtLook(def.id);
            grid.append(el('button', {
              class: 'gt-pick-card',
              style: '--gt-tint:' + look.t + ';--gt-ink:' + look.k,
              onclick: () => {
                p.genre = def;
                p.src = def.id;
                p.revealed = []; p.ticked = []; p.marks = []; p.active = null;
                if (def.model) p.text = def.model;
                api.refresh();
              },
            },
            gtArtEl(def.id),
            el('span', { class: 'gt-pick-name' }, def.name),
            el('span', { class: 'gt-pick-sub' }, def.items.length + ' criteria · ' + words + ' words')));
          }
          face.append(
            el('div', { class: 'gt-pick-lead' }, 'Which genre is this unit?'),
            grid,
            el('div', { class: 'row gt-pick-row' },
              el('button', {
                class: 'btn ghost small',
                onclick: () => { p.genre = gtBlank(); p.src = null; api.refresh(); },
              }, 'Start blank'),
              el('button', {
                class: 'btn ghost small',
                onclick: () => gtOpenPack(w, api),
              }, 'Load a genre pack…')),
            // says what a pack IS, because the alternative reading cost a
            // teacher an afternoon: "Open a pack file…" sat here looking like
            // the way to put a model text in, and it only ever took .genre
            // files. The model text goes in on the Model text face.
            el('div', { class: 'hint' }, 'A genre pack is a set of criteria and a word bank — '
              + 'a school’s own, saved from here. Your model text goes in on the Model text '
              + 'face once a genre is picked. Every criterion here is our wording or the '
              + 'National Curriculum’s — no scheme’s, and Settings lets you change all of it.'),
          );
        }

        // ---------------------------------------------------------- checklist face
        function paintList() {
          face.replaceChildren();
          // §6's first line: the genre names itself. These criteria are on the
          // board for three weeks — untitled, they are just a list of rules.
          face.append(el('div', { class: 'gt-title' }, g.name));
          const list = el('div', { class: 'gt-list' + (p.coverList ? ' gt-covered' : '') });
          const shown = revealedItems();
          if (!shown.length) {
            list.append(el('div', { class: 'gt-none' },
              items().length
                ? 'Nothing revealed yet — press Reveal when you have taught the first one.'
                : 'No criteria yet. Add some in Settings.'));
          }
          /* A TICK IS THE CLASS SAYING "WE CAN DO THIS NOW". Nothing else sets
             it (Glenn, 2026-07-29).

             It used to tick itself the moment a criterion had a highlight, and
             then refuse to come off while the highlight existed. That conflated
             two different claims into one box: "we found this in the WAGOLL" and
             "we can do this". The first happens in the first lesson of the unit,
             the second takes three weeks — so the poster that went up on day one
             went up with every box the class had just found already ticked, and
             the tick printed too (gtPosterSvg). The one place the widget made a
             claim in front of a class that wasn't true.

             The highlights have not gone anywhere; they are shown next to the
             box as a COUNT, which is what they always were — evidence that the
             feature is in the model text, sitting beside the separate question
             of whether the class can use it yet. From one upwards, because
             "found once" is exactly as much evidence as the old rule needed to
             tick the box outright.

             In-flight decks are not migrated on purpose. A toolkit mid-unit
             loses the ticks it never earned and keeps its counts, which is the
             correction arriving rather than a loss. Hand ticks were always
             stored separately in p.ticked and are untouched. */
          for (const it of shown) {
            const n = marksOf(it.id).length;
            const on = p.ticked.includes(it.id);
            list.append(el('div', {
              class: 'gt-row' + (p.active === it.id ? ' gt-on' : ''),
              onclick: () => { p.active = p.active === it.id ? null : it.id; commit(); },
            },
            el('span', { class: 'gt-sw', style: 'background:' + colOf(it.id) }),
            el('span', { class: 'gt-crit' }, it.t),
            n ? el('span', {
              class: 'gt-ev',
              title: n === 1 ? 'Found once in the model text' : 'Found ' + n + ' times in the model text',
            }, String(n)) : null,
            el('button', {
              class: 'gt-tick' + (on ? ' on' : ''),
              title: on ? 'The class can do this — tap to take it back'
                : 'Tick when the class can do this',
              onclick: (e) => {
                e.stopPropagation();
                const at = p.ticked.indexOf(it.id);
                if (at < 0) p.ticked.push(it.id); else p.ticked.splice(at, 1);
                commit();
              },
            }, on ? iconEl('tick') : null)));
          }
          face.append(list);
        }

        // ---------------------------------------------------------- model text face
        function tokenCol(i, lo, hi) {
          if (lo != null && i >= lo && i <= hi) return colOf(p.active);
          const m = gtMarkAt(p.marks, i);
          return m ? colOf(m.item) : null;
        }
        // does the paint covering i also cover i-1? decides whether the gap before
        // token i is painted, so a phrase reads as one continuous highlight rather
        // than as striped words
        function sameRun(i, lo, hi) {
          if (i <= 0) return false;
          if (lo != null && i > lo && i <= hi) return true;
          if (lo != null && (i === lo || i - 1 === hi)) return false;
          const a = gtMarkAt(p.marks, i - 1), b = gtMarkAt(p.marks, i);
          return !!a && a === b;
        }
        function styleToken(i, lo, hi) {
          const rec = tkEls[i];
          if (!rec) return;
          const col = tokenCol(i, lo, hi);
          rec.tk.style.background = col || '';
          rec.tk.classList.toggle('on', !!col);
          if (rec.gap) rec.gap.style.background = col && sameRun(i, lo, hi) ? col : '';
        }
        function restyle(from, to, lo, hi) {
          const a = Math.max(0, from);
          const b = Math.min(toks.length - 1, to + 1);
          for (let i = a; i <= b; i++) styleToken(i, lo, hi);
        }

        // The chip strip is filled separately from the token DOM, because changing
        // the active criterion must NOT rebuild the tokens: the token container is
        // the scroller, so rebuilding it sends a teacher who has scrolled to
        // paragraph three back to the first line. That happens on every chip tap,
        // every Reveal and every Hide last — the core loop of a WAGOLL session.
        /* Bring the armed chip into view after a reveal. The strip is capped at
           42% of the face and a new chip always lands last, so on a full unit
           the thing just armed is the one thing off the bottom.

           Scrolls the STRIP and nothing else — deliberately not
           scrollIntoView(), which walks up and scrolls every scrollable
           ancestor it finds, and the ancestors here are the widget and the
           stage. A board that jumps because a chip needed 20px is the
           spatial-stability rule broken for the sake of keeping it. */
        function showActiveChip() {
          if (p.face !== 'text' || !chipsEl) return;
          const chip = chipsEl.querySelector('.gt-chip.on');
          if (!chip) return;
          const box = chipsEl.getBoundingClientRect();
          const r = chip.getBoundingClientRect();
          if (r.top < box.top) chipsEl.scrollTop -= (box.top - r.top);
          else if (r.bottom > box.bottom) chipsEl.scrollTop += (r.bottom - box.bottom);
        }

        function paintChips() {
          if (!chipsEl) return;
          chipsEl.replaceChildren();
          const shown = revealedItems();
          if (!shown.length) {
            chipsEl.append(el('span', { class: 'gt-chips-none' },
              'Reveal a criterion to start marking the text with it'));
          }
          for (const it of shown) {
            chipsEl.append(el('button', {
              class: 'gt-chip' + (p.active === it.id ? ' on' : ''),
              style: 'background:' + colOf(it.id),
              onclick: () => {
                p.active = p.active === it.id ? null : it.id;
                save();
                paintChips();
                restyle(0, toks.length - 1);
              },
            }, it.t));
          }
        }

        function paintText() {
          face.replaceChildren();
          tkEls = [];
          chipsEl = null;
          if (!p.text) { paintPaste(); return; }

          const chips = el('div', { class: 'gt-chips' });
          chipsEl = chips;
          paintChips();

          const wrap = el('div', { class: 'gt-text gt-size' + p.size });
          textEl = wrap;
          for (let i = 0; i < toks.length; i++) {
            const t = toks[i];
            let gap = null;
            if (t.pre) {
              gap = el('span', { class: 'gt-gap' }, t.pre);
              wrap.append(gap);
            }
            const tk = el('span', { class: 'gt-tk' }, t.s);
            tk.dataset.i = String(i);
            wrap.append(tk);
            tkEls.push({ tk, gap });
          }
          wrap.addEventListener('pointerdown', onDown);
          // chips, then the board. "New text…" used to sit under the text on its
          // own row; it lives on the bar now, so this face is the criteria the
          // class is marking with and the words they are marking — nothing else.
          face.append(chips, wrap);
          restyle(0, toks.length - 1);
        }

        function paintPaste() {
          const ta = el('textarea', {
            class: 'names-area gt-paste', rows: '6',
            placeholder: 'Paste your model text here — the WAGOLL the class is going to pull apart.',
          });
          const take = () => {
            const res = gtCleanText(ta.value);
            if (!res.text.trim()) { toast('Nothing to read there'); return; }
            if (res.clipped) toast('That was very long — kept the first part of it');
            p.text = res.text;
            p.marks = [];
            api.refresh();
          };
          // SageDocText reads Word and PDF as well as plain text (doctext.js).
          // Almost no teacher has a .txt of their WAGOLL — it is a Word file,
          // or a PDF that came round in an email — and asking for a conversion
          // in the ninety seconds before a lesson is asking them not to bother
          // (Glenn, 2026-07-29). If the module is somehow absent the old
          // plain-text path still works, so this face never dies.
          const DT = window.SageDocText;
          const fileIn = el('input', {
            type: 'file', style: 'display:none;',
            accept: (DT && DT.EXT) || '.txt,.md,.text,text/plain,text/markdown',
          });
          const openBtn = el('button', {
            class: 'btn ghost small',
            onclick: () => { if (!openBtn.disabled) fileIn.click(); },
          }, DT ? 'Open a document…' : 'Open a text file…');
          fileIn.addEventListener('change', () => {
            const f = (fileIn.files || [])[0];
            fileIn.value = '';
            if (!f) return;
            if (!DT) {
              if (f.size > GT_CAP.text * 8) { toast('That file is too big to read here'); return; }
              const fr = new FileReader();
              fr.onerror = () => toast('Could not read that file');
              fr.onload = () => { ta.value = String(fr.result || '').slice(0, GT_CAP.text * 2); take(); };
              fr.readAsText(f);
              return;
            }
            // a forty-page PDF takes a moment, and a button that looks dead is
            // how a teacher ends up opening the file three times
            openBtn.disabled = true;
            openBtn.textContent = 'Reading…';
            const done = () => {
              openBtn.disabled = false;
              openBtn.textContent = 'Open a document…';
            };
            DT.read(f, { maxChars: GT_CAP.text * 2 }).then((res) => {
              done();
              ta.value = res.text;
              take();
              // said after the text is in, not instead of it: the note is
              // always about something dropped, never about a failure
              if (res.note) toast(res.note);
            }).catch((err) => {
              done();
              toast((err && err.message) || 'Could not read that file');
            });
          });
          face.append(el('div', { class: 'gt-empty' },
            ta,
            el('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap;' },
              el('button', { class: 'btn small', onclick: take }, 'Use this text'),
              openBtn,
              fileIn),
            el('div', { class: 'hint' }, DT
              ? 'Paste it, or open a Word document, a PDF or a text file — the words come '
                + 'across, nothing else. A page or two is plenty. Once it is in, tap a word to '
                + 'mark it with whichever criterion is chosen, or drag across a phrase. '
                + 'Punctuation taps on its own, so a comma or an apostrophe can be marked by itself.'
              : 'Plain text — a page or two is plenty. Once it is in, tap a '
                + 'word to mark it with whichever criterion is chosen, or drag across a phrase. '
                + 'Punctuation taps on its own, so a comma or an apostrophe can be marked by itself.')));
        }

        const idxAt = (ev) => {
          const node = document.elementFromPoint(ev.clientX, ev.clientY);
          const tk = node && node.closest ? node.closest('.gt-tk') : null;
          if (!tk || !face.contains(tk)) return -1;
          const i = Number(tk.dataset.i);
          return Number.isInteger(i) ? i : -1;
        };

        function onDown(ev) {
          const from = idxAt(ev);
          if (from < 0) return;
          // nothing active: a tap reads out what is already there, and an unmarked
          // token does nothing at all — reading the text aloud with a finger on the
          // board must never paint by accident
          if (!p.active) {
            const m = gtMarkAt(p.marks, from);
            const it = m && byId(m.item);
            if (it) toast(it.t);
            return;
          }
          ev.preventDefault();
          const existing = gtMarkAt(p.marks, from);
          const drag = { to: from, id: ev.pointerId, erase: !!existing && existing.item === p.active };
          if (!drag.erase) restyle(from, from, from, from);
          const move = (e2) => {
            if (e2.pointerId !== drag.id) return;
            const at = idxAt(e2);
            if (at < 0 || at === drag.to) return;
            const oldLo = Math.min(from, drag.to), oldHi = Math.max(from, drag.to);
            drag.to = at;
            // a drag paints, even one that began on this item's own ink: erasing is
            // a tap, and a drag that started as one becomes a re-paint
            drag.erase = false;
            const lo = Math.min(from, drag.to), hi = Math.max(from, drag.to);
            restyle(Math.min(oldLo, lo), Math.max(oldHi, hi), lo, hi);
          };
          const up = (e2) => {
            if (e2.pointerId !== drag.id) return;
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointercancel', up);
            // A CANCEL IS NOT A STROKE. The text is a real scroller with
            // touch-action: pan-y, so a finger swipe to scroll the WAGOLL hands the
            // gesture to the scroller and fires pointercancel — and committing on
            // that painted a highlight every single time a teacher scrolled, which
            // then auto-ticked the criterion and could not be un-ticked from the
            // checklist while the stray mark existed. preventDefault on pointerdown
            // does not help: touch scrolling is governed by touch-action.
            // english-word.js:2015 guards the same way.
            if (e2.type === 'pointercancel') { restyle(0, toks.length - 1); return; }
            const lo = Math.min(from, drag.to), hi = Math.max(from, drag.to);
            p.marks = drag.erase
              ? gtErase(p.marks, lo, hi, toks.length)
              : gtPaint(p.marks, lo, hi, p.active, toks.length);
            save();
            restyle(0, toks.length - 1);
            paintQuick(); // a first mark can tick a criterion, and the bar counts them
          };
          window.addEventListener('pointermove', move);
          window.addEventListener('pointerup', up);
          window.addEventListener('pointercancel', up);
        }

        // ---------------------------------------------------------- word bank face
        function paintBank() {
          face.replaceChildren();
          const box = el('div', { class: 'gt-bank' + (p.coverBank ? ' gt-covered' : '') });
          for (const [key, label] of GT_LANG) {
            const words = g.language[key] || [];
            if (!words.length) continue; // a group with no words is omitted, not shown empty
            const cards = el('div', { class: 'gt-words' });
            for (const wd of words) cards.append(el('span', { class: 'gt-word' }, wd));
            box.append(el('div', { class: 'gt-grp' }, el('div', { class: 'gt-glab' }, label), cards));
          }
          face.append(box);
        }

        // ---------------------------------------------------------- the bar
        /* TWO DELIBERATE ROWS, not one row that happens to wrap.
           Glenn, 2026-07-29: "once the text is uploaded, the button height and
           placement goes awry." Measured, it did: the bar was one centred
           flex-wrap row whose membership changes with the face and the state
           (Cover on two faces, Size and New text only once a text is in, undo
           only once something is revealed), so every change re-centred every
           row and orphaned whatever fell over the edge — "Size 2 · Print…"
           alone on a second line. This is the sentence builder's V0.1 lesson
           applied here: a wrapping toolbar is design by accident, and the fix
           is explicit rows with anchored ends (iteration log, 2026-07-25).

           Row 1  [ faces ]················[ tools ][ Print… ]
           Row 2  [ Reveal: the criterion ..........][ › ][ ↺ ]

           The faces are pinned left and Print is pinned right on row 1, so the
           two things a teacher reaches for without looking never move. Reveal
           owns row 2 outright, which is what lets it carry a criterion in full
           without shoving anything. */
        function paintQuick() {
          quick.replaceChildren();
          if (!g) return;

          // ---- row 1: where you are, and the tools for being there
          const rowNav = el('div', { class: 'gt-row gt-row-nav' });
          // Model text first: it is where the unit starts — the class pulls the
          // WAGOLL apart, and the criteria and words come out of it. It is also
          // where a document is opened, which is the thing that was impossible
          // to find (Glenn's order, 2026-07-29).
          const faces = [['text', 'Model text']];
          if (gtHasBank(g)) faces.push(['bank', 'Word bank']);
          faces.push(['list', 'Checklist']);
          const seg = el('div', { class: 'gt-seg' });
          for (const [id, label] of faces) {
            seg.append(el('button', {
              class: 'btn ghost small' + (p.face === id ? ' gt-active' : ''),
              // the one control that genuinely rebuilds: a different face
              onclick: () => { p.face = id; save(); paintAll(); },
            }, label));
          }
          rowNav.append(seg, el('span', { class: 'grow' }));

          const tools = el('div', { class: 'gt-tools' });
          const band = deckBand();
          if (band) {
            tools.append(el('button', {
              class: 'btn ghost small' + (p.allBands ? ' gt-active' : ''),
              title: p.allBands ? 'Reveal walks every year'
                : 'Reveal walks ' + gtBandName(band) + ' — this deck’s year group',
              onclick: () => { p.allBands = !p.allBands; commit(); },
            }, p.allBands ? 'All years' : gtBandName(band)));
          }

          // no Cover on the model text face: covering the WAGOLL is what the mask
          // boxes in the book page widget are for.
          // Cover is PER FACE (§8.5), not one shared flag — covering the criteria
          // for a recall moment must not also blank the word bank the class is
          // writing from, and switching face must not carry a cover across.
          if (p.face !== 'text') {
            const key = p.face === 'bank' ? 'coverBank' : 'coverList';
            tools.append(el('button', {
              class: 'btn ghost small' + (p[key] ? ' gt-active' : ''),
              title: p.face === 'bank' ? 'Cover the words' : 'Cover the criteria',
              onclick: () => { p[key] = !p[key]; commit(); },
            }, 'Cover'));
          }

          if (p.face === 'text' && p.text) {
            tools.append(el('button', {
              class: 'btn ghost small',
              title: 'Text size on the board',
              // a class swap, not a rebuild — the tokens and the scroll stay put
              onclick: () => {
                p.size = (p.size + 1) % 3;
                save();
                if (textEl) textEl.className = 'gt-text gt-size' + p.size;
                paintQuick();
              },
            }, 'Size ' + (p.size + 1)));
            // moved off the reading surface and onto the bar: the board should
            // hold the model text and nothing else, and a button floating over
            // the last line of it was the only thing on that face that was not
            // the text
            tools.append(el('button', {
              class: 'btn ghost small',
              title: 'Put a different model text in',
              onclick: () => {
                D.confirmDialog('Put a different model text in? This clears the highlights on the '
                  + 'current one — they are tied to its words.', () => {
                  if (typeof D.snapshotBefore === 'function') D.snapshotBefore(w, 'Genre toolkit');
                  p.text = ''; p.marks = [];
                  api.refresh();
                }, { label: 'Clear the text', danger: true });
              },
            }, 'New text…'));
          }

          // Print, pinned to the right-hand end and unconditional
          // (poster-print-design.md §3.1). This widget earns a bar control
          // because two of its three sheets carry what the class did — the
          // criteria in the order they met them, and the model text with their
          // marks on it. Ghost, not solid: solid is the one act a widget exists
          // to perform, and here that is Reveal. Never conditional on the face —
          // a control that comes and goes reflows the bar mid-lesson;
          // printCurrent already opens the dialog on the sheet showing.
          tools.append(el('button', {
            class: 'btn ghost small gt-print',
            title: 'Print — pick the pages worth the paper',
            onclick: () => {
              if (!window.SagePrint) { toast('Print engine not loaded'); return; }
              const def = WIDGETS.genretoolkit;
              let job = null, at = 0;
              try {
                job = def.toPrintablePages(w);
                at = def.printCurrent(w);
              } catch (err) {
                toast('Couldn’t prepare the page — ' + ((err && err.message) || 'unknown error'));
                return;
              }
              if (!job || !job.length) { toast('Nothing to print yet'); return; }
              SagePrint.openDialog(job, { title: def.title, current: at });
            },
          }, iconEl('print'), el('span', { class: 'gt-print-lab' }, 'Print…')));
          rowNav.append(tools);

          // ---- row 2: the act
          const rowAct = el('div', { class: 'gt-row gt-row-act' });
          const next = queue()[0] || null;
          rowAct.append(next
            ? el('button', {
              // in full, never clipped: the children read this to know what
              // they are about to be shown, and it is often the lesson's
              // learning intention. It wraps and takes the room it needs
              // (Glenn, 2026-07-29 — the same call as the chips).
              class: 'btn small gt-reveal',
              // Revealing ARMS it (Glenn, 2026-07-29). "Here is today's
              // criterion — now find it in the text" was the commonest next
              // move and it cost a hunt for a chip that always lands last in a
              // strip capped at 42% of the face. Deliberately only here and not
              // in the chevron menu: that reveals several at once, so arming
              // whichever happened to be tapped last would be arbitrary, and
              // the menu covers the strip that would show it.
              onclick: () => {
                p.revealed.push(next.id);
                p.active = next.id;
                commit();
                showActiveChip();
              },
            }, 'Reveal: ' + next.t)
            : el('button', {
              class: 'btn ghost small gt-dim gt-reveal',
              title: 'Nothing left to reveal in this band — the chevron reveals from any year',
              onclick: () => toast(items().length ? 'All of this band is revealed' : 'No criteria yet'),
            }, 'All revealed'));

          // a chevron rather than a long-press: long-press on a board is a coin
          // toss, and this list is how a criterion gets revealed out of band
          rowAct.append(el('button', {
            // stays lit while its menu is open, and a commit rebuilds this
            // button underneath an open menu, so the state is read here too
            class: 'btn ghost small gt-chev' + (revealMenu ? ' gt-active' : ''),
            title: 'Reveal any criterion — pick as many as you need',
            onclick: () => openRevealMenu(),
          }, iconEl('chevr')));

          // Always present, disabled when there is nothing to take back, so the
          // end of row 2 does not move the first time a criterion is revealed.
          const canUndo = p.revealed.length > 0;
          rowAct.append(el('button', {
            class: 'btn ghost small gt-undo' + (canUndo ? '' : ' gt-dim'),
            title: canUndo
              ? 'Un-reveal the last one — a misfire in front of thirty children needs one tap back'
              : 'Nothing revealed yet',
            onclick: () => {
              if (!canUndo) return;
              const id = p.revealed.pop();
              if (p.active === id) p.active = null;
              commit();
            },
          }, iconEl('undo')));

          quick.append(rowNav, rowAct);
        }

        /* The reveal-out-of-order menu STAYS OPEN while criteria are picked
           (Glenn, 2026-07-29). It used to close on the first tap, so putting up
           four criteria at the start of a lesson meant opening it four times.
           Each tap still reveals immediately — the act is live, and nothing is
           held back waiting for an OK that a dismissed menu would lose — but the
           menu repaints its own ticks in place and waits for the next one.

           Three ways out, and no fourth: the chevron toggles it shut, a tap
           anywhere off it closes it, Escape closes it. (The app-wide
           tap-off-to-close work is happening elsewhere; this is the widget's own
           handler and stays local so the two do not collide.) */
        let revealMenu = null;

        // The chevron's open/shut look is a class swap on the live element, NOT
        // a paintQuick(). closeRevealMenu runs from a capture-phase pointerdown,
        // and rebuilding the bar there would detach whatever the teacher was
        // actually pressing before its click could fire — tapping Print while
        // the menu was open would silently do nothing.
        const markChev = (open) => {
          const cv = quick.querySelector('.gt-chev');
          if (cv) cv.classList.toggle('gt-active', open);
        };

        function closeRevealMenu() {
          if (!revealMenu) return;
          revealMenu.el.remove();
          document.removeEventListener('pointerdown', revealMenu.away, true);
          document.removeEventListener('keydown', revealMenu.key, true);
          revealMenu = null;
          markChev(false);
        }

        function paintRevealMenu(menu) {
          menu.replaceChildren();
          for (const [bid, label] of GT_BANDS) {
            const inBand = items().filter((it) => it.band === bid);
            if (!inBand.length) continue;
            menu.append(el('div', { class: 'gt-menu-lab' }, label));
            for (const it of inBand) {
              const on = p.revealed.includes(it.id);
              menu.append(el('button', {
                class: 'gt-menu-it' + (on ? ' on' : ''),
                onclick: () => {
                  if (on) {
                    p.revealed = p.revealed.filter((x) => x !== it.id);
                    if (p.active === it.id) p.active = null;
                  } else p.revealed.push(it.id);
                  commit();          // the board, the chips and the bar
                  paintRevealMenu(menu); // and this menu's own ticks, in place
                },
              }, el('span', { class: 'gt-sw', style: 'background:' + colOf(it.id) }),
              el('span', { class: 'gt-menu-t' }, it.t), on ? iconEl('tick') : null));
            }
          }
          if (!menu.children.length) {
            menu.append(el('div', { class: 'gt-menu-lab' }, 'No criteria yet'));
            return;
          }
          menu.append(el('div', { class: 'gt-menu-foot' },
            'Tap as many as you need — the arrow closes this.'));
        }

        function openRevealMenu() {
          if (revealMenu) { closeRevealMenu(); return; } // the chevron toggles
          const menu = el('div', { class: 'gt-menu' });
          const away = (e) => {
            if (menu.contains(e.target)) return;
            // the chevron is a NEW element after every commit, so it is
            // recognised by class rather than by identity — otherwise the first
            // reveal orphans the anchor and the toggle stops working
            if (e.target.closest && e.target.closest('.gt-chev')) return;
            closeRevealMenu();
          };
          const key = (e) => { if (e.key === 'Escape') closeRevealMenu(); };
          revealMenu = { el: menu, away: away, key: key };
          paintRevealMenu(menu);
          // clear of the WHOLE bar, measured rather than assumed: the bar is two
          // rows now and grows again when a long criterion wraps, and the fixed
          // offset this used to carry put the menu over the model text — the one
          // thing §11 says it must never cover
          menu.style.bottom = (quick.offsetHeight + 12) + 'px';
          body.append(menu);
          markChev(true);
          setTimeout(() => {
            document.addEventListener('pointerdown', away, true);
            document.addEventListener('keydown', key, true);
          }, 0);
        }

        function paintAll() {
          // the genre's own colour off the picker card, carried into the
          // widget: the face you are on wears the tint the class chose the unit
          // by, so picker and toolkit read as one thing rather than a coloured
          // menu leading to a grey tool. An imported or renamed genre has no
          // entry and falls back to the widget's own accent, which is what
          // --acc already defaulted to.
          const look = p.src ? GT_LOOK[p.src] : null;
          body.style.setProperty('--acc', (look && look.t) || '#c7d2fe');
          // the same genre's deep ink, so the face you are on is stated in the
          // text and the ring as well as the fill — a pale fill alone was too
          // quiet across a projector (Glenn, 2026-07-29)
          body.style.setProperty('--acc-ink', (look && look.k) || '#4338ca');
          if (!g) { paintPick(); quick.replaceChildren(); return; }
          if (p.face === 'bank' && !gtHasBank(g)) p.face = 'text';
          if (p.face === 'text') paintText();
          else if (p.face === 'bank') paintBank();
          else paintList();
          paintQuick();
        }

        paintAll();
      },

      settings(box, w, api) {
        const p = w.props;
        if (!p.genre) {
          box.append(el('div', { class: 'hint' }, 'Pick a genre on the widget first.'),
            el('button', { class: 'btn ghost small', onclick: () => gtOpenPack(w, api) },
              'Load a genre pack…'));
          return;
        }
        const g = p.genre;

        const nameIn = el('input', { class: 'text-input', type: 'text', value: g.name, maxlength: '60' });
        nameIn.addEventListener('change', () => {
          g.name = gtStr(nameIn.value, GT_CAP.name) || 'Genre';
          nameIn.value = g.name;
          save();
          api.refresh();
        });

        // Three band textareas and three word bank ones, one entry per line. The
        // band is structural rather than something a teacher types, and a textarea
        // IS the list: saving replaces it outright (supersede, never accumulate).
        const areas = [];
        const mkArea = (rows, value, placeholder) => {
          const ta = el('textarea', { class: 'names-area gt-edit-area', rows: String(rows), placeholder });
          ta.value = value;
          areas.push(ta);
          return ta;
        };
        const bandAreas = GT_BANDS.map(([bid, label]) => ({
          bid,
          label,
          ta: mkArea(4, g.items.filter((it) => it.band === bid).map((it) => it.t).join('\n'),
            'One criterion per line'),
        }));
        const langAreas = GT_LANG.map(([key, label]) => ({
          key,
          label,
          ta: mkArea(3, (g.language[key] || []).join('\n'), 'One per line'),
        }));

        function applyEdits() {
          // Belt and braces on top of the identity fix in mount: if the genre
          // object this panel was built from is no longer the widget's, these
          // textareas describe a state that no longer exists. Applying them would
          // write old wording over new AND prune the live reveals and marks against
          // it. Rebuild instead, and say so rather than failing silently.
          if (p.genre !== g) {
            toast('The widget changed — reopening these settings');
            api.refresh();
            return;
          }
          // A line whose text is unchanged keeps its id, so re-wording ONE
          // criterion does not drop the reveals and marks on the other fifteen.
          // Matched by exact text within its band, first unmatched old item wins —
          // two identically worded criteria in one band resolve in order rather
          // than both claiming the same id.
          const pool = new Map();
          for (const it of g.items) {
            const key = it.band + ' ' + it.t;
            if (!pool.has(key)) pool.set(key, []);
            pool.get(key).push(it);
          }
          const next = [];
          let over = false;
          for (const { bid, ta } of bandAreas) {
            for (const line of String(ta.value || '').split('\n')) {
              const t = gtStr(line, GT_CAP.item);
              if (!t) continue;
              if (next.length >= GT_CAP.items) { over = true; break; }
              const bucket = pool.get(bid + ' ' + t);
              const reuse = bucket && bucket.shift();
              next.push(reuse || { id: uid(), t, band: bid });
            }
            if (over) break;
          }
          g.items = next;
          const live = new Set(next.map((it) => it.id));
          p.revealed = p.revealed.filter((id) => live.has(id));
          p.ticked = p.ticked.filter((id) => live.has(id));
          p.marks = gtNormMarks(p.marks.filter((m) => live.has(m.item)), gtTokens(p.text).length);
          if (!live.has(p.active)) p.active = null;

          for (const { key, ta } of langAreas) {
            g.language[key] = String(ta.value || '').split('\n')
              .map((s) => gtStr(s, GT_CAP.word)).filter(Boolean).slice(0, GT_CAP.lang);
          }
          if (!gtHasBank(g) && p.face === 'bank') p.face = 'text';
          if (over) toast('Kept the first ' + GT_CAP.items + ' criteria');
          save();
          api.refresh();
        }
        for (const ta of areas) ta.addEventListener('change', applyEdits);

        const genreRow = el('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap;' });
        for (const def of gtDefaults()) {
          genreRow.append(el('button', {
            class: 'btn ghost small' + (p.src === def.id ? ' gt-active' : ''),
            onclick: () => {
              if (p.src === def.id) return;
              const swap = () => {
                if (typeof D.snapshotBefore === 'function') D.snapshotBefore(w, 'Genre toolkit');
                p.genre = def;
                p.src = def.id;
                p.revealed = []; p.ticked = []; p.marks = []; p.active = null;
                save();
                api.refresh();
              };
              if (p.revealed.length || p.marks.length) {
                D.confirmDialog('Switch to “' + def.name + '”? Every criterion is a different one, so '
                  + 'this unit’s reveals and highlights go. The model text stays.',
                swap, { label: 'Switch', danger: true });
              } else swap();
            },
          }, def.name));
        }

        box.append(
          settingRowOr('Genre name', nameIn),
          el('h4', {}, 'Criteria'),
          ...bandAreas.flatMap(({ label, ta }) => [el('div', { class: 'gt-edit-lab' }, label), ta]),
          el('div', { class: 'hint' }, 'One per line. These are the success criteria you reveal as you '
            + 'teach them. The band decides which ones Reveal walks for this deck’s year group — the '
            + 'chevron beside it can still reveal any of them.'),
          el('h4', {}, 'Word bank'),
          ...langAreas.flatMap(({ label, ta }) => [el('div', { class: 'gt-edit-lab' }, label), ta]),
          el('div', { class: 'hint' }, 'The genre’s words, for the board and for the wall. A box IS the '
            + 'list — save it and it replaces what was there, so nothing stale outlives an update. '
            + 'Empty all three and the word bank face gets out of your way.'),
          el('h4', {}, 'This pack'),
          genreRow,
          el('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap;' },
            el('button', {
              class: 'btn ghost small',
              onclick: () => {
                D.confirmDialog('Only share wording your school wrote. Rhymes, lens names and toolkit '
                  + 'text from paid schemes belong to their publishers.',
                () => gtSavePack(w), { label: 'Save the file', danger: false });
              },
            }, 'Save as a file…'),
            el('button', {
              class: 'btn ghost small',
              onclick: () => gtOpenPack(w, api),
            }, 'Load a genre pack…')),
          el('div', { class: 'hint' }, 'A pack is one plain file you own — hand it to next year’s '
            + 'teacher, or keep it as yours. Opening one replaces the criteria and the word bank here.'),
        );
      },
    };
  }

  window.SageEnglishText = {
    init(deps) {
      D = deps;
      register();
    },
  };
})();
