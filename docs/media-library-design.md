# Sage Stage — the media library: a teacher's own pictures, in their own folders

**Status:** Design. Not scheduled, no implementation started. §9 (formats at the door) is the one part already built and shipped — see commit `cb73ae8`.
**Companion documents:** [Storage abstraction & Tauri desktop](storage-abstraction-plan.md) (§8 reserves the `assets/` convention this builds on) · [Help system](help-system-design.md) · [App review checklist](app-review-checklist.md) · [Licensing](licensing-design.md)
**Date:** 2026-08-26
**Prompted by:** the first outside feedback on the built app — a teacher who has used SMART for years, asking the one question the app has no answer to.
**Platform facts checked:** 2026-08-26 (Tauri v2 asset protocol, persisted scope, OneDrive Files On-Demand). Re-check before implementation.

---

## 0. The ask, in the tester's words

> "Does it have a way for me to create my own content, i.e. images I would use
> often that can be stored in folders in the app? This is something I do with
> SMART. The students' photos, maths images that are not currently on your app."

And Glenn's follow-up, which is the design question proper:

> "Can there be a way to link locally to a folder on the user's device to pull
> in images? Or is there a better way? Say, a OneDrive folder?"

Three things are being asked for at once, and they are not the same feature:

1. **Reuse.** The same picture, used again next week, without hunting for it.
2. **Organisation.** Folders the teacher made, named in the teacher's terms.
3. **Their own material.** Specifically pupil photos and maths images the app
   does not ship.

The third one carries a constraint the other two don't: **pupil photos are
personal data about children**, and every decision below has to survive being
read by an international school's data protection officer. §8 is where that
gets settled; it is the section that decides the shape of the rest.

---

## 1. What the app does today

There is image support, and it is entirely one-shot.

Four call sites feed a single funnel, `pickImage()` ([app.js:9484](../app.js)):
the image widget, screen backgrounds, the dashboard wallpaper, and the mascot
face. Money-note photos go through the same door. Each one opens an OS file
picker, reads the file, downscales it to 1600px (and caps area at 12M pixels,
because WebKit's canvas ceiling is 16,777,216), and hands back a **data-URL**
that is written straight into state.

So:

- **No reuse.** The same picture on three screens is picked three times and
  stored three times.
- **No folders.** There is nowhere for a picture to live except on a board.
- **No browsing.** The only view of a teacher's images is the OS file picker.

One thing already hints at the gap: `state.moneyImages` is
`{ curId: { denomValue: dataURL } }`, described in `normalize()` as *"shared by
all money widgets"* ([app.js:365](../app.js)). The app has needed a shared image
store once already and solved it privately, for one widget.

---

## 2. The decision: link for browsing, copy on use

### 2.1 Why not pure linking

A linked path is a promise the app cannot keep.

The failure is not abstract and it is not rare. It is: 8:55am, the class is
coming in, the board shows a grey box, and the reason is that somebody
reorganised the shared drive in July. The teacher cannot fix that in the ninety
seconds they have. Every mechanism that can put a broken image on a board at
lesson time is disqualified by the classroom, not by engineering taste.

It also fights the project's own model. Lessons are meant to travel as **owned
files** — a teacher's content is theirs, moves with them, and does not depend on
a server. A path reference does not travel. Open the same lesson on a second
machine, or restore it from a backup two terms later, and the path resolves to
nothing.

### 2.2 Why not pure copying

Copy-everything has one serious problem and it is the pupil-photo problem.

Copying a child's photograph into `Documents/Sage Stage/assets/` creates a
**second copy, outside anything the school manages**. The school's own copy —
in their OneDrive tenancy, or their MIS — is covered by their retention policy,
their deletion schedule, and their DPO's mental map of where children's images
live. The app's copy is covered by none of that, and neither the teacher nor
the DPO has any way to see it.

That is a real objection from exactly the buyers Sage Stage is aiming at.

### 2.3 The rule

**Link for browsing. Copy on use.**

- The teacher points Sage Stage at one or more folders — their maths images,
  the class photos folder, an exported SMART content folder. Those appear
  **in the app** as a browsable gallery with the folder tree intact. That is
  the "My Content" shape they already know, and it is the whole of what §0's
  points 1–3 asked for.
- Nothing is copied by browsing. The library is a **window onto folders the
  teacher already has**, not a second copy of them.
- The moment a picture is **placed on a board**, it is copied into the app's
  own asset store and the lesson references that copy. From that instant the
  lesson is self-contained and permanent.

What this buys:

| | linked only | copied only | link + copy-on-use |
|---|---|---|---|
| picture breaks mid-lesson | yes | no | **no** |
| lesson survives moving machine | no | yes | **yes** |
| teacher keeps their own filing | yes | no | **yes** |
| second copy of pupil photos | no | yes | **only once used** |
| works with OneDrive/Drive | yes | import only | **yes** |

The residual cost is the last row of the middle column, and §8 addresses it
directly rather than pretending it away.

**Failure mode, stated plainly:** if a source folder is moved, renamed,
unplugged or offline, the *picker* goes empty for that folder and says so.
Nothing already on a board changes. An empty picker at 4pm on a Tuesday is a
calm problem; a grey box at 8:55 is not.

---

## 3. OneDrive, Drive, Dropbox — no connector, ever

**Do not build a OneDrive integration.** A synced OneDrive folder is a local
folder. Pointing the picker at `~/OneDrive - Someschool/Class Photos` gets
essentially all of the value.

The alternative is OAuth against Microsoft Graph, which in a school means
asking IT for tenant admin consent to install an app that reads staff files.
That is a procurement conversation, not a feature — and for a product whose
adoption unit is *one teacher on one machine*, it is the wrong shape entirely.

Two caveats to state in the UI, not to solve:

- **Files On-Demand.** OneDrive on both Windows and macOS can hold a file as a
  placeholder rather than actual bytes. Reading one triggers a download: slow
  on school wifi, and it **fails when offline**. A thumbnail grid over a
  cloud-only folder will be slow the first time and empty on a train.
- **The sync client moves things.** Renames and reorganisation happen under
  the app without notice. This is exactly what §2.3's copy-on-use protects
  against, and why linking alone was rejected.

The same reasoning covers Google Drive and Dropbox. If it syncs to a folder,
it works; if it only exists behind an API, it is out of scope.

---

## 4. The asset store

### 4.1 Layout

The Tauri file backend already owns a real, user-visible directory
([storage.js:155](../storage.js)):

```
Documents/Sage Stage/
  sage-stage.json          the state file — atomic writes, fsynced
  backups/
    2026-08-26.json        daily, KEEP_DAILY = 14
    conflict-<ts>.json     when another copy changed the file
  assets/                  ← this design
    a3/
      a3f2c9…d1.jpg
```

`assets/` is named in [storage-abstraction-plan.md §8](storage-abstraction-plan.md)
as reserved, and `erase()` and backup rotation already deliberately skip it.

### 4.2 Content addressing

Filenames are the **SHA-256 of the decoded bytes**, sharded one level by the
first byte so no directory grows past a few thousand entries.

This is not premature cleverness; it earns its place three times:

1. **The same photo used thirty times is stored once.** Class photos on a
   register widget, a name picker and a group board are one file.
2. **Re-importing is idempotent.** A teacher who drags the same folder in
   twice gets no duplicates, and needs no "already imported?" dialog.
3. **Deletion becomes answerable.** "Is this file still needed?" is a
   refcount over state, not a guess. §8 needs this.

Bytes are hashed **after** the normalise-and-downscale step in §9, not before,
so the identity is of what the app actually stores.

### 4.3 `resolveImageSrc()` and the sanitiser — the part §8 missed

§8 of the storage plan specifies one resolver: `data:`/`https:` pass through,
`assets/<name>` becomes a displayable URL (`convertFileSrc()` under Tauri).
That is right, and it is not sufficient, because of something §8 did not
account for.

**Every image sink in the app is already behind `SageSanitize.imageUrl()`**
([sanitize.js:84](../sanitize.js)), which is a strict allow-list:

```js
return (HTTP_SCHEME.test(b) || DATA_IMAGE.test(b)) ? s.trim() : '';
```

An `assets/a3f2…jpg` reference matches neither, so **today the sanitiser would
silently blank every asset reference**, and the widget would render as if the
teacher had removed the picture. Worse, the deny-list used by the template
importer's sweep (`HOSTILE_SCHEME`) explicitly names `blob:` and `file:`, so
the two obvious ways of handing the webview a local file are both already
refused by design — correctly, since those are the schemes a malicious
imported template would reach for.

The resolution, and it must be built this way round:

- `SageSanitize` gains **one** new accepted shape, matched by an anchored
  pattern with no path traversal: `/^assets\/[0-9a-f]{2}\/[0-9a-f]{64}\.(png|jpe?g|gif|webp|avif)$/`.
  It is deliberately not "any relative path" — a content-addressed name is
  a closed vocabulary, which is what makes it safe to allow.
- `resolveImageSrc()` runs **after** the sanitiser, never before, so the
  sanitiser stays the single gate every stored string passes.
- Under Tauri, the resolver calls `convertFileSrc()` on the absolute path;
  in a browser build, an `assets/` name can never occur (§11), and the
  resolver returns a placeholder rather than a broken URL.

`DATA_IMAGE` already permits `avif` alongside png/jpeg/gif/webp/bmp, which is
consistent with the format decision in §9.

### 4.4 What has to change elsewhere

Four invariants, three of them named in §8 and one new:

- **`normalize()` must tolerate a missing file.** A reference whose file is
  gone renders a placeholder. It must never throw, and it must never be
  "helpfully" nulled — a lesson that lost its pictures to a bad restore should
  show that it lost them, not silently look finished.
- **Export must inline.** A JSON backup stays self-contained and
  browser-importable, which means `assets/` refs become data-URLs on the way
  out. **This invariant is in tension with §8's safeguarding position and is an
  open decision — see §14#2.**
- **`erase()` must clear `assets/`.** Today it deliberately skips the folder
  because nothing writes there. Once something does, "delete my data" that
  leaves children's photographs on disk is a broken promise, not a nicety.
- **Backup rotation must not copy assets.** Fourteen daily copies of an image
  store is not a backup strategy, it is a disk leak. Backups stay JSON-only;
  the store is protected by the fact that it is content-addressed and
  re-importable, and by the export path.

---

## 5. Why data-URLs have to stop — the numbers

This is not only about the tester's request. The current representation has a
cost that scales with exactly the thing being asked for.

A 1600px JPEG at the app's quality 0.82 lands around 250 KB. Base64 inflates it
by 4/3, so **≈333 KB per photo inside the state JSON**. One class of thirty:

- **≈10 MB in `sage-stage.json`**, which is serialized and written *whole*, with
  fsync, on a debounce after every change ([storage.js:83](../storage.js)).
  Dragging a widget would rewrite ten megabytes.
- **≈140 MB of backups**, because `maybeDailyBackup()` copies the entire file
  and `KEEP_DAILY = 14`.
- **A serious bite out of the snapshot budget.** `weighWidget()` in
  [snapshots.js:106](../snapshots.js) weighs a non-page widget as
  `JSON.stringify(props).length` — i.e. the full base64 string — against a
  `TOTAL_BUDGET` of 250 MB. A handful of photo-bearing deck snapshots would
  start evicting real undo history.

Moving to `assets/` fixes all three at once: the state file carries a 70-byte
reference, backups stay small, and snapshots weigh a name instead of a picture.

**This means the asset store is not optional even if the library UI is.** It is
the prerequisite, and the honest ordering is: store first, browsing second.

---

## 6. Source folders — picking, remembering, losing

Desktop only (§11). The mechanics are known, not research:

- **Picking** uses the dialog plugin, already a dependency
  ([Cargo.toml](../src-tauri/Cargo.toml)) and already permitted
  (`dialog:default` in [capabilities/default.json](../src-tauri/capabilities/default.json)).
- **Reading** needs the fs scope widened at runtime. Today it is locked to
  `$DOCUMENT/Sage Stage` and nothing else, which is the correct default and
  has to stay the default for everything that isn't an explicitly chosen
  folder.
- **Remembering** across restarts needs `tauri-plugin-persisted-scope`.
  Without it, every launch re-prompts for every folder, which no teacher will
  tolerate more than twice.
- **Displaying** needs `assetProtocol` enabled in `tauri.conf.json` and the CSP
  extended, because the current `img-src` is `'self' data: blob: https:`
  ([tauri.conf.json](../src-tauri/tauri.conf.json)) and admits no local-file
  scheme. Both `asset:` and `http://asset.localhost` are needed, since the two
  platforms differ.

**Store paths, and show them.** The linked-folder list is part of state, and the
"Your data" modal should name every folder the app can read. A teacher — or an
IT lead standing behind them — must be able to answer "what can this thing see?"
without guessing.

**When a folder is gone**, say which one, offer *relink* and *forget*, and never
silently drop it. A folder that is merely offline today is not a folder the
teacher wants deleted from their library.

---

## 7. The two surfaces

One source — the linked folders of §6 — shown two different ways. They are not
the same feature and the difference between them is the design:

- **The Pictures drawer** is a *tool*: the teacher's way of getting an image
  from their folders onto a board. Its output is a copy (§2.3).
- **The gallery widget** is a *view*: a live mirror of a folder, sitting on the
  board where the class can see it. It owns nothing and copies nothing.

### 7.1 The Pictures drawer

Not a modal picker. The app already has exactly one right-hand drawer —
`.bg-drawer`, the background chooser at [style.css:1537](../style.css) — and
Pictures belongs in that family, for one reason: **a drawer can be left open
while you work.** A modal that closes on every pick is a different, worse tool,
and "leave it open and pull things out of it" is what SMART's Gallery tab
actually feels like in use.

Opened from the dock, alongside Background. Contents:

- **Top:** the folder tree — linked roots and their subfolders, as they are on
  disk. Not a tag system, not a database. The teacher's filing *is* the
  organisation and the app does not get an opinion about it. Same instinct as
  the spatial-stability rule for boards: the layout is the craft, and
  rearranging someone's material is a hostile act.
- **Below:** a thumbnail grid, lazily rendered.
- **Recently used** as the default view, because the request began with "images
  I would use often".
- **Search** across filenames only, at first. Anything cleverer is a feature
  with a maintenance cost and no evidence behind it yet.
- **"Browse my computer…"** stays, for the one-off file that lives in no linked
  folder.

**Every `pickImage()` call site opens this same drawer, scoped.** "Replace
image…" in the Image panel, the screen background, the dashboard wallpaper, the
mascot face — all of them open Pictures in a "pick one for this" mode rather
than growing a second grid of their own. The Image settings panel is ~380px
wide; a thumbnail grid inside it would give four cramped columns and a second
piece of UI to keep in sync with the first. One component, every entry point.

Thumbnails are cached in the asset store's own thumbnail directory, keyed by
path + mtime + size, so a large folder is slow exactly once. Cloud placeholders
(§3) show a distinct "not downloaded" state rather than a spinner that never
resolves.

**Drag-to-place does not exist in this app yet.** Widgets arrive by clicking a
dock button and files arrive by dropping on the window; the only `draggable` in
`app.js` is a `'false'` on a money note. Dragging a thumbnail out of the drawer
onto the board is new interaction code — not exotic, but not free, and it should
not be promised as though the machinery were already there. Clicking a thumbnail
to place it must work first and on its own.

### 7.2 The gallery widget — a window, not content

A widget that mirrors a folder, showing its images as thumbnails, live.

This looks like a variation on the drawer and it is a different thing, because
**it is a view onto a folder rather than a picture on a board.** That
distinction resolves what would otherwise be a contradiction with §2.3: a
mirroring widget cannot copy, or it stops mirroring. It does not need to. Being
a window *is* the feature — "show me what is in that folder right now" is the
whole request — and so this is the one place in the design where a live link is
correct, and where a folder that has gone missing showing *"that folder isn't
there any more"* is honest rather than broken. Drag an image **out** of it onto
the board and that copies, exactly as §2.3 says. Window and content, cleanly
separated.

**It also hands §8 a deletion story for free.** A gallery widget pointed at the
class photos folder leaves no copies anywhere: delete the photo from the folder
and it leaves the board. That is the guarantee §8 works hardest to construct,
obtained by the widget simply not owning anything.

Three constraints it inherits rather than chooses:

- **Stable ordering is not optional.** Spatial stability applies to a widget's
  *contents*, not only its position on the screen — a class navigating by memory
  will learn where the volcano picture sits in the grid. Sort by name, never by
  date, and land new files at the end so nothing already placed moves under
  them.
- **Cap it and say so.** A real photo folder is 500 files at 4000×3000. Render
  on scroll, and print "showing the first 200" rather than truncating in
  silence — the no-silent-caps rule.
- **Desktop only**, like everything folder-shaped (§11). In the browser build it
  shows the taster's "this needs the desktop app" state rather than
  half-existing.

Open question for the build, not answerable from here: **what does tapping a
thumbnail do?** Enlarge in place is the obvious classroom answer ("everyone look
at this one"), sending it to a chosen image widget is the obvious authoring
answer, and they may both be wanted. Worth watching a teacher use the drawer
first before deciding.

---

## 8. Pupil photos — the fork

This is the decision that shapes everything else, and it should be made before
a line is written.

The general library treats every picture the same. Pupil photos are not the
same:

- They are **personal data about children**, held by the school under a
  retention policy the app knows nothing about.
- They **turn over annually**. A class photo set is stale in September and
  should be gone, not archived.
- They need a **credible deletion story**. "Remove all photos of this class"
  must actually delete bytes, not just remove references — which is precisely
  what §4.2's refcounting makes answerable.
- Under the export-inlines invariant (§4.4), they would end up **inside a JSON
  file teachers email to each other**. That is the single worst outcome
  available in this design, and it is currently the default behaviour.

Note what §7.2 does to this. A gallery widget mirroring the class photos folder
holds no copies at all, so "delete the photo" is answered by deleting the photo.
That does not settle the fork below — a mirror cannot bind a face to a name, and
the widgets that want photos want *this child's picture* — but it does mean the
**displaying** of pupil photos and the **owning** of them can be separated, and
only the second one carries the hard obligations.

Two candidate shapes:

**(a) One library, with photos as a marked category.** Simplest. Pupil photos
are assets like any other, tagged as personal, with a purge action and an
export that excludes them by default.

**(b) A separate roster feature.** Photos attach to the class list — which
already exists as `state.lists` — rather than living loose in a library. They
are never browsable as free-floating images, they are bound to a named child,
and end-of-year purge is a natural operation on a class rather than a search
across a picture pile.

**Recommendation: (b), and it is not close.** The moment a photo is bound to a
child rather than to a filename, every hard question gets an obvious answer:
what is it, who is it of, when does it expire, who can be told it was deleted.
It also matches how the widgets that want photos actually want them — the name
picker and register want *this child's picture*, not *a picture*.

That makes the tester's two requests genuinely different features:

- "maths images that are not currently on your app" → **the media library**,
  §§2–7, low risk, ship it.
- "the students' photos" → **photos on the class list**, its own design, its own
  safeguarding review, and a conversation with a school before it is built.

This document specifies the first. The second needs its own.

---

## 9. Formats at the door — HEIC, shipped

Already built and committed (`cb73ae8`, 26 August 2026). Recorded here because
it is the first piece of this design and it establishes the pattern.

HEIC is the default on every iPad in a school, and it is a break those schools
already train staff on because it eats blog posts and emails home. Chromium
declines it outright; WKWebView leans on the system decoder and will very
likely render it, which is worse — a HEIC under 400 KB took `pickImage()`'s
small-file fast path and was stored *verbatim*, so a lesson made on a Mac would
open blank on Windows.

**The decision was refuse, not convert.** A bundled decoder means libheif with
its LGPL and HEVC baggage and a per-platform path, for a format the teacher
turns off on the iPad in three taps. What ships instead is a dialog that names
the fix — the built-in offline route first, an online converter second, and an
explicit line asking teachers not to upload photographs of children to a
converter website.

**The pattern this sets for the library: normalise at the door, refuse what
cannot be normalised, and say why in the teacher's own words.** Everything that
enters `assets/` is PNG or JPEG, downscaled and area-capped as `pickImage()`
already does, so nothing downstream — renderer, export, print, snapshot — ever
has to think about formats again.

Two format questions still open, both cheap:

- **SVG.** Genuinely useful for maths diagrams, scales without limit, and is an
  XSS vector if rendered inline. If it is accepted at all it must be rendered
  only via `<img>`, never inlined, and it must pass through `sanitize.js`
  before it is stored. Deferred; nobody has asked yet.
- **Animated GIF.** Accepted as-is (it is already in `DATA_IMAGE`), but a
  looping GIF on a classroom board is a distraction machine. Worth a
  "play once" default rather than a ban.

---

## 10. What can and cannot come from SMART

The tester's existing content is in SMART, and the honest answer is partial.

- **A `.notebook` file is a zip** containing XML and media. Pulling images out
  of one is plausible, and the repo already does exactly this shape of work —
  [pptx-import.js:631](../pptx-import.js) mines media out of a PowerPoint zip
  and builds data-URLs from it. Worth a spike, not a promise.
- **SMART's gallery formats** (`.gallery`, `.galleryitem`, `.gallerycollection`)
  are SMART's own. I would not promise to read them and would not build
  against them.
- **Anything exported as PNG, JPEG or SVG works today**, and that is what to
  tell a teacher asking. Set that expectation in the help page rather than
  letting them discover it.

---

## 11. Platform reach

**Desktop only.** Browsers cannot hold a persistent reference to a folder, and
the browser build must keep working exactly as it does now: `pickImage()` keeps
producing data-URLs, `SageStorage.kind === 'local'` never produces an `assets/`
reference, and `resolveImageSrc()` therefore never sees one.

This is acceptable because the shipping direction is macOS-first for
international schools, and because the browser build's role is the taster, not
the working tool.

**The PWA slot stays reserved.** [Storage plan §8](storage-abstraction-plan.md)
already sketches a File System Access backend for Chromebooks, which is the one
browser context where a persisted directory handle exists. The library would
follow the same interface. Not designed here.

**A lesson that crosses builds** carries data-URLs inward (a browser export
imports into the desktop app fine) and inlined images outward (§4.4). Neither
direction breaks; §14#2 is about whether the outward direction should be
*allowed* to carry photographs, not whether it works.

---

## 12. Spikes before implementation

1. **Drag-and-drop from Finder.** `dragDropEnabled` is `false` in both
   [tauri.conf.json](../src-tauri/tauri.conf.json) and the second-window
   creation in [storage.js](../storage.js) — deliberately, so wry's OS-level
   interception does not eat the `.pptx` and register drop routes. Whether a
   file dropped from Finder still yields usable bytes in that configuration
   needs testing before the picker's most natural gesture is designed around
   it.
2. **Does the dialog plugin widen the fs scope by itself?** Tauri v2's dialog
   plugin is documented as granting access to picked paths; whether that
   survives a restart without `persisted-scope`, and whether it covers a
   *directory* pick recursively, should be proven rather than assumed.
3. **`convertFileSrc` under the real CSP.** Confirm both `asset:` (macOS) and
   `http://asset.localhost` (Windows) render in an `<img>` with the app's
   actual CSP, including inside the second projector window.
4. **A cloud-placeholder folder.** Point the picker at a OneDrive folder with
   Files On-Demand on, offline, and see what the read actually does — hang,
   throw, or return empty. The UI in §7 depends on the answer.
5. **Thumbnail cost on a real folder.** A teacher's actual photo folder, not a
   synthetic one: 500 images, 4000×3000, off an iPad.
6. **Drag-to-place, at all.** There is no internal drag-and-drop in the app
   today (§7.1). Before the drawer's interaction is designed around dragging,
   prove a thumbnail can be dragged onto the board *and* that doing so does not
   collide with the window-level file-drop handler or with widget dragging,
   both of which already own the pointer in that area.

---

## 13. Phasing

**P1 — the store, no UI.** `assets/`, content addressing, the sanitiser shape,
`resolveImageSrc()`, `normalize()` tolerance, `erase()`, export inlining.
`pickImage()` writes to the store instead of returning a data-URL under the
file backend. **No visible feature ships**, and the state file stops carrying
pictures. This is the part §5 says is not optional.

**P2 — linked folders and the Pictures drawer.** §6 and §7.1, click-to-place
only. This is what the tester asked for and the point at which it is worth
telling them.

**P3 — the gallery widget.** §7.2. Depends on nothing in P2 but the linked
folders, and is the piece that makes a folder visible *to the class* rather than
only to the teacher.

**P4 — copy-on-use polish.** Refcounting, an "unused pictures" cleanup, the
"where did this come from" affordance, and drag-to-place if §12#6 says it is
sound.

**P5 — photos on the class list.** Separate design, per §8. Not scheduled by
this document.

P1 is genuinely independent of P2 and pays for itself. If the library is never
built, P1 should still happen.

---

## 14. Open decisions

1. **Pupil photos: library category or roster feature?** §8 recommends the
   roster, strongly. Needs Glenn's call before P1's schema is fixed, because
   refcounting and purge depend on it.

2. **Does export still inline images?** Today the invariant says a backup is
   self-contained, which is right for portability and wrong for a file
   containing photographs of children. Options: keep inlining and exclude
   personal-category assets; ship a paired `.zip` when assets are present; or
   ask at export time. **This blocks nothing in P1 except the export path, but
   it must not be decided by default.**

3. **Is the library free or part of the paid Maths Toolkit?**
   [Licensing](licensing-design.md) scopes one paid bundle at `cat:'maths'`.
   A media library is app-wide infrastructure and my instinct is free — a
   teacher's own content should never be behind a gate — but it is a
   commercial call, not a technical one.

4. **SVG in or out?** §9. Deferred until someone asks.

---

## 15. What to tell the tester now

Not yet — pictures currently go in one at a time and live inside the lesson. A
picture library with their own folders is the next substantial piece, and their
message is why.

Then the question that decides §14#1, which is worth asking before anything is
built:

> Which matters more to you first — your own maths images, or the class photos?
> And where do the photos live at the moment: OneDrive, the machine, or the
> Photos app?
