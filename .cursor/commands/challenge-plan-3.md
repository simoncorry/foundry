Round 3 of plan-challenge. Are you 200% sure you've covered this from every angle? If not, keep going.

## Voice

Output prints to the human's chat: follow AGENTS.md § Voice. Pipe substantive drafts through `node scripts/voice-gate.js` and rewrite what it flags.

## Guard: nothing to challenge

If no plan was presented in this conversation (no construct-the-plan run, no inline plan content, no plan file referenced), decline with: "No plan to challenge in this conversation. Draft one first with construct-the-plan, write the plan inline above this command, or name a plan file." Don't invent an imaginary plan to challenge.

## Guard: repeat invocation of round 3

If round 3 already ran earlier in this conversation, treat this invocation as a second pass with a NEW angle. Say it explicitly: "Round 3 invoked twice; treating as a new angle within round 3. Prior round 3 angle was X; this pass uses Y."

## Default angle for this round

**Default: over-engineering check and simpler solutions.** Step back from the plan and ask: is this whole approach simpler than I made it? Is there a one-line, one-file, or one-step alternative? Are there cuts the prior rounds missed because they were focused on correctness rather than minimal scope? Round 3 is the mid-chain step-back: by now the plan has been explored and defended from two fresh angles, which is exactly when an honest "is the design itself right-sized?" question lands, before round 4 (external concerns) and round 5 (demotion review) build on top of it.

**The lens for this round, inlined so the round is self-contained.** Complexity comes in two kinds. Essential complexity is inherent to the problem: the real state to sync, the real math, the real failure handling. Accidental complexity is everything added on top: factory layers around one-off cases, indirection "for flexibility" nobody asked for, defensive validation on inputs the upstream layer already guarantees, generic configs for a single use case. The trap is dressing accidental complexity in essential-sounding language. Three quick tests: does this addition have a concrete user story today (if not, it's accidental)? Is the design simple enough to have obviously no deficiencies, rather than complex enough to have no obvious deficiencies? And when you're tempted to add a parameter to shared code so different callers can opt in or out, the abstraction is wrong; inline it back and let the real shape emerge. (Brooks's "No Silver Bullet", 1986; Wirth's "A Plea for Lean Software", 1995; Hoare's Turing lecture, 1980; Metz's "The Wrong Abstraction", 2016.) Deeper treatment, with the full sources and worked tests, lives at docs/wiki/engineering/overview.md.

Look for:

- **Scope creep**: features the plan added that weren't asked for. Original ask vs actual plan scope.
- **Premature abstraction**: factory patterns, sentinel files, indirection layers added "for flexibility" when a direct approach would do.
- **File-count inflation**: would this work in 2 files instead of 5? In 1 change instead of 3?
- **Step-count inflation**: would this work in 3 steps instead of 7?
- **Defensive code paths for problems that don't apply**: retry loops, fallbacks, validators for inputs the upstream layer already guarantees.
- **Generic solutions for specific problems**: parameterized configs for a single use case; multi-handler patterns when one would do.
- **Belt-and-braces redundancy**: two checks that do the same thing in different ways; comments that just repeat what the code says.

If the plan is genuinely already minimal (a one-step change, a one-file edit), override to whichever angle from the list below is most relevant. Say which angle and why.

## Inline at the top of your response

1. **Read back your prior turns.** List every angle used so far (original plan + rounds 1-2). Format: `Angles used: [round 0: X], [round 1: Y], [round 2: Z]`.
2. **Confirm the round-3 angle**: either "using the default for this round: over-engineering check and simpler solutions" OR "overriding the default to [angle]: [reason]". The angle must be different from rounds 0-2.

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

Same contract as round 1: edit the `docs/plans/` file this conversation drafted, record resolutions in the "Demoted-claims tracking" table, defer human-territory claims with `[NEEDS HUMAN-R3: <one-line ask>]` markers (plain English in chat), and refuse to edit anything other than plan files. If no plan file exists, surface the findings in chat so they aren't lost.

## Self-check before posting

Same checklist as round 1: line cap (20 source lines; 6-8 when clean), no sub-categorized headers, no count-justifying listings, no bare confidence declarations, no cross-round commentary or forward-looking framing, no jargon-stacked labels. Violation found means rewrite, not ship-with-a-note.

## End your response with the structured report

> **Re-verified N claims, demoted M to uncertainty.**

If M > 0, list each demoted claim with a one-line reason, edit the plan, then surface the diff summary in the mandatory format:

```
## Plan diff summary (round 3)
- Addressed: [claim summary] -> [edit made, file:section]
- Deferred [NEEDS HUMAN-R3]: [claim summary] -> [reason]
- Kept as-is: [claim summary] -> [reason]
```

## No-rubber-stamp guard

If M=0 AND your reasoning reads similar to any prior round, you've rubber-stamped. Go again with a real new angle. If you've genuinely exhausted angles AND M=0, say so explicitly with the angles cited by name. Don't fabricate findings, and don't claim coverage you haven't earned.

## Rationale (recorded so future edits don't drift it)

The round is pinned to the over-engineering check because over-building hides in plain sight when every review round is hunting correctness bugs. In the project Foundry grew out of, the worst case was a proposed 28-file coordination mechanism that one blocking question replaced with 2 file edits; no round was pinned to "is this simpler than I made it?", so nothing caught it until a human did. The lens paragraph above is inlined rather than referenced so this file stands alone.
