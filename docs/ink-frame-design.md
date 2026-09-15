# The ink frame — annotating anything, and getting it into a deck

Designed with Glenn, 2026-09-15, from his ask: *"get the annotation feature working on
all screens as a pop-out windowed widget with tools to screenshot the webpage beneath
the annotation and to save the screenshot as an image to the deck."*

**Companion documents:** [Desktop ink](desktop-ink-design.md) (the 0.2.0 overlay this
grows out of, and whose §0 "no screenshot, ever" this supersedes) ·
[Updater](updater-design.md) (§3 sets the schema rules this obeys) ·
[Media library](media-library-design.md) (§5 is the asset store this writes into) ·
[Licensing](licensing-design.md) · [Go to market](go-to-market-checklist.md) (the
Developer ID line item that gates half of this)

## 0. What it is, and the lines it must not cross

A transparent, always-on-top **frame** the teacher drags over anything — a webpage, a
slideshow, a PDF — and inks inside. Its edge is the boundary: ink within it, and the
rest of the screen behaves as if the frame were not there. A screenshot dropped into
the frame turns it into a picture that can be blurred, magnified, cropped and then
**saved as a new screen at the end of a deck of the teacher's choosing.**

Lines, carried forward from the overlay and added to:

- **The frame never writes to the deck file.** It has no save path of its own. When the
  teacher presses Save it *asks the board window* to do the writing, because the board
  owns the real state and the only write path. See §4.
- **Nothing already arranged ever moves.** A saved picture becomes a *new* screen at the
  end of the deck, never a widget dropped onto a screen a class already knows. The
  layout is the craft.
- **No permission is requested on macOS in this version.** §1 explains why that is not
  timidity but arithmetic.
- **Desktop only.** A web page cannot paint outside its own tab; the browser build and
  the taster never show any of this.

## 1. What macOS actually permits — the spike of 15 September

The overlay's design asserted that capturing what is behind the ink would need Screen
Recording permission, "a frightening prompt on a managed school Mac", and refused it on
that basis. Glenn asked for the capture anyway, so the assertion was tested rather than
inherited. A throwaway ad-hoc-signed app (`InkShot`, source kept out of the repo) was
run on Glenn's Mac under macOS 26, launched through LaunchServices so it carried its own
TCC identity rather than the terminal's.

| question | answer |
|---|---|
| `CGWindowListCreateImage`, the classic route | **removed from the SDK**, not merely deprecated. ScreenCaptureKit only |
| capture with permission, ad-hoc signed | **works** — a real 1470×956 grab, 33 windows visible |
| capture without permission | refused, `SCStreamError -3801` |
| `screencapture -x` from inside the app | refused, exit 1 |
| `screencapture -i` (the crosshair) from inside the app | **crosshair appears, the selection completes, and nothing is written** — exit 1, zero bytes |
| does a faceless helper get the permission dialog? | **no.** A windowed app does |
| does an unpermissioned app appear in the Screen Recording list? | **no.** It must be added by hand with the **+** button |
| does the grant survive an update? | **no.** One changed string, re-signed ad-hoc, and it was revoked instantly |
| the re-grant dialog | has no Allow button — only "Open System Settings" and "Deny" |

Two conclusions follow, and they decide this design.

**First, the blocker is the signature, not the capability.** Capture works fine unsigned;
what does not work is *keeping* the permission. macOS keys the grant to the code
identity, an ad-hoc signature changes with every build, and Sage Stage now updates
itself silently — which was the whole achievement of 0.3.0. A capture button would
therefore break for all twenty-two testers on every release, and the dialog they would
meet does not even offer them a way to say yes. That is not a feature, it is a support
burden. A Developer ID signature fixes it at the root, because TCC then keys on a stable
team identity and stops caring that the bytes changed.

**Second, and more usefully: the teacher's own screenshot is not affected at all.** The
distinction is *who is asking*. When the teacher presses Cmd+Control+Shift+4, no
application requested a capture, so there is nothing to police and the image lands on
the clipboard, where any app may read it without permission. When Sage Stage asks the
same system tool to do the same job, the request is attributed to Sage Stage and the
pixels are withheld — which is exactly why the crosshair appears and then nothing
happens. So a pill button that *presses the shortcut for you* is off the table on macOS
(synthesising keys needs Accessibility, a larger permission with the same update
problem), while the teacher pressing it themselves works perfectly, today, forever.

**Windows has no equivalent gate.** No permission is required to capture the screen, so
there the button works immediately and directly, photographing the frame's own
rectangle in one press with no crosshair to draw. Untestable from a Mac; ships as
designed-but-unproven, the same terms as the overlay did.

## 2. The frame

### 2.1 Shape and placing

The `desktop-ink` window stops being the size of the display and becomes a rectangle the
teacher places. It is still transparent, borderless, always on top, and still a
non-activating `SageInkPanel` — everything [desktop-ink-design.md §2.5.1](desktop-ink-design.md)
established about sitting over another app's fullscreen Space is unchanged and must not
be disturbed.

Because a borderless window gets no titlebar from macOS and no edge resizing, the frame
draws its own chrome: a thin edge, a grab strip along the top, and corner handles. It
also gains `resizable(true)`, and the JS moves and resizes it through
`setPosition`/`setSize` — which need `core:window:allow-set-position` and
`core:window:allow-set-size` adding to `capabilities/default.json`.

**Tap to reposition.** Dragging inside the frame means *draw*, so it cannot also mean
*move*. Tapping the edge strip flips the frame into **place mode**: corner handles
appear, the ink dims so the teacher can see what they are aiming at, and the whole
rectangle drags. Tapping again returns to drawing. This is a mode with a visible state,
not a modifier key to remember.

Size and position are remembered between openings in the ink window's own
`localStorage` — never in the deck file, which would break the promise in §0. It opens
on the display the board is on and may be dragged to any other, which is what "works on
all screens" amounts to for a window.

### 2.2 Two states, because two of the tools need pixels

Blur and magnifier both need to know what is underneath, and a transparent window does
not. They are therefore not live tools. The frame has two states and the toolset
divides across them:

| state | what the frame is | tools available |
|---|---|---|
| **see-through** | ink floating over the real screen | pen, highlighter, shapes, bin, undo, clear |
| **holding a picture** | a screenshot fills the frame | all of the above, plus blur, magnifier, snip |

The bridge between them is the clipboard. The teacher presses Cmd+Control+Shift+4 (or,
on Windows, the pill's own button), drags over the region, and the shot becomes the
frame's backdrop — ink and all, because the system photographs the composited screen
including our overlay. From that moment blur and magnifier have something to work on,
**snip** means crop, and Save has a finished picture to send to the deck.

The paste arrives through the webview's ordinary `paste` event, so no clipboard plugin
and no new Rust dependency. The pill also offers a **Paste shot** button that tries
`navigator.clipboard.read()` first and falls back to telling the teacher to press
Cmd+V — because a button that silently does nothing is this repo's recurring desktop
bug and is not getting a new member.

**Observed 15 Sep, first build:** the button's `clipboard.read()` does work, but macOS
answers it with its own small **Paste** confirmation button, because an app reading the
pasteboard without a paste gesture is precisely what that prompt exists to police. A
real Cmd+V raises no prompt at all. So the button is the two-click path and Cmd+V is the
one-key path; both are offered and the toast says so. Reading the pasteboard natively
from Rust would not avoid it — it is the read that is policed, not the API.

When the Developer ID lands, one button replaces the teacher's keystroke and **nothing
else in this design changes**: the same backdrop, the same tools, the same save path.

## 3. The tools

The board's annotation layer already provides pen, highlighter, shapes, eraser, select,
undo/redo and a colour and width picker; the frame reuses it rather than growing a
second drawing engine. What is genuinely new:

- **Opacity**, on pen and on shapes. `ink` today is `{ tool, shape, color, size }`; it
  gains `alpha`.
- **Fill** for shapes, alongside the existing stroke; shapes gain `fill` and `fillAlpha`.
- **Blur** — a region tool, over a picture only. Drawn as a rounded rect whose contents
  are the backdrop redrawn through a canvas `filter: blur()`.
- **Magnifier** — a circle showing the backdrop beneath it scaled up, with a ring. Over a
  picture only.
- **Snip** — crop the picture to a sub-rectangle. Over a picture only.
- **Bin** — deletes the selected annotation. The select tool and `removeSelected()`
  already exist; the bin is a visible button for what Delete does today.

The pill therefore carries: **Pen** (colour, width, opacity) · **Highlighter** (colour,
width) · **Shapes** (fill, stroke, opacity) · **Blur** · **Magnifier** · **Snip** ·
**Bin** · **Undo** · **Clear** · **deck chooser** · **Save** · **Exit**, with the
picture-only tools visibly disabled until a picture is in the frame, and a one-line
explanation of what they are waiting for.

## 4. Saving into a deck, and who is allowed to write

The ink window's `save()` still returns immediately — that single guard is what makes
"the frame never writes" true, and it stays.

Pressing Save therefore emits `sage:ink-save { png, deckId }` to the board window. The
board:

1. writes the bytes through the existing asset store — `putAsset(bytes, 'png')`, which
   names the file by the hash of its contents, so saving the same picture twice is free;
2. appends a **new screen at the end** of the chosen deck;
3. puts one `image` widget on it, `src` set to the `assets/<2 hex>/<64 hex>.png`
   reference, sized to fit the screen's usable area;
4. saves, exactly as any other edit does, and toasts which deck it went to.

The deck chooser on the pill lists the teacher's decks and defaults to the active one.
The board is not brought forward and the teacher is not navigated anywhere: the picture
is waiting when they next open that deck.

## 5. Schema and compatibility

The updater design's rules for 0.4.0 are: add fields, never restructure; pictures to
`assets/` by hash, never inline; and a 0.3.x file opened by 0.4.0, and a 0.4.0 file
opened by 0.3.x, both lose nothing.

A saved picture introduces **no new shape at all** — a screen with an `image` widget
whose `src` is an `assets/` reference is what the media library already produces. Fully
compatible in both directions.

The one wrinkle is §3's `alpha` and `fill`, because the same tools serve the board's
Annotate button, where strokes *are* saved. They are additive, so nothing is lost, but a
0.3.x copy opening a deck containing a half-opacity stroke would draw it solid. That is
a visual difference rather than data loss, and testers auto-update now, so the window in
which it could be seen is short. Recorded here so it is not reported later as a bug.

## 6. Build order

**Pass one — the frame and the live tools.** Placing, resizing, tap-to-reposition, the
two-state machinery with the clipboard backdrop, pen/highlighter/shapes with opacity and
fill, bin, the deck chooser, and the whole save-to-deck pipeline. Usable on its own: a
teacher can annotate a webpage, press Cmd+Control+Shift+4, and have the result land in a
deck.

**Pass two — the picture tools.** Blur, magnifier, snip, operating on the backdrop.
They appear in the draw bar only inside the frame and only once a picture is in it,
because offering them over a see-through window would be offering nothing. All three
live in the same array as every stroke, so undo, redo, select and the bin apply to them
without knowing what they are. Blur crops the picture with a margin and clips the result
back, or the filter runs out of picture and leaves a pale halo. The magnifier draws a
scaled crop inside an ellipse with a ring. **Snip is not a mark but a statement about the
export**: only one may exist, a second replaces the first, it dims everything outside
itself for the teacher, and it is never painted into the picture it is cropping.

**Pass three — direct capture**, the day a Developer ID signature exists. On Windows,
pass three can land with pass one, since nothing gates it there.

## 7. Verification

No automated tests in this project; verification means exercising it, and on the native
side through the loop recorded in the desktop-verification memory:

- **The browser tab** for everything that is JS: `.desktop-mock.html` exercises the frame
  chrome, the two states, a pasted picture, every tool, and the `sage:ink-save` event,
  with the mock standing in for Rust.
- **The real binary** under environment hooks in the shape of the existing
  `SAGE_INK_*` family, with the window-server list (`CGWindowListCopyWindowInfo`) to
  prove the frame's geometry and that it still sits over another app's fullscreen Space,
  and `screencapture` for evidence.
- **The save path** proved by a real picture landing as a new screen in a named deck,
  with the state file's mtime before and after, and the asset file present on disk.
- **Windows**: a checklist in the release notes for Glenn or a tester, covering the
  frame, the pill's capture button, and that nothing odd appears on the taskbar.

## 8. Deferred, and the open question

- **Direct capture on macOS** until a Developer ID signature exists. This design is the
  strongest argument yet for that line on the go-to-market checklist: it is the only
  thing standing between the Mac and the complete feature.
- **A pill button that presses the shortcut for the teacher on macOS** — needs
  Accessibility, a larger permission with the identical update problem. Windows gets the
  button; the Mac gets a line of instruction.
- **Live blur and live magnification**, for the same reason as capture.
- **Open:** whether the frame should be offered on the board as well, so a teacher can
  blur or magnify part of a screen they have built. It costs little once the picture
  tools exist, but it is not what was asked for and is not in these three passes.
