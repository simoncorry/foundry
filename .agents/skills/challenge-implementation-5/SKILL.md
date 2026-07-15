---
name: 'challenge-implementation-5'
description: 'Round 5 of implementation-challenge.'
---

<!-- Generated from .cursor/commands/challenge-implementation-5.md. Edit there and run: npm run shapes -->

Round 5 of implementation-challenge. Final-pass deep audit. Are you 200% sure you've covered this from every angle and fixed every bug? If not, keep tracing. Fix what you find.

## Voice

Output prints to the human's chat: follow AGENTS.md § Voice. Pipe substantive drafts through `node scripts/voice-gate.js` and rewrite what it flags.

## Guard: nothing to challenge

If no implementation was made in this conversation, decline with: "No implementation to challenge in this conversation. Make changes first, then run the challenge chain starting with round 1."

## Guard: invoked without rounds 1-4

If rounds 1 through 4 haven't run in this conversation (check by reading back prior turns for "Round N of implementation-challenge" markers), start there instead: their angles find bugs more cheaply. Decline and point at round 1.

## Guard: repeat invocation of round 5

If round 5 already ran, treat this invocation as a second pass with a NEW less-obvious angle. Say it explicitly.

## Round 5 is appropriate when

- Any prior round found bugs (the angle space hasn't converged; late-round bugs especially).
- The work is production-impacting: user-facing, persistence-touching, security-touching, external-service-touching.
- The implementation crosses three or more systems or files.
- You explicitly want a final step-back sweep before shipping.

If none of those apply AND prior rounds came back clean, round 5 is likely overkill; declare that plainly instead of fabricating findings.

## Default angle for this round

**Default: over-engineering check and simpler solutions.** After rounds 1-4 caught correctness bugs from rotated angles, round 5 steps back and asks: is this whole implementation simpler than I made it? Are there cuts the prior rounds missed because they were hunting correctness rather than minimal scope?

**The lens for this round, inlined so the round is self-contained.** Essential complexity is inherent to the problem; accidental complexity is everything added on top: wrappers around one-off cases, defensive guards on inputs already validated upstream, generic machinery for a single caller. Three quick tests: does this code have a concrete user story today? Is it simple enough to have obviously no deficiencies, rather than complex enough to have no obvious deficiencies? And if shared code takes a flag so different callers can opt in or out, the abstraction is wrong; inline it back. (Brooks 1986, Wirth 1995, Hoare 1980, Metz 2016.) Deeper treatment, with the full sources and worked tests, lives at docs/wiki/engineering/overview.md.

Look for:

- **Code-path inflation**: branches for problems that can't happen; failure modes the upstream layer already prevents.
- **Premature abstraction**: a helper with one caller, a config with one value, a dispatch table with one entry.
- **File-count inflation**: would this work in fewer files, fewer steps, fewer commits?
- **Belt-and-braces redundancy**: two checks answering the same question the same way (two checks with DIFFERENT blind spots are coverage, not waste; check before cutting).
- **Stale branches**: code written for a mid-build design that later steps replaced.
- **Comments that narrate the obvious** instead of carrying intent the code can't.

## Inline at the top of your response

1. **Read back your prior turns.** List every angle used so far (original implementation + rounds 1-4). Format: `Angles used: [round 0: V], [round 1: W], [round 2: X], [round 3: Y], [round 4: Z]`.
2. **Confirm the round-5 angle**: either "using the default for this round: over-engineering check and simpler solutions" OR "overriding the default to [angle]: [reason]".

## Auto-fix bugs found (when K > 0)

Same policy as round 1: fix now via a new commit on the feature branch (no pull request until wrap-up; in no-git mode fix in place and log it). Out-of-scope findings become observations, human-territory bugs defer with `[NEEDS HUMAN-R5: <one-line ask>]`. K counts high-confidence defects only; a cut that changes behavior needs the same confidence bar as a fix.

## Self-check before posting

Same checklist as round 1: line cap (20 source lines; 6-8 when clean), no sub-categorized headers, no count-justifying listings, no bare confidence declarations, no cross-round commentary or forward-looking framing, no jargon-stacked labels.

## End your response with the structured report

> **Re-verified N claims, demoted M to uncertainty.**
> **Bugs found: K. Bugs fixed: K** (or K minus the count deferred via [NEEDS HUMAN-R5] markers).

If M > 0 or unfixed bugs remain, list them with a one-line reason BEFORE declaring done.

## No-rubber-stamp guard

Reaching "no findings" without actually hunting the patterns in the bullet list (grep for the one-caller helper, re-read the guards against what upstream already validates) is rubber-stamping. If genuinely exhausted, close with the angles cited by name: "I've used angles A, B, C, D, E and can't find a sixth that isn't a re-skin. Confidence in the implementation is earned after five rounds of genuine rotation." A confidence claim without cited angles is the lazy kind; don't write it.

## Self-confidence check (the not-yet-exhausted branch)

After the count line, ask honestly: "Am I confident the work is sound, or am I stopping because we hit round 5?" If not confident, run additional rounds without asking the human (AGENTS.md § The flow guarantee). Rounds 6 and beyond follow the rounds 1-4 template with a NEW angle from the list, stated at the top, same auto-fix policy. Stop on either signal: two consecutive clean rounds with genuinely different angles, or reaching round 8 (auto-stop with a one-line note naming the last angle; the human can always invoke more manually). Reaching for an already-used angle is itself the stop signal.

## Rationale (recorded so future edits don't drift it)

The step-back lives at the end of the chain because over-building accumulates DURING review: every round's fixes add guards, and nobody asks whether the sum is still right-sized. The two-clean-rounds stop rule and the round-8 cap exist because self-extension without a stop condition turns diligence into stalling; the cap number comes from the angle list being two-thirds spent by then.
