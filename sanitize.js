/* Sage Stage — one sanitizer for stored rich text.
   The Text widget's content is real HTML, and it arrives from three places:
   the teacher typing into a contenteditable, a .pptx import, and a shared
   template or a restored backup — which is a stranger's file. `innerHTML`
   runs an `onerror` handler without needing a <script> tag, and this app's
   one origin holds every deck and every class list of children's names, so
   every path that puts stored html on a screen comes through here. */
(function () {
  'use strict';

  // What a text widget's content can legitimately hold: the tags the
  // formatting toolbar's execCommands emit (b/i/u/strike, font, span, lists,
  // a), the ones the built-in templates use (b, div), and the ones a .pptx
  // import builds (div/span/a/br carrying inline styles).
  const OK_TAGS = new Set([
    'A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DEL', 'DIV', 'EM', 'FONT',
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR', 'I', 'LI', 'MARK', 'OL',
    'P', 'PRE', 'S', 'SMALL', 'SPAN', 'STRIKE', 'STRONG', 'SUB', 'SUP',
    'U', 'UL',
  ]);

  // Removed with everything inside them. Anything else unrecognised is
  // unwrapped instead — a stranger's <foo>word</foo> should cost the tag and
  // keep the word — but these hold code, CSS or a network request, and
  // unwrapping one would paint its source on the board as text.
  const KILL_TAGS = new Set([
    'APPLET', 'AREA', 'AUDIO', 'BASE', 'BUTTON', 'CANVAS', 'DIALOG', 'EMBED',
    'FORM', 'FRAME', 'FRAMESET', 'IFRAME', 'IMG', 'INPUT', 'LINK', 'MAP',
    'MARQUEE', 'MATH', 'META', 'NOSCRIPT', 'OBJECT', 'OPTION', 'PICTURE',
    'PORTAL', 'SCRIPT', 'SELECT', 'SOURCE', 'STYLE', 'SVG', 'TEMPLATE',
    'TEXTAREA', 'TITLE', 'VIDEO',
  ]);

  // Per-tag attribute allow-list. `style` is allowed on everything and
  // filtered by property below; every event handler is absent from every
  // list, which is the whole point — `onerror` is the attack, not <script>.
  const OK_ATTRS = {
    A: ['href', 'target', 'rel', 'title'],
    FONT: ['color', 'face', 'size'],
    OL: ['start'],
  };

  // Formatting properties only. Nothing here can position an element over the
  // app's own chrome, and nothing here takes a url().
  const OK_CSS = new Set([
    'background-color', 'color', 'font-family', 'font-size', 'font-style',
    'font-variant', 'font-weight', 'letter-spacing', 'line-height',
    'margin-left', 'padding-left', 'text-align', 'text-decoration',
    'text-decoration-color', 'text-decoration-line', 'text-indent',
    'text-transform', 'vertical-align', 'white-space', 'word-spacing',
  ]);

  const SAFE_SCHEME = /^(?:https?:|mailto:)/i;
  const HTTP_SCHEME = /^https?:/i;
  // Inline bitmaps only. `image/svg+xml` is deliberately absent: an SVG is a
  // document carrying its own script — inert inside <img>, not inert anywhere
  // else — and the callers below include ones that frame what they are given.
  const DATA_IMAGE = /^data:image\/(?:png|jpe?g|gif|webp|avif|bmp);/i;

  // Every scheme test below runs against a stripped copy — what the URL parser
  // itself ignores, and only that: leading control characters and spaces, and
  // tab/CR/LF anywhere. Strip less and "java\tscript:" walks past, which the
  // parser accepts. Strip more — every unicode space, say — and the tests read
  // a scheme into "Learn about javascript: in year 6", which is lesson text.
  const bare = (s) => s.replace(/^[\u0000-\u0020]+/, '').replace(/[\t\r\n]/g, '');

  // A URL the app is willing to follow, or '' — used for hrefs inside stored
  // html and by the widgets that hand a URL to the system browser.
  function url(raw) {
    const s = String(raw == null ? '' : raw);
    return SAFE_SCHEME.test(bare(s)) ? s.trim() : '';
  }

  // A URL for a frame or a media element. Narrower than `url()` on purpose:
  // mailto: means nothing as a src, and a `data:text/html` document is exactly
  // how a stranger's template gets script into an iframe.
  function frameUrl(raw) {
    const s = String(raw == null ? '' : raw);
    return HTTP_SCHEME.test(bare(s)) ? s.trim() : '';
  }

  // A URL for an <img> or a CSS background: the web, or the inline bitmap the
  // teacher's own upload produces.
  function imageUrl(raw) {
    const s = String(raw == null ? '' : raw);
    const b = bare(s);
    return (HTTP_SCHEME.test(b) || DATA_IMAGE.test(b)) ? s.trim() : '';
  }

  // Schemes a stored string must never open with. A deny-list, where every
  // other test in this file is an allow-list, and deliberately so: the live URL
  // sinks are guarded above by what each one can safely take, and this backs
  // the template importer's sweep over *every* string in a props tree — where
  // an allow-list cannot go, because "Note: bring a coat" opens with something
  // indistinguishable from a scheme and blanking it would eat the agenda.
  const HOSTILE_SCHEME = /^(?:javascript|vbscript|livescript|mocha|data|file|blob|about|filesystem|view-source|jar|resource|chrome|ms-its|mhtml):/i;

  function hostileUrl(raw) {
    const b = bare(String(raw == null ? '' : raw));
    return HOSTILE_SCHEME.test(b) && !DATA_IMAGE.test(b);
  }

  // A CSS url() token, or ''. Quoted, with quotes and backslashes escaped, so
  // the value cannot close the function and start something else; newlines go,
  // because one inside a quoted CSS string voids the whole declaration.
  function cssUrl(raw) {
    const u = imageUrl(raw);
    if (!u) return '';
    return 'url("' + u.replace(/[\\"]/g, '\\$&').replace(/[\r\n]/g, '') + '")';
  }

  // A colour or a gradient, or ''. Nothing here should reach the network: a
  // template storing `url(https://tracker/x)` under type "gradient" is the same
  // hotlink as an image background wearing a different label.
  function cssPaint(raw) {
    const s = String(raw == null ? '' : raw).trim();
    if (!s || s.length > 400) return '';
    if (/url\(|image-set|expression|@import|[\\;{}<>]/i.test(s)) return '';
    return s;
  }

  // A style attribute, reduced to the declarations that only change how words
  // look. url() is how a style attribute reaches the network and a backslash
  // is how a value hides one; braces and angle brackets are how a value tries
  // to leave the attribute. Parentheses stay legal — foreColor writes
  // `color: rgb(15, 23, 42)`.
  function style(css) {
    const out = [];
    for (const decl of String(css == null ? '' : css).split(';')) {
      const i = decl.indexOf(':');
      if (i < 1) continue;
      const prop = decl.slice(0, i).trim().toLowerCase();
      const val = decl.slice(i + 1).trim();
      if (!val || !OK_CSS.has(prop)) continue;
      if (/url\(|expression|@import|\\|\/\*|[<>{}]/i.test(val)) continue;
      out.push(prop + ':' + val);
    }
    return out.join(';');
  }

  function unwrap(node) {
    const parent = node.parentNode;
    if (!parent) return;
    while (node.firstChild) parent.insertBefore(node.firstChild, node);
    parent.removeChild(node);
  }

  // Stored html, cleaned for a live document. DOMParser is what makes this
  // safe to do at all: the document it returns is inert, so the <img> in
  // `<img src=x onerror=…>` is examined without ever being loaded. A detached
  // div + innerHTML — the obvious way to write this — fires the handler.
  function html(dirty) {
    const src = String(dirty == null ? '' : dirty);
    if (!src) return '';
    const body = new DOMParser().parseFromString(src, 'text/html').body;
    if (!body) return '';
    for (const node of Array.from(body.querySelectorAll('*'))) {
      if (!body.contains(node)) continue; // an ancestor already took it
      const tag = node.tagName;
      if (KILL_TAGS.has(tag)) { node.remove(); continue; }
      if (!OK_TAGS.has(tag)) { unwrap(node); continue; }
      const allowed = OK_ATTRS[tag];
      for (const attr of Array.from(node.attributes)) {
        const name = attr.name.toLowerCase();
        if (name === 'style') {
          const s = style(attr.value);
          if (s) node.setAttribute('style', s);
          else node.removeAttribute('style');
          continue;
        }
        if (!allowed || allowed.indexOf(name) < 0) { node.removeAttribute(name); continue; }
        if (name === 'href') {
          const u = url(attr.value);
          if (u) node.setAttribute('href', u);
          else node.removeAttribute('href');
        }
      }
      // a link tapped on the board opens away from the app, and cannot hold a
      // handle back to the window it came from
      if (tag === 'A' && node.hasAttribute('href')) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }
    return body.innerHTML;
  }

  // The words only, for the two readers that never wanted markup: a deck
  // thumbnail's preview line and a PPTX speaker note.
  function text(dirty) {
    const src = String(dirty == null ? '' : dirty);
    if (!src || (src.indexOf('<') < 0 && src.indexOf('&') < 0)) return src;
    const body = new DOMParser().parseFromString(src, 'text/html').body;
    return body ? (body.textContent || '') : '';
  }

  window.SageSanitize = { html, text, url, frameUrl, imageUrl, hostileUrl, cssUrl, cssPaint, style };
})();
