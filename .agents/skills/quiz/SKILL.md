---
name: quiz
description: 'When the human types `/quiz` (or "quiz me"), build a comprehension quiz on a recent change and teach through the grading.'
---

<!-- Generated from .cursor/commands/quiz.md. Edit there and run: npm run shapes -->

When the human types `/quiz` (or "quiz me"), build a comprehension quiz on a recent change and teach through the grading. Reading a diff gives a light understanding of what happened, because much of the behavior depends on existing code paths the diff never shows. Merging code you can't explain is the failure this command exists to prevent.

`/quiz` is opt-in and never gates anything. It does not block a merge, does not sit in the standard flow, and can run on work that already shipped.

## Voice

Output prints to the human's chat: follow AGENTS.md § Voice. Pipe substantive drafts through `node scripts/voice-gate.js` and rewrite what it flags.

## Pick the change to quiz on (priority order)

1. **Current feature branch vs the main branch**, when one exists (`git diff main...HEAD`).
2. **A pull request number given after the command** (`/quiz 42`): read it with `gh pr diff 42`, or your host's equivalent.
3. **Default when neither applies: the most recently merged pull request.** Sort by merge time, not list order; the default listing is usually by creation date, which picks the wrong one when a long-lived branch merged after a fresh one. If the change the human means is older than the recent window, ask for the number rather than guessing.

No-git projects: quiz on the files changed this session instead, and say so in one line.

## Build the quiz

Read the diff AND the surrounding code paths it plugs into (the caller of a changed function, the handler that routes a new message, the existing behavior the change extends). The point is understanding the behavior, not memorizing the patch. For a large change, don't slurp the whole diff: start from the file list, pick the files that carry the behavior, and read those hunks plus their surroundings. A raw dump of a thousand-line diff buries the quiz-worthy parts.

- 4-6 questions, one at a time in chat, waiting for each answer.
- Mix three kinds: what changed (the observable behavior difference), why it changed (the problem or root cause behind it), and what would break (what happens if a specific piece were removed or a specific input arrived).
- Multiple-choice with lettered options and plausible distractors drawn from the real code, not strawmen.
- Plain English throughout; the quiz tests understanding of the system, not vocabulary.

If the human stops answering mid-quiz, grade what was answered and note the early exit in one line. Never re-ask.

## Grade and teach

After the last answer, grade the set:

- Score up top, one line.
- For each wrong (or skipped) answer: point at the exact file and section where the real answer lives, then teach it properly (why the correct answer is correct, why the chosen one isn't, and the concept underneath if it will come up again).
- Close with the one thing most worth remembering from the change, in a sentence.

Wrong answers are the valuable part; treat them as the teaching moments the command exists for, never as a fault to soften.

## Rationale (recorded so future edits don't drift it)

Adapted from Thariq Shihipar's "Finding Your Unknowns" field guide (thariqs.github.io/html-effectiveness/unknowns/), whose change-quiz worked example ends a merge-readiness report with a quiz whose wrong answers point back to the exact section skimmed. His flow gates the merge on a perfect score; this one deliberately does not, because the merge path here can be an unattended chain and a human-blocking gate would break it. Opt-in learning, not a gate.
