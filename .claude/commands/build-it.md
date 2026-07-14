When the human types `/build-it` (or "build it", "build this", "implement it", "go build"), the plan is settled. Start implementing per the challenged plan. From here to handoff the chain runs without questions to the human, per AGENTS.md § The flow guarantee; the recovery paths below are the only sanctioned stops.

## Voice

Output prints to the human's chat: follow AGENTS.md § Voice. Pipe substantive drafts through `node scripts/voice-gate.js` and rewrite what it flags.

## The unattended-chain rule (why the stops below look the way they do)

The human may queue the entire remaining chain (challenge rounds, test-it, security-scan, wrap-up, handoff) and walk away. Each queued command fires the moment the previous turn ends. Three implications:

1. **No refusals that expect a click or a typed reply.** A printed "fix X and re-invoke" kills the chain: nobody is there to read it, and every queued command after it fires into a dead state.
2. **The only way to pause the chain is a blocking question.** One question, two options, and the queue halts at the failure point so the human returns to a single clear ask instead of a wall of dead responses.
3. **A timed-out or self-answered question dialog is HALT, never consent.** Some tools' dialogs can resolve themselves after an idle timeout. If the response looks synthetic (an auto-skip string, an instant empty answer), stop cleanly and say what happened. Never retry in a loop; never proceed as if the human answered.

## Preflight (before any write)

1. **Re-invocation check.** If build-it already started in this conversation, say so in one line and continue implementing; don't redo the preflight writes.
2. **Plan guard.** A challenged plan must exist (the `docs/plans/` file from construct-the-plan, or one the human named). If none exists, this is a hard stop: ask ONE blocking question, options "(a) hold, I'll present a plan and re-invoke" or "(b) cancel the chain." Don't proceed to writes on either answer.
3. **Branch.** On git projects: if on the main branch, create a feature branch named after the plan's slug from a fresh main (pull first if behind). If the name is taken, append a numeric suffix and say so in one line. If already on a feature branch, stay. A dirty tree is a one-line warning, not a block; changes carry forward. No-git projects: skip, and note that edits happen in place.
4. **Mark the plan.** Flip the plan's `status:` to IN_PROGRESS and commit it as the branch's first commit, so the plan travels with the work it governs.
5. **Pre-implementation self-audit.** Three questions against the settled plan, one-line answers in chat: Which parts are essential complexity, inherent to the problem? Did the plan introduce accidental bloat (wrappers around one-off cases, defensive paths for inputs already guaranteed, generic machinery for one caller)? And can the design cite a principle it honours (the challenge-plan-3 lens)? If a high-confidence bloat finding surfaces, ask ONE blocking question: "(a) continue anyway, review at wrap-up" or "(b) halt; rewrite the plan and re-invoke." Low-confidence observations get logged and the chain continues.

## Declare an implementation angle

Before the first code change, state the approach in one line ("sequential per the plan's steps", "test-first", "diff-minimal"). Implementation-challenge round 1 references this as the round-0 angle.

## During implementation: log deviations in the plan file

No plan survives contact with the code untouched, and under an unattended chain there is nobody to ask when it doesn't. When the territory forces a change from the challenged plan (an edge case the plan missed, an assumption that proved wrong), pick the conservative option, log it, and keep going. Don't halt; don't ask.

The log lives in the plan file's `## Deviations` section, one bullet per departure with four parts: what the plan said, what the code forced, what was chosen, and a one-line lesson. Cite code locations. Implementation-challenge round 1 reads this section first and treats every entry as a prime target, because deviations are exactly where the work left the reviewed plan.

## During implementation: commit as units land, no pull request

Work commits and pushes to the feature branch as coherent units complete. Do NOT open a pull request during build-it or the review rounds that follow; that's wrap-up's job, once, at the end. No-git mode: edit in place, and keep a running list of what changed in the plan file.

## Genuine blockers

If implementation hits a wall the plan can't resolve and the conservative-option rule can't cover (a missing credential, a service that's down, an assumption so broken the plan is void), ask ONE blocking question with a halt option, same shape as the preflight guard. This is the last resort, not the reflex; most surprises are deviations, not blockers.

## When implementation completes

Say exactly: `Implementation complete.` and end the turn. Under a queued chain, test-it fires next on its own; interactively, the human invokes it. Do NOT auto-invoke the next command; each stage starts on the human's turn, always.

## Rationale (recorded so future edits don't drift it)

Build-it is deliberately the chain's quietest command: the plan was challenged before it and the work is reviewed after it, so its job is faithful execution plus honest bookkeeping. The deviations log replaces mid-build questions because a queued chain has no one to answer them, and it works: conservative choice, four-line record, reviewed by name in the next round. The one-blocking-question pattern for genuine stops comes from hard experience with the alternative, where a printed refusal let a whole queued chain fire into nothing. The self-audit step exists because over-building sails through plan review dressed as thoroughness; asking "essential or accidental?" once more, at the last moment before code, is the cheapest place to catch it.
