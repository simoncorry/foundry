---
name: 'start-up'
description: 'Run the session start-up.'
---

<!-- Generated from .cursor/commands/start-up.md. Edit there and run: npm run shapes -->

Run the session start-up. This is the chain's opener and the reading half of the pair that makes sessions continuous: handoff writes the note, start-up reads it.

## Voice

Output prints to the human's chat: follow AGENTS.md § Voice. Pipe substantive drafts through `node scripts/voice-gate.js` and rewrite what it flags.

## Step 1: Preflight

Check the ground you're standing on and act on what you find:

- Current branch, and whether the working tree is dirty. Dirty means warn, not block; uncommitted changes carry forward.
- Whether the main branch is behind its remote. If it is, pull before anything else; starting work on a stale main manufactures merge conflicts.
- Anything project-specific the repo's AGENTS.md tells you to check at session start.

No-git projects: skip the git checks and just confirm which folder you're working in.

## Step 2: Read the handoff note

If the human's first message contains a handoff block (the output of last session's handoff command), that's your brief: read it, follow its agent half, and respect its "needs the human" and "out of scope" sections. If the project keeps standing context files (a session log, a current-state summary), read those too.

## Step 3: Mirror the state

Summarize what you found in 2-3 plain lines: branch, dirty or clean, what last session left off, anything that needs the human's attention before work starts. Facts only; no suggestions yet.

## Step 4: Direction

Two cases:

- **A handoff note exists:** confirm the recommended focus in one line and proceed to construct-the-plan when the human says go (or immediately, if the note's agent half says to).
- **No note:** interview briefly, using frame-it's mechanics pointed at direction instead of a plan: ask ONE question at a time, 2-3 questions total, each with concrete options and a recommendation. "What are we building today?" is a fine opener when the project gives no signal. Fold the answers into a one-paragraph statement of the session's focus and confirm it.

Then wait for the human before drafting anything. Start-up ends with a direction, not a plan.

## Rationale (recorded so future edits don't drift it)

Start-up used to be the chain's forgotten opener: every other stage had a file and this one lived in habit, so sessions started blind or started differently every time. Its job is deliberately small (preflight, read the note, mirror, direction) because everything bigger belongs to construct-the-plan. The interview reuses frame-it's brief-then-ask mechanics rather than inventing a second questioning style; the cold-start shape (mirror the state factually before offering anything) carries over from the startup flow of the project Foundry grew out of, which adapted it from a colleague's cold-start pattern. Recorded so the lineage survives edits.
