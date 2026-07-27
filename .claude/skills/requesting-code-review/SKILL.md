---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before considering work done to verify it meets requirements
---

# Requesting Code Review

Dispatch a code reviewer subagent to catch issues before they cascade. The reviewer gets precisely crafted context for evaluation — never your session's history. This keeps the reviewer focused on the work product, not your thought process, and preserves your own context for continued work.

**Core principle:** Review early, review often.

**Note:** This project is not a git repository, so review scope is defined by files/functions touched rather than commit SHAs. If a git repo is set up later, prefer diffing by SHA (`git diff BASE..HEAD`) — it's more precise.

## When to Request Review

**Mandatory:**
- After completing a major feature or widget
- Before treating a multi-step change as done

**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing a complex bug

## How to Request

**1. Identify the review scope:**

List exactly what changed: the file paths touched, and a one-line description of what changed in each (e.g. "app.js: added `renderNumberLine()` and wired it into the widget registry"). If this project becomes a git repo later, `git diff --stat` can generate this list instead.

**2. Dispatch a reviewer subagent:**

Use the Agent tool (subagent_type: general-purpose, or code-reviewer if available) filling the template at [code-reviewer.md](code-reviewer.md).

**Placeholders:**
- `{DESCRIPTION}` - Brief summary of what you built
- `{PLAN_OR_REQUIREMENTS}` - What it should do (spec file, task text, or requirements)
- `{FILES_CHANGED}` - The file paths touched and what changed in each

**3. Act on feedback:**
- Fix Critical issues immediately
- Fix Important issues before proceeding
- Note Minor issues for later
- Push back if reviewer is wrong (with reasoning) — see the receiving-code-review skill for how to handle this

## Example

```
[Just finished adding the Rekenrek widget's drag interaction]

You: Let me request code review before calling this done.

FILES_CHANGED:
  - app.js: added dragRekenrekBead(), wired into widget pointer handlers
  - style.css: new .rekenrek-bead drag-state classes

[Dispatch reviewer subagent]
  DESCRIPTION: Drag-to-move interaction for the Rekenrek bead rack
  PLAN_OR_REQUIREMENTS: docs/rekenrek-design.md
  FILES_CHANGED: (as above)

[Subagent returns]:
  Strengths: Clean event handling, touch and mouse both covered
  Issues:
    Important: No handling for drag released outside the rack bounds
    Minor: Magic number (40) for snap threshold
  Assessment: Ready with fixes

You: [Fix the out-of-bounds drag case]
```

## Red Flags

**Never:**
- Skip review because "it's simple"
- Ignore Critical issues
- Proceed with unfixed Important issues
- Argue with valid technical feedback

**If reviewer wrong:**
- Push back with technical reasoning
- Show code/behavior that proves it works
- Request clarification

See template at: [code-reviewer.md](code-reviewer.md)
