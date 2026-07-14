---
name: challenge-plan-2
description: "Round 2 of plan-challenge."
---

<!-- Generated from .cursor/commands/challenge-plan-2.md. Edit there and run: npm run shapes -->

Round 2 of plan-challenge. Given how much this matters, trace through the plan again from a different angle. Be sure you've done all the research and followed every thread. Look for opportunities you might be missing.

## Voice

Output prints to the human's chat: follow AGENTS.md § Voice. Pipe substantive drafts through `node scripts/voice-gate.js` and rewrite what it flags.

## Guard: nothing to challenge

If no plan was presented in this conversation (no construct-the-plan run, no inline plan content, no plan file referenced), decline with: "No plan to challenge in this conversation. Draft one first with construct-the-plan, write the plan inline above this command, or name a plan file." Don't invent an imaginary plan to challenge.

## Guard: repeat invocation of round 2

If round 2 already ran earlier in this conversation, treat this invocation as a second pass of round 2 with a NEW angle. Say it explicitly: "Round 2 invoked twice; treating as a new angle within round 2. Prior round 2 angle was X; this pass uses Y."

## Inline at the top of your response

1. **Read back your prior turns in this conversation.** List every angle used so far (original plan + round 1). Format: `Angles used: [round 0: X], [round 1: Y]`.
2. **Pick a third angle** not on that list. Say which one and why it's likely to surface different problems than rounds 0 and 1.

The angle must be genuinely different. If round 1 was "where data flows and what happens when something fails" and you pick "where data flows and how this code talks to its neighbours", that's the same lens with a different label. Pick something structurally different (for example: hostile inputs, future discoverability, outside services).

Then re-examine the plan from that third angle. Don't stop until you've genuinely exhausted it.

## What to look for

- Assumptions baked into the plan that aren't validated against the codebase.
- Requirements you inferred but didn't confirm with the human.
- Stakeholders, users, or systems the plan doesn't account for.
- Edge cases at boundaries: empty state, max scale, concurrent operations, partial failure, rollback, network loss.
- Non-functional concerns: performance, accessibility, security, observability, cost, deploy ordering.
- Neighbouring systems that produce or consume the same data and aren't mentioned.
- Future-state: what breaks when this code feels unfamiliar six months from now?
- What hasn't been read yet that could invalidate the plan?

## Useful angles to rotate through

The canonical list lives in AGENTS.md § The challenge rounds:

- implementation
- where data flows and what happens when something fails
- how this code talks to its neighbours
- how this code talks to outside services
- config-file syntax and quoting pitfalls
- what unusual or hostile inputs would break this?
- what happens when shell scripts fail mid-pipeline?
- will this code be discoverable when it feels unfamiliar?
- is the sequence of steps right?
- where else does the same root cause apply?
- check whether the earlier rounds' fixes broke anything new
- does this convention reach every place the mechanism reaches?

Plan-stage additions:

- who reads this and how?
- are there requirements I'm assuming but haven't confirmed?
- what could go wrong with this approach?
- if this change causes problems, how do we revert cleanly?

## Plan auto-update (when M > 0)

Same contract as round 1: edit the `docs/plans/` file this conversation drafted, record resolutions in the "Demoted-claims tracking" table, defer human-territory claims with `[NEEDS HUMAN-R2: <one-line ask>]` markers (plain English in chat), and refuse to edit anything other than plan files. If no plan file exists, surface the findings in chat so they aren't lost.

## Self-check before posting

Same checklist as round 1: line cap (20 source lines; 6-8 when clean), no sub-categorized headers, no count-justifying listings, no bare confidence declarations, no cross-round commentary or forward-looking framing, no jargon-stacked labels. Violation found means rewrite, not ship-with-a-note.

## End your response with the structured report

> **Re-verified N claims, demoted M to uncertainty.**

If M > 0, list each demoted claim with a one-line reason, edit the plan, then surface the diff summary in the mandatory format:

```
## Plan diff summary (round 2)
- Addressed: [claim summary] -> [edit made, file:section]
- Deferred [NEEDS HUMAN-R2]: [claim summary] -> [reason]
- Kept as-is: [claim summary] -> [reason]
```

## No-rubber-stamp guard

If M=0 AND your reasoning reads similar to round 1, you've rubber-stamped. Go again with a real new angle before responding.

## Rationale (recorded so future edits don't drift it)

Round 2 is where angle rotation historically fails: in the project Foundry grew out of, the measured five-round curve found zero in round 2 precisely because the angle repeated round 1 under a different name. The read-back step at the top (list the angles used so far, in writing) exists to make that repeat visible before the round starts.
