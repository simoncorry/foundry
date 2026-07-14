---
name: challenge-plan-4
description: "Round 4 of plan-challenge."
---

<!-- Generated from .cursor/commands/challenge-plan-4.md. Edit there and run: npm run shapes -->

Round 4 of plan-challenge. Are you 200% sure you've covered this from every angle? If not, keep going.

## Voice

Output prints to the human's chat: follow AGENTS.md § Voice. Pipe substantive drafts through `node scripts/voice-gate.js` and rewrite what it flags.

## Guard: nothing to challenge

If no plan was presented in this conversation (no construct-the-plan run, no inline plan content, no plan file referenced), decline with: "No plan to challenge in this conversation. Draft one first with construct-the-plan, write the plan inline above this command, or name a plan file." Don't invent an imaginary plan to challenge.

## Guard: repeat invocation of round 4

If round 4 already ran earlier in this conversation, treat this invocation as a second pass with a NEW angle. Say it explicitly: "Round 4 invoked twice; treating as a new angle within round 4. Prior round 4 angle was X; this pass uses Y."

## Default angle for this round

**Default: external concerns (research beyond the codebase, plus outside-service contracts).** Round 4 reaches outside the repo for evidence. Two sub-checks:

**(a) Research beyond the codebase.** Use your web search capability to check the plan against official documentation, community reports, and well-known patterns for whatever libraries, services, or approaches it relies on. Look for how others have tackled similar problems. Catch confabulation: places where the plan asserts something as fact that isn't grounded in external evidence. If your tool has no web access, say so in one line and note which claims went unchecked; don't silently skip.

**(b) Outside-service contracts.** If the plan touches outside services (a model provider, GitHub, a database host, a payments API), trace the contract: response-shape expectations, implicit assumptions about rate limits, timing, and retries, auth and quota behaviours, what happens when the service is briefly unavailable or returns stale data.

If the plan has no external surface at all (purely internal refactor, no external libraries, no named-precedent pattern, no outside services), override to whichever angle from the list below is most relevant. Say which angle and why.

## Inline at the top of your response

1. **Read back your prior turns.** List every angle used so far (original plan + rounds 1-3). Format: `Angles used: [round 0: X], [round 1: Y], [round 2: Z], [round 3: W]`.
2. **Confirm the round-4 angle**: either "using the default for this round: external concerns" OR "overriding the default to [angle]: [reason]". The angle must be different from rounds 0-3.

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

Plan-stage additions: who reads this and how? / are there requirements I'm assuming but haven't confirmed? / what could go wrong with this approach? / if this change causes problems, how do we revert cleanly?

## Plan auto-update (when M > 0)

Same contract as round 1: edit the `docs/plans/` file this conversation drafted, record resolutions in the "Demoted-claims tracking" table, defer human-territory claims with `[NEEDS HUMAN-R4: <one-line ask>]` markers (plain English in chat), and refuse to edit anything other than plan files. If no plan file exists, surface the findings in chat so they aren't lost.

## Self-check before posting

Same checklist as round 1: line cap (20 source lines; 6-8 when clean), no sub-categorized headers, no count-justifying listings, no bare confidence declarations, no cross-round commentary or forward-looking framing, no jargon-stacked labels. Violation found means rewrite, not ship-with-a-note.

## End your response with the structured report

> **Re-verified N claims, demoted M to uncertainty.**

If M > 0, list each demoted claim with a one-line reason, edit the plan, then surface the diff summary in the mandatory format:

```
## Plan diff summary (round 4)
- Addressed: [claim summary] -> [edit made, file:section]
- Deferred [NEEDS HUMAN-R4]: [claim summary] -> [reason]
- Kept as-is: [claim summary] -> [reason]
```

## No-rubber-stamp guard

If M=0 AND your reasoning reads similar to any prior round, you've rubber-stamped. Go again with a real new angle. If you've genuinely exhausted angles AND M=0, say so explicitly with the angles cited by name.

## Rationale (recorded so future edits don't drift it)

The research sub-check exists because agents confabulate tool and library behavior with complete confidence, and no inward-facing round can catch a claim whose refutation lives outside the repo. In the project Foundry grew out of, the round was added after an agent asserted a tool version's behavior as fact, a human caught it, and the review chain hadn't, because no round was pinned to external validation. The service-contract sub-check earns its place separately: the same project's chain once caught a mismatch with an outside service that had silently disabled an entire fix.
