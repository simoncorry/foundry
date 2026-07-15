When the human types `/wrap-up` (or "wrap up", "done for today", "good night"), close the session. Do the steps in order; each is one line of intent with the discipline underneath it. This is the only stage in the chain that opens a pull request.

## Voice

Output prints to the human's chat, especially the closing summary: follow AGENTS.md § Voice. Pipe the summary through `node scripts/voice-gate.js` before sending.

## Step 0: The background-work barrier (blocking)

Nothing else starts until every background task this conversation spawned is resolved: subagents awaited and their results acted on, background shells finished or retired, session-scoped processes stopped (standing dev servers stay up). A verification task (a grader, a disproof probe) can never be abandoned; "pending, carried forward" is not a resolution for anything that could change what shipped. A late grader result that lands here gets adjudicated here: a real disproof becomes a same-session fix, not next session's problem. See AGENTS.md § The background-work barrier.

## Step 1: Cleanup pass

Re-read every file the session modified, in place, not as a diff: dead code out, unused imports out, naming consistent, comments carrying intent rather than narration. Run the project's check or lint suite and fix what it finds.

## Step 2: Review the cumulative session work

If any substantive commit skipped the implementation-challenge rounds, run the chain now over the session's cumulative diff (at minimum round 1; continue while it keeps finding things, per the rounds' own stop rules). Deferred items with markers MUST surface in the closing summary; nothing gets silently carried.

## Step 3: Grow the jargon list

Re-read your own session: every term you stopped to explain, every gloss you wrote, every word the human asked about. Append each to `scripts/phrase-list.json` as a `{"bad": "<the phrase>", "good": "<the plain-English replacement>"}` entry. Then run `node scripts/check-jargon.js` before moving on, for two reasons. A malformed append fails it loud (the blocking gate refuses a damaged list; the advisory voice-gate would just fall silent). And a new entry that already appears in the repo's prose fails it too: adjudicate NOW, rewrite that prose or drop the entry, so the growth loop never hands the next push a red check. This is the loop that keeps the voice gate current; without it the list fossilizes while the jargon keeps evolving. No transcript tooling needed; you were there, read your own turns.

## Step 4: Update the plan, the log, and the wiki

Flip the session's plan to `status: SHIPPED`. Delete any shipped plan whose work is merged and which nothing references anymore; plans are scaffolding, and stale scaffolding misleads more than it helps.

Then the memory, in three moves:

- **Write the session's log entry.** Prepend one entry to `docs/sessions/LOG.md` (create the file with a title line first if this project doesn't have one yet; projects that copied the commands in arrive without it). Shape: `## YYYY-MM-DD: Title`, one short paragraph in plain English, an optional `Friction:` line when something fought back. The paragraph is held to the same bar as Step 6's closing summary: pipe the draft through `node scripts/voice-gate.js` before writing it, and remember the committed file passes the blocking jargon gate on every push.
- **Rotate.** Run `node scripts/rotate-sessions.js`. Entries older than the current week move to one dated file per week; it's a no-op most days and it refuses loudly rather than misfile anything.
- **Distill to the wiki.** If the session taught something durable (a lesson, a decision with reasons, a fact the next session shouldn't rediscover), move it into the topical page it belongs to under `docs/wiki/`, creating the page if it's new. The log is what happened; the wiki is what we know. END the distill by adding any new page to `docs/wiki/INDEX.md` and running `npm run check` NOW: an unlisted page fails the orphan test on the next push, and catching it here is the same post-append discipline the jargon step above already carries.

## Step 5: Commit, push, open the pull request

Commit remaining work with messages that explain why, push the feature branch, and open ONE pull request whose description follows the same two-part shape as everything else: a plain-prose paragraph of what and why, then a terse accurate change list. Merge behavior (auto-merge, review-first, straight merge) is the project's policy, not this command's; follow what the repo's AGENTS.md says. No-git mode: write the change summary to a dated file instead and tell the human where it is.

## Step 6: Close with the summary the human actually reads

At most two short paragraphs of prose, no bullets, no labels. The first says what the human now has: open with "You now have X", name what exists and what's in it with concrete examples, end on a line connecting to something they already care about. The second says how it works and when it'll matter: how it kicks in, what it connects to, then "Practically:" with a concrete near-term moment. Action items (a deferred bug, a pending decision, a risk) belong INSIDE the summary, never as the opener. Never list file paths, never say "I created/updated", never recap step by step, never hand-wave ("more robust"), never close on forward-looking filler.

## Step 7: Stop

Wrap-up ends the session's work. If the human wants a bridge to next time, they invoke handoff; don't emit one unasked.

## Rationale (recorded so future edits don't drift it)

The barrier is Step 0 because it was learned last: sessions kept closing around a still-running grader, and the one time the grader's late report held a real disproof, the fix shipped a session late as its own follow-up. The jargon step is the growth half of the voice system: the gate only knows its list, the list only grows if someone feeds it, and the cheapest reliable feeder is the agent re-reading its own explanations at close. The log and wiki moves in Step 4 are the same growth idea applied to memory: the log entry is what start-up reads next time (the durable half of the handoff pair), and the wiki only stays alive if wrap-up feeds it; a knowledge base without a feeding ritual fossilizes. The closing-summary rules exist because the default failure of session summaries is an inventory ("I updated six files") that tells the human nothing; "you now have X" forces the summary to be about the thing, not the activity. And the pull request lives here, once, at the end, because opening it earlier splits review across a moving target.
