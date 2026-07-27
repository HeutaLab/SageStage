# 🌿 Sage Stage

A classroom screen for teachers that is **100% local**: no account, no subscription,
no server, no tracking. Everything you create is stored in your own browser
(localStorage) and can be exported to a plain JSON file at any time — your data is
always yours.

## Running it

It's a plain static site — no build step, no dependencies.

- **Easiest:** double-click `index.html` (works straight from the file system), or
- Serve the folder if you prefer an http URL:

  ```sh
  python3 -m http.server 8642
  # then open http://localhost:8642
  ```

## Widgets

| Widget | What it does |
| --- | --- |
| ✏️ Text | Free-form text box (font size, alignment, color) |
| 🕐 Clock | Digital or analog, optional seconds and date |
| ⏳ Timer | Countdown with presets, progress bar and end-of-time chime |
| ⏱ Stopwatch | Simple count-up timer |
| 🚦 Traffic light | Click a light to set it (red / amber / green) |
| 🎲 Name picker | Random student picker with spin animation; optional "no repeats" mode |
| 👥 Groups | Randomly split a class list into groups (by size or count) |
| 🎯 Dice | 1–3 animated dice with total |
| 🧱 Base 10 | Dienes blocks on a plain mat or place-value charts from T·O all the way to a seven-column Millions chart — the ten-thousand is a tower of ten thousand-cubes, the million a giant cube (small charts true to scale; the Y5 charts gently compress it, marked "not to scale", so every block stays visible). Tap a column or the tray to add blocks; ten-of-a-kind glows a "10 ⇄ 1" chip that animates the exchange; drop a block on a lower column (or double-tap) to break it into ten. Value pill with mystery "?" mask — the stem-sentence scaffold stays up and holds back just the answer ("… = ?") until the reveal — plus Flash/Cover, build-a-number challenge with streak, random mystery numbers |
| 🔴 PV counters | Place value counters — same-size labelled counters from millions down to thousandths on WRM-style charts (T·O up to a seven-column Millions chart, plus O·t·h and a six-column Decimals chart with the decimal point sitting on the header line). Tap a column or the tray to add counters; ten-of-a-kind glows a "10 ⇄ 1" chip that animates the exchange — across the decimal point too; drop a counter on a lower column (or double-tap) to break it into ten. ×10 / ÷10 slide every counter one place along the chart. Value pill with mystery "?" mask, stem sentences + expanded form, Flash/Cover, build-a-number challenge with streak, random mystery numbers, optional fraction labels (1/10) on decimal counters |
| 🔴 Rekenrek | Bead rack in 10, 20 and 100-bead sizes — five red, five white per row, resting on the right. Tap a bead and it brings every bead before it across in one push (tap a shown bead to send it and everything after it home); drag and the row glides along under your finger. Value pill with "?" mask, number sentences (doubles, bonds to 10/20, tens-and-more on the 100), Flash for subitising, Cover, show-me-a-number challenge with streak, random mystery numbers |
| ➡️ Number line | Flexible number line: marked scales (0–10, 0–20, 0–100 in tens, 0–1,000, decimals 0–1, halves/quarters/thirds, negatives) or a completely blank empty number line. Press-and-drag on the line to draw jump arcs for calculation strategies — ends snap to ticks and label themselves ("+10"), or type your own; taps drop landing dots (marked) or editable marks (blank); labels cycle every-step / ends-only / hidden; fraction ⇄ decimal display; "Facts" reads the jumps in order as a number sentence ("36 + 10 + 10 + 3 = 59") |
| 🔟 Frame tiles | Ten-frame number shapes (1–10) for the whole of primary. Drag, pair and snap tiles; even tiles are full rectangles, odd tiles keep a turnable "step". Three mat modes (ten-frames, a 0–10/0–20 number line, and a compare balance with a live < = > sign), re-label every tile as a decimal / percentage / fraction of ten, a Flash button for subitising, and a challenge bank spanning nine strands from counting to times tables and tenths |
| 🎤 Noise meter | Microphone level with green/amber/red thresholds (mic never leaves the device) |
| 🤫 Work mode | Big work-status symbol (silence, whisper, together, ask for help…) |
| 📊 Poll | Quick tally poll with live bars |
| 🔗 QR code | Generates QR codes locally (own encoder, no external service) |
| 🖼 Image | Local image upload (auto-downscaled to keep storage healthy) |
| 🌐 Embed | Embed a website / YouTube video |
| 📋 Agenda | Timed lesson plan with checkboxes |
| ⏲ Visual timer | Depleting-disc countdown (Time-Timer style) with presets and chime |
| 📆 Calendar | Month view with today highlighted; Monday or Sunday start |
| 🎉 Countdown | Days/hours until an event ("6 days and 3h 12m") |
| 🎬 Video | YouTube or direct .mp4/.webm playback |
| 📷 Webcam | Live camera feed (document camera); mirror toggle, never leaves the device |
| 📄 Document | Preview a PDF, image, TXT or CSV from a URL or local file; Word and PowerPoint files show conversion guidance |
| 🔗 Link | Big clickable button that opens a website |
| ⭐ Sticker | Giant resizable emoji sticker |
| 🏅 Scoreboard | Team points with +/− buttons |
| 🗂 Prompt cards | Heads-up, mystery reveal and speaking-topic packs with score/pass tracking |
| 🔤 Word builder | Letter-guessing game with reusable bunny, alien, snowman, scarecrow and classic skins |
| 🎴 Memory pairs | Shuffleable matching cards with move and pair counters |
| ⭕ Tic Tac Toe | Two-team board with round and match scoring |
| 🟡 Connect Four | Drop-counter strategy board with automatic win detection |
| 🔢 Numbers & letters | Number-target and longest-word classroom rounds |
| ♞ Mini strategy board | Four-square checkers and chess line-up modes |
| ✍️ Draw | Full-screen annotation layer over everything — persistent, editable strokes |
| 📝 Draw pad | Sketch canvas with select/lasso editing, shapes, text boxes, 13 papers (grids, number line, hundred square…), clear menu and PNG export |
| 🎨 Background | Gradients, colors, or your own image — per screen |

Widgets are dragged by their header, resized by the bottom-right corner, and have
⚙ settings, ⧉ duplicate and ✕ close buttons. The screen switcher (bottom right)
gives you multiple pages, each with its own background and widgets.

## The dashboard (landing page)

The app opens on a **dashboard**: every screen deck as a card with a live
thumbnail, screen count, last-used date, and its class & subject tags — plus
search and sort (last used / date created / name). Click a deck to start
teaching with it; 🏠 in the top-right corner brings the dashboard back any time
(Esc also closes it). A tab opened with `#s=<id>` (see below) skips the
dashboard and goes straight to its screen — handy for a second display.

The **Wallpaper** tab sets the dashboard's backdrop — the same photo
collections, gradients, colors and custom uploads as screen backgrounds, shown
under a soft veil so the cards stay readable.

## Templates

The **Templates** tab is a bank of ready-made screens — daily routines plus an
interactive game library with Heads up, Connect Four, Memory, seasonal word
builders, Tic Tac Toe, mini strategy games and more. Featured templates use
original illustrated covers and can be searched by title, subject or skill;
category filters remain available for quick browsing. One click adds a template as a
new deck sized to your display (positions are stored as fractions, so layouts
scale from a laptop to a projector). Built-in templates live in `templates.js`
and work offline.

**Community & school banks:** a template source is just a static folder with an
`index.json` (see `community/` — push it to GitHub Pages and share the URL).
Add sources via *Templates → Add a school source…*. Shared templates are
sanitized on import (unknown widget types are dropped) and the **first time**
you use one, Sage Stage shows what's inside — every widget and every URL it
links to — with a reminder to preview privately before showing your class.
You can also import a single template JSON file directly.

To share your own: deck ⋮ menu → **Copy as template JSON**, then send the file
to a colleague or open a pull request on the community repo
(see `community/README.md`).

Each deck's ⋮ menu has Open, Open in new tab, Rename, Duplicate, **Set class
list**, Set subject, Pin to top and Delete. Linking a deck to a name list makes
that list the default class for the Name picker and Groups widgets on that
deck, and shows it as a tag on the card. The **Name lists** tab manages your
class lists as cards — add or remove names inline, rename or delete lists (all
references in widgets and decks follow automatically).

## Screen decks

A **deck** is an independent set of screens — typically one deck per class or
subject ("Year 4R — Math"), each remembering its own current screen. Inside a
deck, the screens button (bottom right) opens the **screen deck** sidebar: every
screen as a card with a live thumbnail (background + widget positions), a name
("3 - Period 3"), and a ⋮ menu with Rename, Duplicate, Move up/down, **Open in new
tab**, Add new screen and Delete. Opening a screen in a new tab pins that tab to
that screen (via `#s=<id>` in the URL), so a second display can show a different
screen — even from a different deck — while both stay in sync through the same
local data. Perfect for teachers with several classes a day: one deck per class,
switched from the dashboard in one click.

## Annotating

The **✍️ annotate switcher lives at the end of the toolbar** (and in the
collapsed pill), so drawing over the screen is always one tap away — it never
needs pinning. It opens a full annotation toolbar: select, pen, marker, shapes (line,
arrow, rectangle, ellipse), eraser, an 11-color palette plus custom color picker,
three stroke sizes, undo/redo and clear. Strokes are smoothed through point
midpoints (no jittery diagonals, even with a shaky mouse or touchscreen).

Annotations are **permanent objects, saved per screen**: they stay visible after
you leave draw mode, survive reloads, and are included in backups. With the
**select tool (V)** click any annotation to edit it after the fact — change its
color or stroke size, drag it somewhere else, or use its ⋮ menu: Remove, Copy
drawing, Lock in position, Show in all screens, Bring to front, Send to back.

Shortcuts while annotating: **V** select · **P** pen · **M** marker · **L**
shapes · **E** eraser · **⌘Z / ⌘⇧Z** undo/redo · **Delete** removes the
selection · **Esc** deselects, then exits.

On touch boards, rubbing the screen with a **palm or the side of a fist**
erases automatically, whatever tool is active — no need to switch to the
eraser first. Annotation is **multi-touch**: up to four fingers can draw at
the same time, each leaving its own stroke — so four young children can
annotate together, e.g. over a locked full-screen Image widget (drawing works
even without a stylus). The toolbar itself can be moved: drag its ✥ grip to
dock the bar at the **top, bottom (just above the widget dock — at child
height), left or right** edge of the screen (it turns vertical on the sides),
and the position is remembered.

The **📝 Draw pad** widget is a sketch canvas in its own window — add several as
hand-drawn instruction cards next to other widgets. Its rose-tinted toolbar is
scoped to the pad (visually distinct from the full-screen annotation tools):
select, pen, marker (with opacity presets), stroke eraser (removes a whole
stroke), shapes (line, arrow, rectangle, ellipse, triangle, speech bubble,
bracket, brace), text boxes, colors, four widths, undo/redo and a clear menu
(clear ink / shapes / text / all). While typing in a text box a floating
formatting bar offers four sizes, four fonts (rounded, serif, handwriting,
typewriter) and colors, applied live. The select tool moves, resizes, rotates,
recolors, duplicates and reorders objects — drag empty space to lasso a group
of handwriting. Papers cover writing, maths, music and planning: plain, ruled,
handwriting guide, square/dot/isometric grids, coordinate plane, number line,
hundred square, fraction bars, place value, storyboard and music staff. The ⋯
menu adds change paper, lock drawing, duplicate pad, send to new screen, copy
/ paste drawing between pads, save as pad template, export as PNG and copy
image to clipboard. Exporting opens the browser's save dialog where supported
(so you choose exactly where the file goes); otherwise a toast names the file
and points to the Downloads folder. The drawing surface follows the widget's color theme, so a
tangerine pad is tangerine all the way through.

## Hiding the bar

Press **B** (or the ⤡ button at the end of the toolbar) to fold everything into a
tiny three-button pill — annotate, select, restore — so the screen is clean while
you teach. Press B again to bring the bar back. The choice is remembered.

Every widget's settings include a **color theme** row — classic, dark, glass,
fully transparent, and six pastel cards — handy for color-coding widgets per
team or group. The Text widget shows a floating formatting toolbar while you
type (bold/italic/underline, bullet list, alignment, text size, colors); it
flips below the widget when it's near the top of the screen.

The bar shows your favorite tools; everything else lives under **⊞ More**. In that
panel, 📌 pins or unpins any tool from the main bar — your arrangement is saved
(and included in backups).

## Your data

Click 💾 in the top-right corner:

- **Export everything (JSON)** — downloads a full backup you can keep, inspect, or
  move to another machine.
- **Import backup** — restores a backup file.
- **Erase all local data** — leaves nothing behind.

Name lists (for the picker and group maker) are shared across all decks and are
included in backups. Backups made before decks existed import cleanly — they
load as a single deck.

### Storage notes

Browsers give localStorage about 5 MB per site. Background photos and image widgets
are the main consumers (images are automatically downscaled on upload). The data
panel shows current usage.

## Files

- `index.html` — page shell
- `style.css` — all styling
- `app.js` — widgets, screens, persistence, export/import, cross-tab sync
- `qr.js` — self-contained QR encoder (byte mode, ECC L, versions 1–6)
- `icons-scarlab.js` — vendored tool icons from the "Scarlab Duotone Line Vectors"
  collection on [svgrepo.com](https://www.svgrepo.com) (public-domain license),
  recolored so each tool tints its own icon via the `--acc` CSS variable
- `icons.js` — hand-drawn fallback set (window chrome: gear, close, chevrons…)

Open the app in several tabs safely: changes save to localStorage and every tab
adopts writes from the others (`storage` event) instead of overwriting them.

## Money photo credits

The optional "Real photos" money style hotlinks images from Wikimedia Commons
via `Special:FilePath` (internet required; pieces fall back to the cartoon
style offline). US currency imagery is public domain; euro reproductions of
this kind are permitted by the ECB. Files used include: US One Cent Obv.png,
Jefferson-Nickel-Unc-Obv.jpg, United States dime obverse 2002.jpg, 2021-P US
Quarter Obverse.jpg, US $1/$5/$10/$20 note obverses, Euro 1/2/10 cent (gif),
Euro 5/20/50 cent common face, 1 & 2 Euro common face, EUR 5 (2013), EUR 10
(2014) and EUR 20 (2002) obverses. Current UK coin designs are Crown copyright
and are not hosted on Commons; UK teachers can photograph their own coins with
the "My photos" upload option (stored locally only).
