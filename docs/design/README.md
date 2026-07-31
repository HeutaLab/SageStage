# docs/design — design canvases, kept where they cannot be lost

Claude Design projects live on claude.ai. A previous session lost one, which cost real
work and real annoyance. **Anything that matters gets pulled down here and committed**,
because a design that exists only behind a login is a design one bad afternoon from gone.

## Classroom Lesson Board

- **File:** `Classroom Lesson Board.dc.html` — open it in a browser; it is self-contained
  apart from `support.js` beside it (the generated `dc-runtime` viewer) and the Nunito
  webfont, which it pulls from Google Fonts. Without a network it still reads; only the
  typeface changes.
- **Source project:** "Teacher classroom application mockups"
  · `0d321449-044d-4b2a-97ab-052ca7606744`
- **Pulled down:** 2026-07-31, via the `DesignSync` tool.
- **Re-sync:** `DesignSync { method: "list_files" | "get_file", projectId: "0d321449-…" }`.
  The project is still writable by Glenn, so it can be refreshed — but this copy is the
  one that survives.

### What it is

A design exploration titled **"Modelling board — I do · we do · you do"**, and its own
subtitle says the important thing: *built on your Story Map screens*. It reuses chrome that
now exists in the app — the dark board frame, the Story Map card, the
Model · Together · Over-to-you bar, the word bank, boxing-up paper and the emotion graph.

One turn, seven options, all mix-and-match rather than alternatives:

| | |
|---|---|
| **1a** | The lesson end to end, clickable — stage pills, help dial, catching a word, covering the bank, names in the tray, finishing into Review |
| **1b** | The teacher's tablet: a remote for the board carrying everything the class must not see, plus one hand-over button that states exactly what is about to change |
| **1c** | Three input models for catching a word — pick one per teacher, or let the board decide by whether it is touch |
| **1d** | How much should be on the board? The teaching board, against the same lesson after one tap on **Calm board** — what a child looks up at while writing |
| **1e** | The same board run by a TA with an EAL group: amber chrome so nobody mistakes it for the class board, help pinned to Everything, pictures on every word, first language allowed on the way in |
| **1f** | Emotion graph for upper KS2 with more than one character — tap a name to arm it, the rest dim rather than disappear so the class can see arcs cross |
| **1g** | Three ways to signal where you are in the release; all three drive the same state, only what the room reads at a glance changes |

The two ideas the header argues hardest for:

- **One dial runs the lesson.** *How much help is on* sits in the stage bar, moves itself
  when the stage changes, and can be dragged back. It is the single control that covers the
  word bank, shrinks the criteria and hides the model — **so scaffolds never fade by
  accident.**
- **Catch the brilliance.** The word panel is live in every stage and records *who said it*.
  A word offered at 10:42 by a named child is in the bank, on the board with her name on it,
  and in tomorrow's plan by the time she sits down.

See `classroom-lesson-board-vs-shipped.md` for how each of these lands against what the
story map actually does today.

### `uploads/` — PARTIAL, and here is why

Six screenshots Glenn dragged into the design project. The API caps a single file read at
256 KiB of base64, and every one of these is larger, so what came back was clipped
mid-image — all six arrived as exactly 196,608 bytes with no PNG terminator.

They have been **re-encoded as valid PNGs of the rows that survived**, so they open and show
the top of each shot rather than failing to decode at all:

| file | kept | of |
|---|---|---|
| `…12.10.25.png` | 831 rows | 1734 (47%) |
| `…12.10.35.png` | 1211 rows | 1730 (70%) |
| `…12.11.13.png` | 742 rows | 1388 (53%) |
| `…12.11.22.png` | 982 rows | 1434 (68%) |
| `…12.11.33.png` | 922 rows | 1532 (60%) |
| `…12.11.47.png` | 671 rows | 1514 (44%) |

They are screenshots of the app, so the originals are reproducible by taking them again —
unlike the design document, which is not. If the full images matter, re-export them from the
design project directly rather than through this route.
