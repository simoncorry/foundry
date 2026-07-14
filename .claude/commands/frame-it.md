When the human types `/frame-it` (or "frame it", "frame this up", "help me scope this"), run the interview stage against the plan drafted earlier in this conversation. This is the one designated stop in the whole flow where the agent asks the human questions. It exists because they are present right now; questions later, mid-chain, are forbidden (see build-it § The flow guarantee).

Position in the flow: construct-the-plan drafts, then `/frame-it`, then STOP. After `/frame-it` completes, wait. The human queues the challenge rounds, `/build-it`, and everything after. Never start any of those unprompted.

Any text after the command narrows the interview: `/frame-it focus on the pricing` means ask only about that area.

## Voice

Output prints to the human's chat: follow AGENTS.md § Voice. Pipe substantive drafts through `node scripts/voice-gate.js` and rewrite what it flags.

## The "if necessary" test

Not every draft earns an interview. A question makes the cut only if:

- the answer would change what gets built (scope, sequencing, what's in and what's out), OR
- it is a taste call only the human holds (product feel, user-facing shape, visual direction, priorities, money).

Engineering questions never make the cut. Architecture, implementation approach, and measurement are the agent's job; where a genuine engineering trade-off exists, the plan carries a recommendation and a default, and `/frame-it` may present that recommendation for a veto, never as a bare "which do you want?" quiz.

If NOTHING meets the bar, say so in one line ("No questions worth your time; the plan carries my recommendations.") and end. That is a successful `/frame-it`, not a failure.

## Step 1: Blindspot brief

Before any question, give the human a short teaching brief so they answer informed. Read whatever project notes and history cover this area, then tell them, in plain English:

- what good looks like in this domain (the quality bar comparable products or systems hit),
- what this project has already tried or decided (so they don't re-litigate settled ground),
- the known potholes (the mistakes that bit this project before).

Keep it tight: a few sentences per point, not a lecture. The brief targets their unknown unknowns (the things they wouldn't know to ask about); it is not a summary of the plan they just read.

## Step 2: Interview

Ask ONE question at a time in chat, waiting for each answer before the next. Hard cap: 3-5 questions total; needing more means the draft was not ready.

- **Order by blast radius.** The question whose answer would change the most of the plan goes first.
- **Anchor every question to the draft.** "The plan assumes X; is that right?" beats "what do you want?"
- **Offer options with a recommendation.** Each question carries concrete lettered options and marks the recommended one, so the human can accept the default in one word or overrule it.
- **Reach for references when words run out.** If the human can't articulate what they want (or you can't pin the taste target), ask for a reference before asking for more words: source code, a product that does it right, a screenshot, a library. Source code is the best reference.
- **Taste-heavy visual work:** offer 2-4 distinct design directions to react to instead of asking someone to describe taste in the abstract.

If the human stops answering mid-interview, fold in whatever was answered so far (Step 3) and note the early exit in one line. Never re-ask. If your tool's question dialog can time out and answer itself, treat that as a stop, never as an answer (AGENTS.md § The flow guarantee).

## Step 3: Fold the answers into the plan

Answers go into the plan file directly (the `docs/plans/` file from construct-the-plan). For each answer: rewrite the affected plan sections, and when taste answers surfaced, add or extend a short **Taste checkpoints** list in the plan's narrative half naming what the human must eyeball at verification time (the "I'll know it when I see it" items).

Chat gets a brief what-changed summary, not a separate artifact.

**Fallback (no plan file exists; ad-hoc use):** emit the summary in chat, closing with: "If you plan this in a later session, paste this block into that session's first message."

Then stop. Do not run challenge rounds. Do not start building.

## Boundaries

- **Interactive-only.** `/frame-it` never runs inside an unattended chain or any automation. It exists precisely because the human is present.
- **Ad-hoc suggestion rule.** Outside the standard flow, when a request is ambiguous enough that you would otherwise ask 3 or more scattered clarifying questions, suggest `/frame-it` by name instead of asking them piecemeal.

## Rationale (recorded so future edits don't drift it)

- The technique set comes from Thariq Shihipar's "Finding Your Unknowns" field guide and his worked examples at thariqs.github.io/html-effectiveness/unknowns/ (blindspot pass, interview ordered by how much of the plan an answer would change, references over description).
- GitHub spec-kit's clarify stage independently validates the shape: at most five questions, options with a recommendation, answers folded into the spec file in place.
- Deliberate divergence from spec-kit: it clarifies BEFORE planning; `/frame-it` runs AFTER the draft. Questions anchored to a concrete plan are sharper than cold ones.
