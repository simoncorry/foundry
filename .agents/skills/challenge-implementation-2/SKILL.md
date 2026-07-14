---
name: challenge-implementation-2
description: 'Round 2 of implementation-challenge.'
---

<!-- Generated from .cursor/commands/challenge-implementation-2.md. Edit there and run: npm run shapes -->

Round 2 of implementation-challenge. Given how much this work matters, trace through the changes again from a different angle. Look for bugs or edge cases that weren't obvious in round 1. Fix what you find.

## Voice

Output prints to the human's chat: follow AGENTS.md § Voice. Pipe substantive drafts through `node scripts/voice-gate.js` and rewrite what it flags.

## Guard: nothing to challenge

If no implementation was made in this conversation, decline with: "No implementation to challenge in this conversation. Make changes first, then run the challenge chain starting with round 1."

## Guard: repeat invocation of round 2

If round 2 already ran earlier in this conversation, treat this invocation as a second pass with a NEW angle. Say it explicitly: "Round 2 invoked twice; treating as a new angle within round 2. Prior round 2 angle was X; this pass uses Y."

## Default angle for this round

**Default: check whether the earlier rounds' fixes broke anything new.** The most reliable way to find round-2 bugs is to ask "did my own round-1 fixes introduce new failure modes?" Re-read every modification made during round 1, not just the original implementation. A fix written under review pressure gets less scrutiny than the code it fixes, which is exactly why this round exists.

If a different angle is clearly more relevant, override the default and say why.

## Inline at the top of your response

1. **Read back your prior turns.** List every angle used so far (original implementation + round 1). Format: `Angles used: [round 0: X], [round 1: Y]`.
2. **Confirm the round-2 angle**: either "using the default for this round: check whether the earlier rounds' fixes broke anything new" OR "overriding the default to [angle]: [reason]". The angle must be different from rounds 0 and 1.

Then re-read each modified file in full surrounding context, paying particular attention to changes made during round 1.

## What to look for

- Every edit round 1 made: does it hold under the inputs the ORIGINAL code handled? Fixes narrow behavior more often than they widen it.
- A fix applied in one place that round 1's own reasoning said applies in two.
- New code paths the fixes introduced: error branches, fallbacks, early returns that nothing exercises.
- Interactions between two round-1 fixes that were each correct alone.
- Anything the round-1 report claimed as verified that a fix then invalidated.

## Useful angles to rotate through

The canonical list lives in AGENTS.md § The challenge rounds: implementation / where data flows and what happens when something fails / how this code talks to its neighbours / how this code talks to outside services / config-file syntax and quoting pitfalls / what unusual or hostile inputs would break this? / what happens when shell scripts fail mid-pipeline? / will this code be discoverable when it feels unfamiliar? / is the sequence of steps right? / where else does the same root cause apply? / check whether the earlier rounds' fixes broke anything new / does this convention reach every place the mechanism reaches?

## Auto-fix bugs found (when K > 0)

Same policy as round 1: fix now via a new commit on the feature branch (no pull request until wrap-up; in no-git mode fix in place and log it). Out-of-scope findings become observations, human-territory bugs defer with `[NEEDS HUMAN-R2: <one-line ask>]`. K counts high-confidence defects only. "Should I fix this?" is the anti-pattern; fix it and report the result.

## Self-check before posting

Same checklist as round 1: line cap (20 source lines; 6-8 when clean), no sub-categorized headers, no count-justifying listings, no bare confidence declarations, no cross-round commentary or forward-looking framing, no jargon-stacked labels.

## End your response with the structured report

> **Re-verified N claims, demoted M to uncertainty.**
> **Bugs found: K. Bugs fixed: K** (or K minus the count deferred via [NEEDS HUMAN-R2] markers).

If M > 0 or unfixed bugs remain, list them with a one-line reason BEFORE declaring done.

## No-rubber-stamp guard

Reaching "no bugs" without genuinely re-reading round 1's own edits is rubber-stamping. If the angle is genuinely exhausted, say so plainly and move on.

## Rationale (recorded so future edits don't drift it)

In the project Foundry grew out of, this round once caught a bug that round 1's own fix had introduced (a boundary ambiguity created when the fix removed outer quote marks). Fixes are code too, written faster and reviewed less than anything else in the change; pointing a whole round at them pays for itself.
