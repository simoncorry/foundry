<!-- Budget: ~2,000 tokens (~8 KB). This file loads at the start of every session, so every line here is a tax on every session. If an addition pushes past the budget, something else moves out to docs/ first. The project this grew from let its rules file double past its own declared budget; the budget line you're reading exists so that doesn't happen here. -->

# Foundry: the working agreement

This file is the shared ground rules for any agent working in a project that uses Foundry. Cursor and Codex read it natively. Claude Code reads it through the one-line import in CLAUDE.md. If your tool reads none of these, paste this file into the chat at the start of a session.

Foundry is an agent process: named stages you run in order, each one a markdown command in this repo. The chain is start-up, construct-the-plan, frame-it, challenge-plan 1 through 5, build-it, test-it, security-scan, challenge-implementation 1 through 5, wrap-up, handoff, with quiz available at any point. You don't have to run all of it every time; see the light path in docs/light-path.md.

## What the chain assumes

An agent that can read and write files, run shell commands, and follow a multi-step instruction. That's the whole requirement. Plan modes, queued commands, blocking question dialogs, and subagents are comforts some tools have; every command marks the steps that need them as optional. Git and a GitHub-style remote are assumed by the full flow (build-it makes a branch, wrap-up opens a pull request), but every command that touches git also carries a no-git alternative: edit in place, keep the plan as a local file, write a summary instead of opening a pull request. Nothing in the chain depends on one vendor's model, pricing, or terms.

## How the agent works here

- **Understand before changing.** Trace how the code you're touching connects to the rest before you edit it. If you can't explain what your change affects, you haven't read enough.
- **No shortcuts.** Never "good enough for now," never "simplified for testing." If the proper version is expensive, say so honestly instead of shipping the cheap one quietly.
- **Verify your own work.** If you're about to write "worth a manual check," stop and build the check instead. A test, a script, a measurement. Hand the human results, not homework.
- **Own the calls.** Engineering decisions are the agent's to make and defend. The human owns taste, money, credentials, and anything irreversible. Bring recommendations, not multiple-choice quizzes.
- **Keep it clean.** Remove dead code when you see it. Commit and push when a task completes. Don't batch unrelated changes.

## Plans

Substantive work starts with a plan file at `docs/plans/<slug>.md`, written by the construct-the-plan command. Small frontmatter header: `id`, `status` (PROPOSED, IN_PROGRESS, SHIPPED), `created`. Two halves split by a horizontal rule: a narrative half for the human (what and why, in plain language), a working-memory half for the agent (files, steps, acceptance bars). Plans are scaffolding, not documentation; delete them when the work ships.

## The challenge rounds

Reviews only work when each round looks from a genuinely different angle. The angle list:

1. implementation
2. where data flows and what happens when something fails
3. how this code talks to its neighbours
4. how this code talks to outside services
5. config-file syntax and quoting pitfalls
6. what unusual or hostile inputs would break this?
7. what happens when shell scripts fail mid-pipeline?
8. will this code be discoverable when it feels unfamiliar?
9. is the sequence of steps right?
10. where else does the same root cause apply?
11. check whether the earlier rounds' fixes broke anything new
12. does this convention reach every place the mechanism reaches?

Every round states its angle at the top and must differ from all prior rounds. When an angle repeats, you find nothing; when it's genuinely different, you find the next layer. Every round ends with its structured count lines, verbatim: plan rounds report `Re-verified N claims, demoted M to uncertainty.` and implementation rounds report that same line plus `Bugs found: K. Bugs fixed: K.` beneath it. The human scans for those lines; don't restyle them.

## The flow guarantee

Once build-it starts, the chain runs without questions to the human until handoff completes. Frame-it is the one designed question stop, and it runs before the chain, while the human is present. Mid-chain edge cases auto-resolve with the conservative option and a logged note (the plan file's Deviations section), never a blocking question. If a blocking question dialog times out or answers itself, treat that as HALT, never as consent.

## The background-work barrier

No session closes while anything it spawned is still running or unread: a subagent, a background shell, a pending check. Await it, act on it, retire it, or explicitly abandon it with the reason written down. A verification task can never be abandoned. Closing a session around pending work ships an incomplete session.

## Voice

Everything written for a human reads like a person wrote it: plain words, short sentences, no jargon stacks, no em dashes. Before sending a substantive response, pipe the draft through `node scripts/voice-gate.js` and rewrite what it flags. The same list also has teeth: `npm run check` fails when a listed phrase lands in committed prose (docs, command files, code comments), so the voice bar holds without anyone remembering to hold it. The gate only knows the phrases in `scripts/phrase-list.json`; wrap-up's jargon step grows that list every session, so it keeps pace with the jargon you actually produce. For vocabulary the list doesn't know yet, the test is: would someone outside the codebase follow this sentence? If not, rewrite it.
