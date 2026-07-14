Construct the plan. This is the chain's first real work stage: research the territory, then write the plan as a file the rest of the chain can challenge, build against, and check off. It runs after start-up settles the session's direction, and it ends with a draft and a full stop; frame-it runs next, while the human is present.

Works in any tool: the plan is a plain file this command writes. No plan mode required. If your tool has a plan mode, you can draft there, but the deliverable is still the file below.

## Voice

The plan's narrative half prints for the human: follow AGENTS.md § Voice. Pipe it through `node scripts/voice-gate.js` and rewrite what it flags.

## Step 1: Research before drafting

Read enough to draft honestly: the files the work will touch, their callers and readers, the project's conventions for this area, and any prior notes or plans that cover the same ground. If your tool can spawn subagents, a few parallel read-only recon passes over different corners of the codebase are the cheap way to cover ground (optional; sequential reading works everywhere). The bar: you can name the files the work touches and explain how the change affects each of their neighbours. If you can't, keep reading.

## Step 2: Write the plan file

Write `docs/plans/<slug>.md` (create the folder if it doesn't exist), slug in kebab-case naming the work. Frontmatter:

```yaml
---
id: <slug>
status: PROPOSED
created: <YYYY-MM-DD>
---
```

Two halves, split by a horizontal rule:

**The narrative half (for the human).** What we're doing and why, what ships and what deliberately doesn't, the calls you made on their behalf (surfaced so they can veto), the honest risks, and what's out of scope. Order it by what the human is most likely to want changed: user-facing shape first, data choices next, mechanical work last. Plain language throughout; this half is where the teaching lives.

**The working-memory half (for the agent).** Inputs (the files and docs the plan derives from), build steps in order, and acceptance bars concrete enough that a stranger could check them (test-it and the grader read these). Precise and specific; bullets don't need to read like prose, but they can't be jargon-stacked either.

Include an empty `## Deviations` section at the bottom; build-it logs departures from the plan there as it hits them.

## Step 3: State the one-call summary

In chat, give the human the sixty-second version: what the plan builds, the one or two judgment calls you made that they might want to reverse, and where the draft lives. Don't paste the whole plan into chat; the file is the artifact.

Then STOP. Frame-it runs next if open questions remain (the human invokes it); the challenge rounds after that. Never start them unprompted.

## Plan lifecycle

- construct-the-plan writes it as PROPOSED.
- build-it flips it to IN_PROGRESS when implementation starts.
- wrap-up flips it to SHIPPED when the work lands, and a shipped plan gets deleted once its work is merged and nothing references it. Plans are scaffolding, not documentation; the durable record is the code, the commits, and whatever session notes the project keeps.

## Rationale (recorded so future edits don't drift it)

The chain's first step went unwritten for months: drafting lived in one tool's plan mode and in habit, which meant it silently didn't exist anywhere else and its quality depended on mood. Writing the plan to a real file does three jobs at once: it works in every tool, it gives the challenge rounds something concrete to edit (their findings land as plan edits, not chat opinions), and it leaves a trail the next session can pick up. The two-half split exists because the plan serves two readers with different needs, and mixing them serves neither; the narrative half's ordering rule (taste first, mechanics last) puts the human's first minute of reading on the decisions that are actually theirs.
