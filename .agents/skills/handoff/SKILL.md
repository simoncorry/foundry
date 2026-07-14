---
name: handoff
description: 'When the human types `/handoff` (or "next session", "what''s next", "handoff note"), produce a copy-paste markdown block for the next session.'
---

<!-- Generated from .cursor/commands/handoff.md. Edit there and run: npm run shapes -->

When the human types `/handoff` (or "next session", "what's next", "handoff note"), produce a copy-paste markdown block for the next session. Top half is human-scannable; bottom half is pure agent instructions for next session's start-up. This is the closing half of the pair that makes sessions continuous: handoff writes the note, start-up reads it.

## Precondition: the background-work barrier

Handoff may not emit while any background task spawned this conversation is unresolved: await finite work, act on landed-but-unhandled results, retire session daemons, or (narrowly, never for a verification task) abandon with the reason written down. Right after wrap-up this is a quick re-check that nothing new was spawned; standalone, the full barrier applies first. See AGENTS.md § The background-work barrier.

## Voice

The output IS chat to the human: follow AGENTS.md § Voice, including in every fill-in. Pipe the draft through `node scripts/voice-gate.js` before sending.

## Locked template

Output is ONE fenced markdown code block. Inside it:

````markdown
## Handoff

{One paragraph for the human: what the session that just ended focused on, what's left over, and the recommended focus for next time. About 3-5 sentences of plain English. No file paths in the prose, no unexplained acronyms, no marker tags.}

- {Key context bullet 1}
- {Key context bullet 2}
- {Up to 4-5 bullets max}

---

**For the agent:**

Start with `/start-up`. Draw up a plan focused on **{recommended focus, one phrase}** using construct-the-plan. If open questions remain after the draft, run `/frame-it` and get the human's answers. Then STOP and wait: the human queues the challenge rounds, `/build-it`, `/test-it`, the implementation challenges, and `/wrap-up`; never start them unprompted.

**Specific items to pick up (agent-doable without the human):**
- {Item 1 with file path or scope}
- {Item 2}

**Needs the human's input, do NOT pick up unsupervised:**
- {Item, or "None"}

**Out of scope:**
- {Item, or "None"}
````

The horizontal rule separates the human-scannable top from the agent instructions. The whole block is wrapped in a markdown code fence so it pastes cleanly.

## Sources to pull from

- This session's chat: deferred decisions and in-flight items.
- The handoff note from last session, if one is still relevant.
- `docs/plans/` filtered to plans marked IN_PROGRESS.
- Whatever standing to-do or issues surface your project keeps.

Missing or unreadable sources: skip, continue, and add a one-line `Skipped sources: [list]` footnote.

## Sorting items into sections

- Deferred markers from the conversation go to needs-the-human.
- Plans marked PROPOSED go to needs-the-human (they await review); plans marked IN_PROGRESS are agent-doable.
- Lint warnings, drift findings, doc updates: agent-doable.
- Design questions, product tuning, anything taste-shaped: needs-the-human.
- When in doubt, flag as needs-the-human.

Cap the agent-doable list at the top 5 by relevance and say where the rest live.

## Empty case

If nothing's left over and nothing qualifies, output exactly: `Nothing to hand off this time. Self-contained session.`

## Has an opinion

The recommended focus picks ONE thing and justifies it in a sentence. Don't offer a menu.

## Read-only

Handoff modifies no files. It produces the block and stops.

## Rationale (recorded so future edits don't drift it)

The two-half shape exists because the note serves two readers with opposite needs: the human skims the top in ten seconds to remember where things stand, and the next session's agent executes the bottom verbatim. Mixing the two produces a note neither reader trusts. The explicit STOP instruction in the agent half is load-bearing: without it, next session's agent tends to run the whole chain uninvited, and the human loses the checkpoints the process exists for.
