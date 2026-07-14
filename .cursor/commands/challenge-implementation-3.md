Round 3 of implementation-challenge. Are you 200% sure you've covered this from every angle? Trace through the changes again from the round-3 angle. Fix what you find.

## Voice

Output prints to the human's chat: follow AGENTS.md § Voice. Pipe substantive drafts through `node scripts/voice-gate.js` and rewrite what it flags.

## Guard: nothing to challenge

If no implementation was made in this conversation, decline with: "No implementation to challenge in this conversation. Make changes first, then run the challenge chain starting with round 1."

## Guard: repeat invocation of round 3

If round 3 already ran earlier in this conversation, treat this invocation as a second pass with a NEW angle. Say it explicitly: "Round 3 invoked twice; treating as a new angle within round 3. Prior round 3 angle was X; this pass uses Y."

## Default angle for this round

**Default: how this code talks to its neighbours.** The highest-severity catches at this depth are places where two pieces of code disagree about a shape, an argument order, or a return value: unit tests pass, each piece looks right alone, and the seam between them is silently broken.

If a different angle is clearly more relevant, override the default and say why.

## Inline at the top of your response

1. **Read back your prior turns.** List every angle used so far (original implementation + rounds 1-2). Format: `Angles used: [round 0: X], [round 1: Y], [round 2: Z]`.
2. **Confirm the round-3 angle**: either "using the default for this round: how this code talks to its neighbours" OR "overriding the default to [angle]: [reason]". The angle must be different from rounds 0-2.

Then re-read each modified file in full surrounding context and trace every seam.

## What to look for

- Places where two pieces of code disagree about a shape, an argument order, or a return value.
- A function and its caller out of step: signatures, return shapes, error behavior.
- Constants that should agree across files but might not (status strings, exit codes, message types).
- Data handed from one module to another: does the reader expect exactly what the writer produces, including the empty and error cases?
- Callers of every changed function you did NOT modify: do they still hold?
- Anything that reads a file, format, or convention this change altered.

## Useful angles to rotate through

The canonical list lives in AGENTS.md § The challenge rounds: implementation / where data flows and what happens when something fails / how this code talks to its neighbours / how this code talks to outside services / config-file syntax and quoting pitfalls / what unusual or hostile inputs would break this? / what happens when shell scripts fail mid-pipeline? / will this code be discoverable when it feels unfamiliar? / is the sequence of steps right? / where else does the same root cause apply? / check whether the earlier rounds' fixes broke anything new / does this convention reach every place the mechanism reaches?

## Auto-fix bugs found (when K > 0)

Same policy as round 1: fix now via a new commit on the feature branch (no pull request until wrap-up; in no-git mode fix in place and log it). Out-of-scope findings become observations, human-territory bugs defer with `[NEEDS HUMAN-R3: <one-line ask>]`. K counts high-confidence defects only. Fix it and report the result; never ask whether to fix.

## Self-check before posting

Same checklist as round 1: line cap (20 source lines; 6-8 when clean), no sub-categorized headers, no count-justifying listings, no bare confidence declarations, no cross-round commentary or forward-looking framing, no jargon-stacked labels.

## End your response with the structured report

> **Re-verified N claims, demoted M to uncertainty.**
> **Bugs found: K. Bugs fixed: K** (or K minus the count deferred via [NEEDS HUMAN-R3] markers).

If M > 0 or unfixed bugs remain, list them with a one-line reason BEFORE declaring done.

## No-rubber-stamp guard

Reaching "no bugs" without actually walking the seams (callers, readers, siblings) is rubber-stamping. If the angle is genuinely exhausted, say so plainly.

## Rationale (recorded so future edits don't drift it)

In the project Foundry grew out of, this round caught a function-and-caller mismatch that silently disabled an entire earlier fix: the pattern tests passed, the mocked tests passed, and production was quietly broken. Only tracing how the pieces talk to each other revealed it. That single catch is why the neighbours angle owns a whole round.
