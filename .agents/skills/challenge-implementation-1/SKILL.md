---
name: challenge-implementation-1
description: 'Round 1 of implementation-challenge.'
---

<!-- Generated from .cursor/commands/challenge-implementation-1.md. Edit there and run: npm run shapes -->

Round 1 of implementation-challenge. Trace through the changes you just made and look for bugs or edge cases that weren't obvious. Aim for a thorough audit, not a quick scan. Fix what you find; don't just surface it.

## Voice

Output prints to the human's chat: follow AGENTS.md § Voice. Pipe substantive drafts through `node scripts/voice-gate.js` and rewrite what it flags.

## Guard: nothing to challenge

If no implementation was made in this conversation (no code edits, no file writes by the agent), decline with: "No implementation to challenge in this conversation. Make changes first, then run the challenge chain starting with round 1." Don't invent imaginary changes to challenge.

## Guard: repeat invocation of round 1

If round 1 already ran earlier in this conversation, treat this invocation as a second pass with a NEW angle from the angle list. Say it explicitly: "Round 1 invoked twice; treating as a new angle within round 1. Prior round 1 angle was X; this pass uses Y."

## Default angle for this round

**Default: where else does the same root cause apply?** The cheapest angle to apply, and it catches the duplicated-constant class of bug that simple tests miss. When you fix something in one place, ask: where else does the same kind of mistake live, and does my fix need to apply there too?

If a different angle is clearly more relevant to the work being audited, override the default and say why. Don't override just because the default feels less interesting; it's the default because it has the highest catch rate of any opening angle.

## Inline at the top of your response

1. **Say what angle you used while implementing** (e.g., "happy-path correctness", "test-driven", "diff-minimal"). One line.
2. **Confirm the round-1 angle**: either "using the default for this round: where else does the same root cause apply?" OR "overriding the default to [angle]: [reason]". The angle must be different from your implementation angle.
3. **Read the plan's Deviations section first** (in the `docs/plans/` file, written during build-it). Each entry is a place the implementation left the challenged plan, which means it carries the least review coverage of anything in the diff; treat every entry as a prime re-verification target. If the section is absent or empty, say so in one line and move on.

Then re-read each modified file in full surrounding context; don't trust the diff. Diffs hide breakage on adjacent lines.

## What to look for

- **Where else does the same root cause apply?** (default angle): when you fixed something in one place, grep every file for the same term or pattern. Duplicates hide in sibling files and adjacent paragraphs of the same doc.
- Code paths not traced through to the leaf: every branch, every callback, every error return.
- Consumers of every changed function or symbol: grep for callers, including tests and scripts.
- Error and exception branches: what happens when each call fails, returns null, throws, or times out.
- Two places that used to agree but might have fallen out of sync: duplicate constants that now disagree, two functions computing the same thing differently.
- Adjacent files in the same directory that weren't touched but probably should have been.
- What the diff hides: breakage on the lines just above and below the patch.
- Cleanup paths: does the new code register listeners, timers, or resources that need teardown? Where's the teardown?
- Async and lifecycle edges: what if execution is interrupted mid-await, the user navigates away, the connection drops mid-request.
- **Tests written earlier in this chain**: judge whether they are meaningful, not just whether the code is right. A test that passes without exercising the new behavior, or that recomputes the expected value with the same logic the implementation uses, proves the code agrees with itself, not that it's correct. Flag it and rewrite it to assert the intended behavior with a concrete value.

## Useful angles to rotate through

The canonical list lives in AGENTS.md § The challenge rounds: implementation / where data flows and what happens when something fails / how this code talks to its neighbours / how this code talks to outside services / config-file syntax and quoting pitfalls / what unusual or hostile inputs would break this? / what happens when shell scripts fail mid-pipeline? / will this code be discoverable when it feels unfamiliar? / is the sequence of steps right? / where else does the same root cause apply? / check whether the earlier rounds' fixes broke anything new / does this convention reach every place the mechanism reaches?

## Auto-fix bugs found (when K > 0)

If you find bugs, fix them; don't surface and wait for approval.

**Fix policy:**

- During the chain (no pull request open yet): fix via a new commit on the feature branch and push. Do NOT open a pull request; that's wrap-up's job. In no-git mode, fix in place and log the fix.
- Bug in uncommitted changes: fix inline, include in the current commit.
- Bug OUT OF SCOPE for this work (different files, different domain): don't auto-fix. Surface as an observation ("Out-of-scope finding from round 1: [description]; recommend a follow-up plan."). This keeps review chains from becoming kitchen-sink changes.
- Bug needs an architectural decision or the human's input: defer ONLY with an explicit `[NEEDS HUMAN-R1: <one-line ask>]` marker in the bug list, translated to plain English in chat.

**Bug-confidence threshold:** K counts HIGH-CONFIDENCE bugs only: real defects, broken behavior, fabricated claims, broken cross-references. Stylistic preferences, would-be-nicer suggestions, and could-be-better refactorings are observations, not bugs; don't count them, don't auto-fix them.

**Anti-pattern:** if you catch yourself typing "should I fix this?" or "options: (a)...(b)...", stop. The default action is FIX IT NOW. Surface the result, not the question. Every bug ends FIXED or EXPLICITLY DEFERRED with a marker; "surfaced only" is not an outcome.

## Self-check before posting

- Line cap: over 20 source lines means rewrite (6-8 lines when nothing was found).
- No sub-categorized findings headers. One flat list or none.
- No count-justifying listings, no bare confidence declarations, no cross-round commentary, no forward-looking framing, no jargon-stacked labels.

If you find a violation, rewrite. Don't ship it with a note.

## End your response with the structured report

> **Re-verified N claims, demoted M to uncertainty.**
> **Bugs found: K. Bugs fixed: K** (or K minus the count deferred via [NEEDS HUMAN-R1] markers).

If M > 0 or unfixed bugs remain, list them with a one-line reason BEFORE declaring done.

## No-rubber-stamp guard

Reaching "no bugs" without genuinely tracing the default angle is rubber-stamping. Trace harder from the SAME angle before moving on; escalating to round 2 is for when this angle is genuinely exhausted. If it is, say so plainly: "Round-1 default angle genuinely traced; no findings."

## Rationale (recorded so future edits don't drift it)

The root-cause angle opens the chain because it's the cheapest to run and the highest-yield: the same mistake almost always lives in more than one place, and the diff only shows the place you already found. The Deviations read exists because deviations are, by definition, the parts of the work no plan review ever saw.
