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

  // Eight pale fills, drawn from the accents already in use across the set: each
  // legible with dark slate on top, each printing without turning to mud. Colour
  // is NEVER stored on an item — it is the item's index into this list, so an
  // edited or reordered list can't orphan a mark to a dead colour. Past eight the
  // list cycles; identity lives in marks[].item, and tapping a highlight names
  // its criterion, so a repeated colour is a cosmetic collision, never a data one.
  const GT_COLS = ['#fde68a', '#a7f3d0', '#bfdbfe', '#fbcfe8',
    '#ddd6fe', '#fed7aa', '#d9f99d', '#bae6fd'];

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
    s = s.replace(/\r\n?/g, '\n').replace(/[\t\v\f ]/g, ' ').replace(GT_BAD_CH, '');
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
      if ((p.ticked || []).includes(it.id) || mine.length) {
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

    WIDGETS.genretoolkit = {
      title: 'Genre toolkit', icon: 'genretoolkit', accent: '#c7d2fe', w: 780, h: 560,
      defaults: () => ({
        genre: null, src: null, face: 'list',
        revealed: [], ticked: [], text: '', marks: [], active: null,
        allBands: false, size: 1, coverList: false, coverBank: false,
      }),
      toPrintablePages(w) {
        const p = w.props;
        if (!p.genre) return [];
        const pages = [];
        const poster = gtPosterSvg(p);
        if (poster) pages.push({ svg: poster, label: 'Success criteria' });
        const bank = gtBankSvg(p);
        if (bank) pages.push({ svg: bank, label: 'Word bank' });
        for (const pg of gtColdHotPages(w)) pages.push(pg);
        return pages;
      },
      // page 0 and only page 0 — SagePrint ticks one page on purpose, because
      // paper waste is the point of the feature (print.js:751), and a widget that
      // quietly queued four sheets would be arguing with that
      printCurrent() { return 0; },

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
          p.face = 'list';
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
              }, 'Open a pack file…')),
            el('div', { class: 'hint' }, 'Every criterion here is our wording or the National '
              + 'Curriculum’s — no scheme’s. Change all of it in Settings: your school words its '
              + 'toolkits its own way, and this expects you to.'),
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
          for (const it of shown) {
            const n = marksOf(it.id).length;
            const on = p.ticked.includes(it.id) || n > 0;
            list.append(el('div', {
              class: 'gt-row' + (p.active === it.id ? ' gt-on' : ''),
              onclick: () => { p.active = p.active === it.id ? null : it.id; commit(); },
            },
            el('span', { class: 'gt-sw', style: 'background:' + colOf(it.id) }),
            el('span', { class: 'gt-crit' }, it.t),
            el('button', {
              class: 'gt-tick' + (on ? ' on' : ''),
              title: n ? 'Ticked by ' + n + ' highlight' + (n === 1 ? '' : 's') + ' in the model text'
                : 'Tick this criterion',
              onclick: (e) => {
                e.stopPropagation();
                const at = p.ticked.indexOf(it.id);
                // A mark-driven tick is not a toggle. The box shows ticked whenever
                // the criterion has highlights, so tapping it used to silently set
                // the manual flag underneath — a tap that changed nothing visible,
                // and a second tap that appeared to do the un-ticking. Now the tap
                // says why it is ticked and leaves the state alone; un-ticking means
                // unpainting the evidence, which is the honest thing to ask for.
                if (n && at < 0) {
                  toast('Ticked by ' + (n === 1 ? 'a highlight' : n + ' highlights')
                    + ' in the model text — unpaint them to clear it');
                  return;
                }
                if (at < 0) p.ticked.push(it.id); else p.ticked.splice(at, 1);
                if (n && at >= 0) {
                  toast('Still ticked — ' + (n === 1 ? 'there is 1 highlight' : 'there are ' + n + ' highlights')
                    + ' for it in the model text');
                }
                commit();
              },
            }, on ? iconEl('tick') : null,
            n > 1 ? el('span', { class: 'gt-tick-n' }, String(n)) : null)));
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
              title: it.t,
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
          face.append(chips, wrap,
            el('div', { class: 'gt-textbar' },
              el('button', {
                class: 'btn ghost small',
                onclick: () => {
                  D.confirmDialog('Put a different model text in? This clears the highlights on the '
                    + 'current one — they are tied to its words.', () => {
                    if (typeof D.snapshotBefore === 'function') D.snapshotBefore(w, 'Genre toolkit');
                    p.text = ''; p.marks = [];
                    api.refresh();
                  }, { label: 'Clear the text', danger: true });
                },
              }, 'New text…')));
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
          const fileIn = el('input', {
            type: 'file', style: 'display:none;',
            accept: '.txt,.md,.text,text/plain,text/markdown',
          });
          fileIn.addEventListener('change', () => {
            const f = (fileIn.files || [])[0];
            fileIn.value = '';
            if (!f) return;
            if (f.size > GT_CAP.text * 8) { toast('That file is too big to read here'); return; }
            const fr = new FileReader();
            fr.onerror = () => toast('Could not read that file');
            fr.onload = () => { ta.value = String(fr.result || '').slice(0, GT_CAP.text * 2); take(); };
            fr.readAsText(f);
          });
          face.append(el('div', { class: 'gt-empty' },
            ta,
            el('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap;' },
              el('button', { class: 'btn small', onclick: take }, 'Use this text'),
              el('button', { class: 'btn ghost small', onclick: () => fileIn.click() }, 'Open a text file…'),
              fileIn),
            el('div', { class: 'hint' }, 'Plain text — a page or two is plenty. Once it is in, tap a '
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
        function paintQuick() {
          quick.replaceChildren();
          if (!g) return;
          const faces = [['list', 'Checklist'], ['text', 'Model text']];
          if (gtHasBank(g)) faces.push(['bank', 'Word bank']);
          const seg = el('div', { class: 'gt-seg' });
          for (const [id, label] of faces) {
            seg.append(el('button', {
              class: 'btn ghost small' + (p.face === id ? ' gt-active' : ''),
              // the one control that genuinely rebuilds: a different face
              onclick: () => { p.face = id; save(); paintAll(); },
            }, label));
          }
          quick.append(seg);

          const next = queue()[0] || null;
          quick.append(next
            ? el('button', {
              class: 'btn small',
              title: next.t,
              onclick: () => { p.revealed.push(next.id); commit(); },
            }, 'Reveal: ' + (next.t.length > 26 ? next.t.slice(0, 25) + '…' : next.t))
            : el('button', {
              class: 'btn ghost small gt-dim',
              title: 'Nothing left to reveal in this band — the chevron reveals from any year',
              onclick: () => toast(items().length ? 'All of this band is revealed' : 'No criteria yet'),
            }, 'All revealed'));

          // a chevron rather than a long-press: long-press on a board is a coin
          // toss, and this list is how a criterion gets revealed out of band
          quick.append(el('button', {
            class: 'btn ghost small gt-chev',
            title: 'Reveal a particular criterion',
            onclick: (e) => openRevealMenu(e.currentTarget),
          }, iconEl('chevr')));

          if (p.revealed.length) {
            quick.append(el('button', {
              class: 'btn ghost small',
              title: 'Un-reveal the last one — a misfire in front of thirty children needs one tap back',
              onclick: () => {
                const id = p.revealed.pop();
                if (p.active === id) p.active = null;
                commit();
              },
            }, iconEl('undo')));
          }

          // no Cover on the model text face: covering the WAGOLL is what the mask
          // boxes in the book page widget are for.
          // Cover is PER FACE (§8.5), not one shared flag — covering the criteria
          // for a recall moment must not also blank the word bank the class is
          // writing from, and switching face must not carry a cover across.
          if (p.face !== 'text') {
            const key = p.face === 'bank' ? 'coverBank' : 'coverList';
            quick.append(el('button', {
              class: 'btn ghost small' + (p[key] ? ' gt-active' : ''),
              title: p.face === 'bank' ? 'Cover the words' : 'Cover the criteria',
              onclick: () => { p[key] = !p[key]; commit(); },
            }, 'Cover'));
          }

          if (p.face === 'text' && p.text) {
            quick.append(el('button', {
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
          }

          const band = deckBand();
          if (band) {
            quick.append(el('button', {
              class: 'btn ghost small' + (p.allBands ? ' gt-active' : ''),
              title: p.allBands ? 'Reveal walks every year'
                : 'Reveal walks ' + gtBandName(band) + ' — this deck’s year group',
              onclick: () => { p.allBands = !p.allBands; commit(); },
            }, p.allBands ? 'All years' : gtBandName(band)));
          }
        }

        function openRevealMenu(anchor) {
          const menu = el('div', { class: 'gt-menu' });
          const close = () => {
            menu.remove();
            document.removeEventListener('pointerdown', away, true);
          };
          const away = (e) => { if (!menu.contains(e.target) && e.target !== anchor) close(); };
          for (const [bid, label] of GT_BANDS) {
            const inBand = items().filter((it) => it.band === bid);
            if (!inBand.length) continue;
            menu.append(el('div', { class: 'gt-menu-lab' }, label));
            for (const it of inBand) {
              const on = p.revealed.includes(it.id);
              menu.append(el('button', {
                class: 'gt-menu-it' + (on ? ' on' : ''),
                onclick: () => {
                  close();
                  if (on) {
                    p.revealed = p.revealed.filter((x) => x !== it.id);
                    if (p.active === it.id) p.active = null;
                  } else p.revealed.push(it.id);
                  commit();
                },
              }, el('span', { class: 'gt-sw', style: 'background:' + colOf(it.id) }),
              el('span', { class: 'gt-menu-t' }, it.t), on ? iconEl('tick') : null));
            }
          }
          if (!menu.children.length) menu.append(el('div', { class: 'gt-menu-lab' }, 'No criteria yet'));
          body.append(menu);
          setTimeout(() => document.addEventListener('pointerdown', away, true), 0);
        }

        function paintAll() {
          if (!g) { paintPick(); quick.replaceChildren(); return; }
          if (p.face === 'bank' && !gtHasBank(g)) p.face = 'list';
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
              'Open a pack file…'));
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
          if (!gtHasBank(g) && p.face === 'bank') p.face = 'list';
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
            }, 'Open a pack file…')),
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
