---
name: 'challenge-plan-1'
description: 'Round 1 of plan-challenge.'
---

<!-- Generated from .cursor/commands/challenge-plan-1.md. Edit there and run: npm run shapes -->

Round 1 of plan-challenge. Are you sure you've done all the research and followed every thread needed to reach this conclusion? If not, keep going. Look for opportunities you might be missing.

## Voice

Output prints to the human's chat: follow AGENTS.md § Voice. Pipe substantive drafts through `node scripts/voice-gate.js` and rewrite what it flags.

## Guard: nothing to challenge

If no plan was presented in this conversation (no construct-the-plan run, no inline plan content, no plan file referenced), decline with: "No plan to challenge in this conversation. Draft one first with construct-the-plan, write the plan inline above this command, or name a plan file." Don't invent an imaginary plan to challenge.

## Guard: repeat invocation of round 1

If round 1 already ran earlier in this conversation, treat this invocation as a second pass of round 1 with a NEW angle from the angle list. Say it explicitly: "Round 1 invoked twice; treating as a new angle within round 1. Prior round 1 angle was X; this pass uses Y."

## Inline at the top of your response

1. **Say what angle you used in your original plan.** One line. Examples: "implementation feasibility", "data flow", "user story coverage", "happy-path correctness".
2. **Pick a different angle for this round** from the list below. Say which one and why.

Then re-examine the plan from that new angle. Don't stop until you've genuinely exhausted it.

## What to look for

- Assumptions baked into the plan that aren't validated against the codebase.
- Requirements you inferred but didn't confirm with the human.
- Stakeholders, users, or systems the plan doesn't account for (operators, future maintainers, downstream consumers).
- Edge cases at boundaries: empty state, max scale, concurrent operations, partial failure, rollback, network loss.
- Non-functional concerns the plan ignores: performance, accessibility, security, observability, cost, deploy ordering. If the plan touches UI drawing or animations, does it plan to measure real frame cost rather than reason about it?
- Neighbouring systems that produce or consume the same data and aren't mentioned.
- What happens six months from now when this code feels unfamiliar; is it discoverable?
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

If demoted claims exist (M > 0), edit the plan file directly to address them; don't just surface and wait for approval.

The plan file is the `docs/plans/` file this conversation drafted (or the one the human named). Edit only plan files; refuse to edit anything else from this round. For each demoted claim: address it directly in the plan (rewrite affected sections, add edge-case handling, refine specs), and record the resolution in the plan's "Demoted-claims tracking" table (create the table if it doesn't exist). For claims that genuinely need the human (taste, money, priorities): defer with an inline `[NEEDS HUMAN-R1: <one-line ask>]` marker at the relevant section, and translate it to plain English in chat.

**No plan file detected:** surface the findings in chat with an explicit "no plan file found; findings surfaced above so they aren't lost."

## Self-check before posting

- Line cap: over 20 source lines for the round's report means rewrite (6-8 lines when nothing was found).
- No sub-categorized findings headers ("Verified clean:", "Runtime behavior:"). One flat list or none.
- No count-justifying listings (the number IS the report; don't expand it into a parenthetical).
- No bare confidence declarations ("confidence is high" without cited angles).
- No cross-round commentary, no forward-looking framing ("the next round would cover...").
- No jargon-stacked labels; write sentences.

If you find a violation, rewrite. Don't ship it with a note.

## End your response with the structured report

> **Re-verified N claims, demoted M to uncertainty.**

If M > 0, list each demoted claim with a one-line reason. THEN edit the plan file per "Plan auto-update" above. THEN surface a diff summary in this MANDATORY format:

```
## Plan diff summary (round 1)
- Addressed: [claim summary] -> [edit made, file:section]
- Deferred [NEEDS HUMAN-R1]: [claim summary] -> [reason]
- Kept as-is: [claim summary] -> [reason]
```

Both the structured report AND the diff summary (when M > 0) MUST be present before declaring done.

## No-rubber-stamp guard

If you find yourself reporting M=0 with similar wording to your original plan, you've rubber-stamped. The angle wasn't genuinely different. Go again with a real new angle before responding. M=0 is acceptable ONLY when the new angle was genuinely different AND the re-trace exercised territory the original reasoning didn't.

## Rationale (recorded so future edits don't drift it)

In the project Foundry grew out of, a five-round chain's bug-catch curve ran 4, 0, 4, 3, 1: round 2 found zero because its angle accidentally repeated round 1, and every genuinely rotated round found the next layer. The value of a re-examination prompt isn't being more careful; it's forcing a fresh perspective. That's why this round opens by naming the original plan's angle and picking a different one.
