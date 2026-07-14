---
name: challenge-plan-5
description: 'Round 5 of plan-challenge.'
---

<!-- Generated from .cursor/commands/challenge-plan-5.md. Edit there and run: npm run shapes -->

Round 5 of plan-challenge. The demotion-review round. Different shape from rounds 1-4: instead of picking a new angle and hunting new findings, round 5 deep-reads every claim the prior rounds parked as uncertain (the "demoted claims") and verifies whether each demotion was warranted.

## Voice

Output prints to the human's chat: follow AGENTS.md § Voice. Pipe substantive drafts through `node scripts/voice-gate.js` and rewrite what it flags. Say it plainly: "I went back through the claims I parked as uncertain; two were dismissed too quickly and go back in, three stay uncertain, one turned out to be a real problem and I've fixed the plan."

## Guard: nothing to challenge

If no plan was presented in this conversation, decline with: "No plan to challenge in this conversation. Draft one first with construct-the-plan, write the plan inline above this command, or name a plan file."

## Guard: invoked without rounds 1-4

If rounds 1 through 4 haven't all run in this conversation (check by reading back prior turns for "Round N of plan-challenge" markers), round 5 is the wrong place to start: it reviews the demotions those rounds generate. Decline and point at round 1.

## Guard: repeat invocation of round 5

If round 5 already ran, treat this invocation as a fresh pass over the demoted claims with new evidence. Say so explicitly.

## Methodology

Read the "Demoted-claims tracking" table the prior rounds built up in the plan file. For each claim still demoted, do a focused deep-read of the actual files, docs, or sources the claim is about. Don't trust the demotion note; go look.

Three outcomes per claim:

1. **Promote back to verified.** The deep-read shows the claim was dismissed too quickly; the original plan position was correct. Restore it in the plan body and record the promotion in the table.
2. **Confirm demotion.** The claim is genuinely uncertain after the deep-read. The demotion stands; the recorded resolution stays.
3. **Escalate.** The deep-read shows the claim is worse than uncertain; it's a real problem. Edit the plan to address it and record the escalation in the table.

**Trivial exit:** if no claims were demoted in rounds 1-4, say "No demotions to review from rounds 1 through 4. Round 5 trivially complete." and skip to the self-confidence check.

**No-rubber-stamp guard:** confirming every demotion without opening the files it concerns is rubber-stamping. The point is the deep read. If you catch yourself doing it, say so and go do the actual investigation.

## Structured count line

End the review with this line, replacing each count with a real number (they must add up):

```
Re-examined [count] demoted claims. Promoted [count] back. Confirmed [count]. Escalated [count].
```

This replaces the standard "Re-verified N, demoted M" line for round 5 specifically. Surface the per-claim outcomes BEFORE the count line, and the diff summary (same mandatory format as the other rounds) if any plan edits happened.

## Self-confidence check (after the count line)

Before declaring round 5 done, ask honestly: "Am I confident the plan is sound, or am I stopping because we hit round 5?" If not yet confident, run additional rounds without asking the human (AGENTS.md § The flow guarantee).

Rounds 6 and beyond alternate: an angle-rotated round (rounds 1-4 template, NEW angle from the list, stated at the top), then, if it generated new demotions, a demotion review over ALL still-demoted claims (which can promote an older demotion a new angle proved wrong). Stop on either signal:

- Two consecutive rounds finding nothing, with genuinely different angles. The curve has tapped out.
- Reaching round 8. Auto-stop with a one-line note naming the last angle used. Past 8 rounds the angle list is two-thirds spent; the human can always invoke another round manually.

Every extra round must declare a NEW angle not used in any prior round; reaching for a used one is itself the stop signal.

**Closing declaration when stopping:** name the angles. "I've used angles A, B, C, D, E and can't find a sixth that isn't a re-skin of one of those. Confidence in the plan is earned after five rounds of genuine rotation." A confidence claim with no angle citation is the lazy kind; don't write it.

## Self-check before posting

Same checklist as round 1: line cap, no sub-categorized headers, no count-justifying listings, no bare confidence declarations, no cross-round commentary or forward-looking framing, no jargon-stacked labels. The round-5 count line above is mandatory and verbatim.

## Rationale (recorded so future edits don't drift it)

Demotions are cheap to write and expensive to leave wrong: a claim parked as "uncertain" in round 1 quietly weakens the plan even when the original position was right. This round exists so every demotion gets a second, evidence-based look before the build starts, and so the chain can extend itself honestly when the bug curve hasn't tapered instead of stopping at an arbitrary round count.
