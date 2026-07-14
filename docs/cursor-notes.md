# Cursor notes

Foundry's commands are plain markdown and assume nothing tool-specific. This page collects the Cursor-specific detail that used to live inside the commands, for Cursor users who want it.

## Command loading

Cursor scans `.cursor/commands/*.md` the moment you open the repo; the filename becomes the slash command. Zero setup. We ship these files frontmatter-free as a compatibility choice (plain markdown works in every tool that reads command files), not because frontmatter is known to break anything.

## Plan mode

Cursor has a plan mode that drafts plans in a workspace folder outside your repo. Foundry's construct-the-plan command writes plans straight into `docs/plans/` instead, so nothing here depends on plan mode existing. If you use plan mode anyway, move the result into `docs/plans/<slug>.md` before building, so the plan lives in git next to the work.

## Blocking questions and the timeout bug

Cursor's blocking question dialog (the AskQuestion tool) has a documented bug where an idle connection timeout can answer the dialog by itself with a literal "Questions skipped by the user" response (Cursor forum threads 158485, 160858, 163317; confirmed by Cursor staff, reproduced on builds through mid-2026). The chain's rule (a timed-out question is HALT, never consent) exists because of this: if an unattended run can have its questions answered by a timeout, the only safe reading of a skipped question is "stop and wait for the human."

## Hooks

Cursor can inject session-start context via hooks, but injection has a confirmed timing race (staff-acknowledged, no fix as of July 2026) where the output silently never arrives. Treat hook injection as a nice-to-have and keep the manual path dependable: start-up runs its own checks rather than trusting anything was injected.

## Queued chains

Cursor processes queued messages when the current turn ends, which is what lets you queue the whole chain (`/challenge-plan-2` through `/handoff`) and walk away. Two disciplines make that safe: never end a turn while something the next command depends on is still pending, and use a blocking question (not a printed refusal) when the chain must stop, so the queue halts at the failure point instead of firing every remaining command into a dead state.
