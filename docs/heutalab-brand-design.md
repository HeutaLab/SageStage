# HeutaLab — brand mark & logo system

Designed 2026-08-02, with Glenn reviewing live mid-session. The comp sheet at
`docs/design/heutalab-logo-directions.html` is the visual authority for everything
here — open it in a browser; every mark on it is a working SVG. One asset already
shipped during the review (§4). One decision still gates the rest (§5).

## 0. The problem, and the lines that shaped the answer

heutalab.com shipped with a real identity — four staggered bars (coral, cobalt,
amber, mint), a heavy navy wordmark with "Lab" in coral, `EDTECH FOR CURIOUS
MINDS` in letterspaced mono — but the mark exists **only as CSS divs** in the
site header. The favicon is an unrelated stock glyph in the wrong blues; the
@heutalab socials (Instagram, X, YouTube, TikTok — linked as inline SVG from
sagestage.app) have no avatar that survives a circle crop; sagestage.app ships
the 🌿 emoji. Three surfaces, three strangers. The brief: logos as **files** —
one identity that works at 16px, in a circle, in one colour, on a slide, in an
email header.

Constraints carried in from the estate:

- **Source of truth is the site's own tokens** (`HeutaLab-Site/css/styles.css`):
  ink `#071428`, paper `#fffefd`, coral `#ff4b4d`, cobalt `#0757d7`, lime
  `#b9d539`, mint `#16ad88`, plus the header bars' amber `#f7b229` and the
  muted slate `#536072` for the tagline.
- **Flat colour in logo files, never gradients** — the header's CSS gradients die
  in print and at favicon sizes. The site may keep its gradients; files don't.
- **Text as paths, always.** Wordmarks are generated from the estate's vendored
  OFL Poppins (`Sage_On_The_Stage/vendor/fonts/`), converted to outlines with
  fontTools. No font dependency ships in any logo file; nothing is fetched.
- **No new colours.** The teal variant (§4) is Sage Stage's own accent `#0f766e`
  — a deliberate bridge to the product estate, not a new token.

## 1. The wordmark

Poppins 700, tracking −22/1000 em, fattened with a 12-unit round-joined stroke
(`paint-order: stroke`) to reach the reference's ~850 weight with softened
corners. "Heuta" in ink, "Lab" in coral; on ink backgrounds "Heuta" flips to
paper and "Lab" stays coral. Tagline: Poppins 600 caps, +150 tracking, slate on
paper, 62%-paper on ink, sized to match the name's width exactly. The generator
is `gen_wordmark.py` (session scratchpad; re-runnable from the vendored woff2s —
fontTools + brotli are both on this machine).

## 2. The three directions, as presented

| | mark | one line | where it landed |
|---|---|---|---|
| A | **The bars, as drawn** | the header's four bars vectorised: flat colours, shared baseline, mint ribbon kept | fallback — the site wouldn't change at all |
| B | **The Eta** | the same bars locked into H — capital Eta, the Greek behind "heuta", the self who does the learning | strongest pure glyph at 16px; alternative |
| C | **The curious spark** | the site's collage shapes — cobalt hill, coral sun, amber peak, lime smile — composed into a landscape looking up; in one colour it becomes a reader over an open book | **Glenn's pick, twice, mid-review** |

## 3. What Glenn decided during the review (2026-08-02)

1. **The spark is the email header** — flagged from the comp sheet's tab mock and
   mono row ("I want this for the email header but it's got to have the full
   tagline showing").
2. **Colour is the lead variant** ("perhaps this"), with teal (`#0f766e`,
   Sage Stage's accent) requested and shipped as an alternative ("or this in
   teal"). Ink exists for print/mono.
3. The header went straight into the **MailerLite welcome email** the same hour —
   screenshot seen in review, rendering correctly in the template.

## 4. The shipped asset — email masthead

Canvas 1200×240 (@2x of 600×120), baked paper background (dark-mode email
clients invert transparent PNGs; baked bg is deliberate). Spark mark 150px,
bottom-aligned with the tagline; name cap-height 96px; tagline width equals name
width; lockup centred. Three colourways: **colour** (lead), **ink**, **teal**.
Shipped as SVG master + 600px and 1200px PNGs per colourway, delivered in chat
2026-08-02; masters regenerate from `build_email_header.py`. Final home when the
kit lands: `HeutaLab-Site/assets/brand/` (§6).

## 5. The one open decision — scope

**Does the spark become the mark everywhere, or stay a comms mark?**

- **Everywhere (recommended):** favicon, @heutalab avatars, GitHub org avatar,
  the heutalab.com header itself. The four bars don't die — they return to what
  they already are elsewhere on the page: tile art (they're the game-based-
  learning tile). One glyph, one brand, and the mono reader-over-a-book carries
  16px duty honestly.
- **Comms-only:** the spark fronts email/banners/OG; a glyph (A or B) takes
  favicon-and-avatar duty. Two marks persist by design; workable, but it
  re-creates today's problem at half strength.

Do not build §6 until Glenn answers; the answer changes which symbol every
asset carries.

## 6. The kit (build after §5)

| asset | spec | destination |
|---|---|---|
| favicon.svg + PNG 16/32/48/180/192/512 | mark on transparent; the lime arc IS dropped below 48px — honest 16px renders showed it as mush (`assets/tiles/` is category art, untouched) | `HeutaLab-Site/assets/favicon.svg` — every page, legacy included, references that one absolute path (verified), so one file re-favicons the whole site |
| avatars 1024×1024 (paper / ink / coral) | mark ≤62% of box — circle-crop safe; ink is the default upload | @heutalab on Instagram, X, YouTube, TikTok + GitHub org |
| banners | X 1500×500; YouTube 2048×1152 with safe-area check | channel art |
| OG image 1200×630 | rebuilt on the brand collage with real lockup | `HeutaLab-Site/assets/og.png` |
| email masthead | §4 — done | MailerLite (in place) |
| site header swap | inline SVG lockup replaces the `.brand-mark` divs; real `favicon.svg` link | `HeutaLab-Site/index.html` + css |
| maker's footer line | small mono-ink or teal lockup, "Made by HeutaLab" | sagestage.app footer, sagestage.co.uk footer |

All kit SVGs carry **baked colours per variant** — no CSS custom properties in
shipped files. (Review-sheet lesson, kept as a rule: `var()` theming inside
`<use>` shadow trees is unreliable; the sheet itself now bakes per-variant
symbols for the same reason.)

## 7. Hazards

- **sagestage.app deploys are deliberate** (dispatch-only, per
  `sagestage-app-design.md` §3) — the footer mark there rides the next
  deliberate deploy, never a rushed one.
- **MailerLite images keep the baked paper bg** — transparent versions will
  ghost in dark-mode clients.
- **Wordmark regeneration only from the vendored fonts** — never from
  system-installed fonts, or the outlines drift from what shipped.
- **The site's live header text stays Arial for now** — self-hosting Poppins for
  heutalab.com's HTML is a separate decision with its own weight budget; out of
  scope here. The logo files already carry their own outlines either way.
- **Avatar safe zone:** platforms circle-crop and shrink; mark ≤62% of the
  canvas, nothing meaningful in corners.

## 8. Verification

The comp sheet **is** the small-size verification surface (16px tab mocks, 40px
reply avatars, mono rows, dark cards) — anything that changes re-verifies there
first. Kit-time: favicon checked in a real tab, light and dark; an avatar
actually uploaded and eyeballed on a phone; a MailerLite test send viewed in
dark mode; `xmllint --noout` on every shipped SVG.

## 9. Build order — status 2026-08-02, same day

1. ~~Glenn answers §5~~ — **answered: everywhere.**
2. ~~Kit assets generated + verified~~ — in `HeutaLab-Site/assets/brand/` (26
   files + README), every SVG xmllint-clean, every composite eyeballed at size.
3. ~~heutalab.com favicon + header swap~~ — `assets/favicon.svg` and
   `assets/og.png` replaced, header bars → inline spark SVG, apple-touch link
   added, verified in a local serve. **Deploy is Glenn's** (wrangler).
4. ~~Footer marks~~ — sagestage.co.uk (all three help pages) and
   sagestage.app's landing both carry "Made by ⌂ HeutaLab" with the mini spark
   (arc-less at footer size); the taster's ships on the **next deliberate
   dispatch**, never before.
5. Socials: Glenn uploads `avatar-ink` (default) to @heutalab on Instagram / X /
   YouTube / TikTok + the GitHub org, and the banners to X / YouTube.
6. ~~Iteration log + memory~~ — done.

**Still Glenn's:** deploy heutalab.com · dispatch the sagestage-app workflow ·
the uploads in 5 · commit the three repos · the separate "self-host Poppins on
the site?" decision.
