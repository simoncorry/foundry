---
name: test-it
description: 'When the human types `/test-it` (or "test it", "cover it", "write tests"), the implementation from build-it is in place and this stage proves it works.'
---

<!-- Generated from .cursor/commands/test-it.md. Edit there and run: npm run shapes -->

When the human types `/test-it` (or "test it", "cover it", "write tests"), the implementation from build-it is in place and this stage proves it works. It sits between build-it and security-scan in the chain. It triages the change, writes new behavioral tests for what was just built, drives them to green, and stops the chain if it can't. No questions to the human except the halt case at the bottom (AGENTS.md § The flow guarantee).

## Voice

Output prints to the human's chat: follow AGENTS.md § Voice. Pipe substantive drafts through `node scripts/voice-gate.js` and rewrite what it flags.

## Build the check, don't punt verification

If you're about to write "worth a manual check," stop and build the check instead: a test, a script, a measurement, an automated walk-through. Verification is the agent's job. Handing the human a manual test is a failure of this stage, not diligence. A tool you need but can't reach is an access request, stated plainly; it is never a manual-test handoff.

## Guard: nothing to test

If no implementation happened in this conversation, decline with: "Nothing to test in this conversation. Run build-it first." Don't invent work to test.

## Step 1: Triage the change

Not all work has a sensible automated test, so sort the change before writing anything. Read back what build-it changed; if unsure, diff against the branch point. Five outcomes:

1. **New testable behavior** (logic, data validation, pure functions, handlers): write tests (Step 2).
2. **Pure visual** (styling, animation, layout): there's no unit-test surface, but "manual" is the trap this step closes. Reach for an automated browser check first (a scripted walk-through, a performance measurement, a rendered-output comparison). If the change has a runtime-cost surface a logic test can't see (per-frame work, paint cost, large inputs), measure it with a real tool rather than reasoning about it. Don't invent unit tests for pure visuals. One deliberate exception: if the plan carries a **Taste checkpoints** list (written by frame-it), those items belong to the human by definition; list them verbatim in the report's Deferred field rather than absorbing them.
3. **Pure refactor, no behavior change**: the existing suite staying green is the proof. Note that, add at most one wiring smoke test, and don't write a fresh behavior suite.
4. **Data or config content**: lean on whatever structural validation the project has; add a new test only if the change introduces a new shape or a new code path, not for every content addition.
5. **Mixed** (new logic plus new visuals): test the logic part, measure or defer the visual part, and say which is which.

State the triage outcome in one line before writing anything.

## Step 2: Write the tests

Follow the project's existing test style and runner. Right-size: one happy path per unit, the edge cases the plan named, at least one failure case. Not every branch.

Four hard rules:

- **Assert the plan's intended behavior, not the code's observed output.** An agent that wrote the code tends to write tests confirming what the code does rather than what it should do (the documented "test oracle problem"). Derive expected values from the plan; if the code disagrees, that's a bug for Step 3, not a number to copy into the test.
- **Concrete, hardcoded expected values.** Recomputing the expectation with the implementation's own logic just runs the code twice and proves nothing.
- **Hermetic.** Mock external services. Never touch a real database or open a real socket from a test.
- **Deterministic.** Stub randomness and time so nothing flakes. Swap, run, restore.

## Step 3: Run them and drive to green

Three cases when a test is red:

- **The test is wrong against the plan's intent** (you mis-encoded the expectation): fix the test.
- **The code is wrong** (the test found a real bug): fix the code, commit on the feature branch, re-run.
- **Never weaken a test to make it pass.** Rewriting an assertion to match whatever the code produced is how "all green" becomes a lie. The only allowed test change is the first case, never a change toward the code's output.

Two fix-and-rerun tries is the cap before halting (Step 5).

## Step 4: Independent grader (optional; needs a tool that can spawn a second agent)

The builder never grades its own work: models evaluating their own output systematically score it higher, and the effect traces to recognizing their own generations (Panickssery, Bowman and Feng, "LLM Evaluators Recognize and Favor Their Own Generations", NeurIPS 2024). When the plan states a falsifiable bar AND there's real output to inspect, spawn ONE fresh-context, read-only subagent. Give it only the bar (quoted from the plan), the changed-file list, and how to inspect the output. Not the rationale, not the chat history; the empty memory is the point. Instruct it to attempt disproof: "Try to prove this change does NOT meet the bar. Report the strongest failure you can produce, or state that you could not produce one."

Ground rules: run it in the background with a stated time limit in its own prompt; verify the inspection surface responds before spawning (a grader pointed at a dead environment burns its budget on a vacuous non-verdict); one grader per invocation, no loops. Every failure it produces is a Step 3 red case. If your tool can't spawn subagents, skip in one line and say so.

## Step 5: Halt on genuine failure

Stop the chain if either holds after the Step 3 budget: the tests can't reach green in two tries, or the correct behavior is genuinely ambiguous (the plan never said what right looks like, so any assertion would be a guess). Don't guess. Ask ONE blocking question with two options: "(a) here's my best reading of the intended behavior, proceed with it," or "(b) halt; I'll decide and re-invoke." If your tool's question dialog can time out and answer itself, treat that as halt, never as consent.

## During the chain: no pull request, no merge

Code fixes and new test files commit to the feature branch and push. Opening the pull request is wrap-up's job. In no-git mode, fix in place and log what changed.

## Structured report

End with this line, placeholders filled:

```
Tested: <one-line what was covered>. Deferred: <surface + why, or "none">. Bugs found: K. Bugs fixed: K.
```

K counts real defects the tests revealed, fixed by changing the code. Report the Deferred field even when it's "none", so the triage visibly happened.

## Rationale (recorded so future edits don't drift it)

The stage exists because review rounds judging untested code argue about reasoning, while rounds judging tested code argue about evidence. The never-weaken rule and the plan-derived expectations both counter the same failure: an agent grading its own homework drifts toward whatever the code already does. The grader step brings in the one reviewer that can't recognize its own work, and the cited NeurIPS 2024 result is why that seat matters.
