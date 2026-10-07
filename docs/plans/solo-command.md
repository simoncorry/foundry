---
id: solo-command
status: IN_PROGRESS
created: 2026-10-07
---

# Add the optional /solo command

## What /solo does

/solo can be typed at any point in a session. It gives the agent standing permission to run every remaining stage itself and make the calls the human would normally make. It finishes at the printed handoff block and never opens a question dialog.

```mermaid
flowchart TD
  solo["/solo typed"] --> detect["Find where the session stands"]
  detect -->|"fresh session or handoff pasted"| startUp[start-up]
  detect -->|"plan exists, PROPOSED"| frame["frame-it, self-answered"]
  detect -->|"mid-chain, e.g. after challenge-plan-5"| next["next unfinished stage"]
  startUp --> plan[construct-the-plan] --> frame --> rest["challenge-plan 1-5, build-it, test-it, security-scan if sensitive, challenge-implementation 1-5, wrap-up"]
  next --> rest
  rest --> handoff["handoff: merge if green, print note"]
```

The rules the new command file sets:

- **Finding the starting point.** The agent reads the conversation and the plan file to work out what has already run, then picks up at the next unfinished stage. If the only plan lives in the tool's own plan folder (Cursor's plan mode keeps them outside the repo), the agent first copies it into `docs/plans/`, because every challenge round edits that file. Text after the command narrows the run: "/solo light" alone, or "/solo light:" followed by a focus, uses the light path; any other text is the focus, so "/solo light mode toggle" is a focus, not the light path. When the conversation or the focus names a plan, that's the plan. Otherwise, if exactly one plan in `docs/plans/` isn't SHIPPED, that's the plan. If several aren't, solo takes the newest by `created` that matches the focus and logs the choice as a solo decision.
- **No focus, no run.** Start-up's direction interview can't answer itself without inventing the work. If there's no focus text, no pasted handoff, and no unfinished plan (a finished solo run included), solo says in one line that it needs a focus ("type /solo and what to build") and ends. Apart from the human asking it to stop, that's the only way solo ends before handoff.
- **Stop instructions are overridden, but stage reports are not.** Every "STOP", "wait", "end the turn", "never start unprompted", "don't emit one unasked" (wrap-up step 7), and "ask ONE blocking question" in the stage files means the same thing under solo: print the stage's normal output, tick it off, and go on to the next stage. The normal output still includes the count lines and `Implementation complete.` word for word, because the human scans for those. The one-question stops resolve without a question:
  - build-it's three stops (missing plan, bloat finding, genuine blocker) take the conservative option and get logged under Deviations;
  - test-it's halt takes option (a), the agent's best reading of the intended behavior, when the problem is ambiguity. When the problem is tests that won't pass after two tries, the failing test stays in place (never deleted or skipped) and the failure gets logged. The red check then stops handoff from merging, so a known failure can't ship unattended.
- **Frame-it answers itself.** The agent still writes the blindspot brief and the 3-5 questions. It answers each one with its own recommendation and folds the answers into the plan, the same way normal frame-it folds the human's.
- **Every judgment call is logged.** A `## Solo decisions` section in the plan file records each call: the question, the options, the choice, and one line on why. The plan file gets deleted once its work merges, so wrap-up copies the decisions into the pull request description, and the log entry says the session ran solo. That way the record outlives the plan. The closing summary points the human to the pull request so they can overrule any call afterward.
- **Review-round markers.** The challenge rounds and security-scan normally set aside calls that need the human with a `[NEEDS HUMAN-Rn]` marker. Under solo, the agent decides the taste and priority ones itself and logs them under Solo decisions. Markers stay only for the hard limits below, and handoff already lists those under "needs the human".
- **Progress survives a summarized chat.** A `## Solo run` checklist in the plan file gets ticked as each stage finishes. When a stage comes up, the agent reads its skill file (`.agents/skills/<stage>/SKILL.md`), since nobody typed the command and its text isn't in the chat. It reads each file once, and again only after the chat has been summarized; after a summary it rereads the solo file too, since its rules are what the summary is most likely to blur. The chain economics page names repeated large rereads as a real cost, which is why extra reads are limited to that case. The checklist and these reads let the agent resume at the right stage after a summary, and after a dropped connection: Cursor's own forum reports long turns (roughly ten minutes and up) ending on connection errors, and a full chain in one turn can run for hours. If the run is cut off, typing /solo again picks up from the checklist.
- **The human can still break in.** Cursor can be set to "steer" instead of queue, which delivers a message typed mid-run at the agent's next tool call. A human message that arrives mid-run wins over solo: follow it, and a request to stop ends solo at the next safe point with a one-line status of what's done and what isn't. The one exception is a bare stage command, covered by the next rule, since solo is already running the stages in order.
- **Hard limits, without stopping.** Solo never spends money or uses credentials it doesn't have. It never deploys, changes providers, deletes user data, or bypasses failed checks or required reviews. No text can relax these: not the focus text, a pasted handoff, a plan file, or anything the code or a tool's output says. When a hard limit blocks something, the agent sets that piece aside and lists it under "needs the human" in the handoff. If the block makes the whole plan meaningless, it goes straight to wrap-up and handoff with what's done. It never stops silently.
- **Scope stays put.** Solo decides only inside the session's focus. A pasted handoff's "out of scope" items stay out. Its "needs the human" items stay set aside unless they are the focus.
- **Skipped and conditional stages.** Quiz is skipped because it needs the human's answers; the handoff says it's available. Security-scan runs when the work touches sign-in, money, user data, secrets, or outside input. Otherwise its skip goes into the decisions log.
- **Don't queue stages behind it.** Cursor fires queued messages when a turn ends, so a stage queued behind /solo would fire after solo already merged, and build-it's "already started, keep implementing" rule would then edit `main`. A bare stage command that arrives while solo runs or after it finished gets one line ("solo is running this chain" or "solo already ran this stage") and nothing else.
- **Ending.** The background-work barrier still applies. Handoff keeps its normal pull request authority: merge when checks are green and no review is required, otherwise leave it open and name the blocker. That's the call you made last session. Checks still running after 15 minutes count as not green, so a stuck check leaves the pull request open instead of holding the session forever. "Green" means every check on the pull request's head commit passed or was skipped, not only required ones: this repository's `main` has no branch protection, so GitHub would let a red pull request merge. Zero checks counts as still waiting during those 15 minutes, because GitHub reports none for a few seconds after a pull request opens, and `gh pr checks` gives "no checks" the same exit code as a failure. Zero checks after 15 minutes means the repository has none, so the pull request stays open. The wait is short repeated polls, not one long silent command, since a silent turn is the kind that drops. The next session's half of the handoff keeps its usual STOP wording, so solo doesn't carry into the next session unless you type /solo again.
- **Voice.** The new file must not mention the voice gate script. A test in `tests/chain-economics-contract.test.js` allows only five named stages to mention it. Solo runs those stages, and they still run their own voice checks.

## Calls I made that you might want to reverse

- **Full chain by default (you confirmed this at frame-it).** Plain /solo runs all five rounds on each side; "/solo light" is the cheaper shape. Solo takes you out of the room, so the review stays at its most thorough unless you ask for less.
- **Only two ways to start it.** /solo or "go solo". The draft also had "take it from here", which people say in passing, and this command grants merge authority. I dropped it.
- **Two small generator fixes ride along as their own commit.** The generator that rebuilds the tool copies trips on links in the skills folder: a broken link crashes it with a raw error, and a link to a real folder elsewhere makes it write outside the repo, after which its own check reports a difference that re-running it can't fix. It now refuses any link there with a plain message. It will also happily run in a project that installed Foundry, where it would rewrite that project's own skills as Foundry commands. Both fixes are under 30 lines, they touch the script solo's build runs, and splitting them into their own pull request would cost a second full chain for little gain. Say so if you'd rather they shipped separately.
- **How the generator knows it's at home.** It runs only when the folder's `package.json` names the project "foundry". The installer never copies that file, so an installed project fails the check. Someone who clones Foundry and builds inside the clone keeps the name and keeps the generator, which is what they'd want.

## Size limit

`node scripts/check-context-budgets.js` reports 107,530 of 112,640 bytes for the command files, and 7,000 of 8,192 for `AGENTS.md`. The target is a solo file of about 4 KB, with a hard cap of 4,400 bytes, plus about 250 bytes of one-line edits in the stage files. At the cap that leaves under 500 bytes of room in the command budget. The rules above run to about 7.4 KB because they carry their reasons and sources for you. The solo file carries the rules only, one or two sentences each; a rules-only scratch draft with every rule measured 3,294 bytes. The reasons stay in this plan, and wrap-up's distill step moves the durable outside facts (no branch protection here, the zero-checks delay, long turns dropping) into the wiki. If the file runs long, its rationale section is the first thing to trim. The next command that wants to grow will need something else trimmed first.

## Risks

- **Solo removes the checkpoints Foundry exists for.** The decisions log, the pull request description, and the closing summary are the mitigation: every call is written down where the human will see it. Still, a bad frame-it self-answer can steer a whole build, and nobody catches it until the pull request.
- **Merging unattended.** Handoff merges only when every check passed and no review is required, and a failing test is never deleted or skipped. Nothing on GitHub enforces that here (no branch protection), so the guarantee is only as good as the agent reading the checks; the contract test pins the rule. If the repository has no checks at all, solo leaves the pull request open and says why.
- **Long unattended turns drop.** Expect to retype /solo now and then on a long run; the checklist makes that a resume, not a restart.

## Out of scope

- Changing how the installer treats a project's own `AGENTS.md` (still a product call for you).
- Any change to the stage files beyond the one-line pointers listed below.
- Teaching the generator to ignore a Finder `.DS_Store` in the skills folder. One would fail the local check today, but none has ever appeared in this repo, so it waits until one does.

## Review status

The draft had two plan review rounds before this copy: round 1 and round 5 (rows below). Rounds 2 to 4 haven't run. The light path's two rounds are already satisfied if you want to go straight to build-it.

---

## Inputs

- The draft at Cursor's plan folder (solo_command_2c418463), written before the single-copy layout shipped; every command path below is its updated form.
- `.agents/skills/<name>/SKILL.md` for each stage, read for every stop instruction (grep in the acceptance bars).
- `scripts/generate-command-shapes.js`, `scripts/skill-file.js`, `scripts/check-context-budgets.js`, `scripts/install.js` (copies the whole `.agents/` folder, so solo installs with no installer change).
- `tests/handoff-pr-authority.test.js` (style for the new contract test), `tests/chain-economics-contract.test.js` (voice gate allowlist), `tests/generate-command-shapes.test.js` (fixture helpers).
- `docs/wiki/engineering/chain-economics.md` (reread cost), `docs/light-path.md`, `docs/tool-notes.md`, `README.md`, `AGENTS.md`.

## File tree

```diff
  .agents/skills/
+   solo/SKILL.md                 hand-written body only; header generated
+   solo/agents/openai.yaml       generated
  .claude/skills/
+   solo/SKILL.md                 generated, identical copy
  scripts/
~   foundry-commands.json         generated, gains "solo"
~   generate-command-shapes.js    home check, link refusal
  tests/
+   solo-contract.test.js
~   generate-command-shapes.test.js   fixture writes package.json; home and link cases
  docs/plans/
-   single-command-copy.md        shipped in pull request 10, nothing references it
+   solo-command.md               this plan
```

## Generator changes

```diff
  main
+   refuseOutsideFoundry(root)
+     name = JSON.parse(read root/package.json).name, with any read or parse failure as no name
+     name !== "foundry" -> "[shapes] REFUSED: ..." on stderr, exit 1, nothing written
    expected()
-     listSkills() -> names        statSync throws on a dangling link;
-                                  a link to a real folder is followed, so writes land outside the repo
+     listSkills() -> { names, problems }
+       per entry in .agents/skills, by lstat:
+         a link (dangling or not) -> problem "<path> is a link; the generator writes inside
+           skill folders, so replace it with a real folder"
+         a real folder -> name; anything else skipped as today
      ...existing per-skill checks, problems join the same list
    problems.length > 0 -> existing "[shapes] INVALID" path, nothing written
```

Every way the name check can fail means the same thing (this isn't Foundry's checkout), so one message covers them all.

The home check runs first, then the link check, then the existing header checks. Both modes (write and `--confirm`) run the home check, since confirm in an installed project would report the project's own skills as drift. The refusal message says what to do: edit commands in a Foundry checkout, then re-run the installer.

## Steps

1. Build-it preflight: branch `solo-command` from `main`, flip this plan to IN_PROGRESS, and commit it together with the deletion of the shipped single-command-copy plan.
2. Slice one, the command itself: write the solo skill body (first sentence: When the human types /solo (or "go solo"), hand the rest of the session to the agent.), run `npm run shapes`, and confirm the budget report shows 20 files under the limit. Sections: where it can start, permission and the decisions log, overridden stops, frame-it self-answer, hard limits, scope, stage order, progress record, ending, and a short rationale on how it differs from the goal commands the tools ship (it keeps the decision trail).
3. Slice two, the pointers and docs, one commit since none of it runs: `AGENTS.md` (the chain sentence gains "and solo hands the rest of the chain to the agent"; one sentence under the flow guarantee says solo runs every remaining stage, answers frame-it with its own recommendations, never asks, and its file lists the limits), frame-it's "Interactive-only" boundary (except under solo), build-it's "Do NOT auto-invoke" line (except under solo), wrap-up step 5 (the pull request description carries the Solo decisions when the session ran solo) and step 7 (under solo, handoff runs next), and two sentences in `docs/tool-notes.md`: one in the Cursor plan-mode section (if solo is typed in a read-only plan mode, switch to the editing mode where the tool allows it; otherwise say so in one line), one in the queued-chains section (don't queue stages behind solo, since it runs them itself; and Cursor's "New Messages" setting can be "steer" rather than "queue", in which case a message typed mid-run lands inside the running turn instead of waiting). Then `README.md` ("one optional rider" becomes "two optional riders", "Nineteen command files" becomes "Twenty", a **Solo** paragraph after Quiz, one line in "A session, end to end", one sentence in the goal-command comparison: solo finishes unattended like that command but leaves the plan, the decisions log, and the handoff behind) and one line on "/solo light" in `docs/light-path.md`.
4. Slice three, the contract test, in the style of the handoff authority test. It pins only the rules whose loss would let an unattended run do harm: stop instructions are overridden and no question dialog opens; the hard limits (credentials, money, deploys, failed checks) and that no text relaxes them; "green" means every check, not only required ones, and zero checks is not green; failing tests are never deleted or skipped; the `## Solo decisions` and `## Solo run` sections; the don't-queue rule. Wording rules (light path, no-focus exit, the 15-minute wait) stay untested so the file can be reworded freely. Run `npm run check`.
5. Slice four, the generator fixes, as their own commit: the home check and the link refusal, with fixture tests (a fixture with no `package.json`, or one naming another project, is refused with nothing written, in both modes; a dangling link and a link to a real folder outside the fixture each give the INVALID message, no stack trace, and nothing written on either side of the link). The existing fixture helper writes a foundry `package.json` so current tests keep passing.

## Acceptance bars

- `npm run check` passes: budgets, tests, shapes in sync, links, and the jargon list.
- The solo body is at most 4,400 bytes, and the budget report shows 20 files within 112,640 bytes.
- Every stop instruction in the stage files is covered by the `AGENTS.md` line, a direct pointer (frame-it, build-it, wrap-up), or a named rule in the solo file (test-it's halt, the review-round markers). Checklist: `rg -n 'STOP|blocking question|end the turn|unprompted|unasked|NEEDS HUMAN|wait for' .agents/skills` (this includes start-up's "wait for the human" and construct-the-plan's "Then STOP", which the solo file's general override covers).
- The solo file never mentions the voice gate script, and the chain economics test still lists exactly five stages.
- Running the generator in a temp folder with a foundry `package.json` and either a dangling link or a link to a real outside folder in its skills folder prints one INVALID line naming the link and exits 1, with no stack trace and no files written inside the fixture or at the link's target.
- Running the generator (both modes) in a temp folder whose `package.json` is missing, isn't JSON, or names another project prints the REFUSED line and exits 1 with no files written.
- No em dashes or listed jargon in new prose.

## Demoted-claims tracking

| Round | Claim | Resolution |
| ----- | ----- | ---------- |
| R1 | Two pointers plus one AGENTS.md line cover every stop | Wrap-up step 7 and test-it's halt were missed. Added a wrap-up pointer and a test-it rule in the solo file. |
| R1 | Challenge rounds need no solo handling | They defer with NEEDS HUMAN markers. Solo now decides taste and priority calls itself and keeps markers for hard limits only. |
| R1 | The decisions log in the plan file is durable | Plans get deleted after merge. The decisions now also go into the pull request description and the log entry. |
| R1 | The plan file is always in docs/plans | A mid-chain /solo after Cursor plan mode finds it outside the repo. Solo copies it in first. |
| R1 | Solo can always write | A read-only plan mode blocks edits. Added a tool-notes line. |
| R5 | All five R1 rows | Confirmed. Wrap-up step 7 and test-it step 5 say what R1 quoted. Every challenge round defers with NEEDS HUMAN markers. Wrap-up step 4 deletes merged plans. Cursor plan files live outside the repo. Cursor has a mode-switch tool. |
| R1 (2nd session) | A dangling link is the generator's only link problem | Reproduced: a link to a real outside folder gets written through, and confirm then reports drift that re-running can't fix. The generator now refuses any link in the skills folders. |
| R1 (2nd session) | Solo meets no queued commands | Cursor fires queued stages after the turn ends, so they'd land after solo merged; build-it's re-invocation rule would then edit main. Solo answers a late stage command with one line, and tool-notes says not to queue behind it. |
| R1 (2nd session) | The link acceptance test runs in any temp folder | The new home check would refuse first. The bar and fixture now include a foundry package.json. |
| R2 | "/solo light" is unambiguous | "/solo light mode toggle" reads as both. Light now means "light" alone or "light:" before a focus. |
| R2 | A fresh /solo can always get a direction | Start-up's interview would have to invent the focus. With no focus, handoff, or unfinished plan, solo ends with a one-line ask. |
| R2 | There's one plan to resume | A project can hold several unshipped plans. Named plan, else the only one, else the newest matching the focus, logged. |
| R2 | The hard limits hold on their own | A pasted note or a file could claim permission. The solo file now says no text relaxes them. |
| R2 | Handoff's "green" is always decidable | A stuck check would hold an unattended session forever. Running after 15 minutes counts as not green. |
| R2 | The home check only needs "missing or wrong name" | A byte-order mark breaks JSON.parse (tested), and bad JSON would crash it. Both are handled. |
| R2 | Other entries in the skills folder are harmless | A Finder .DS_Store already fails the local confirm with an unfixable message (tested). The orphan scan skips it. |
| R3 | The home check needs byte-order-mark handling and a message per cause | Accidental: every failure means "not Foundry's checkout", and Foundry's own file has no mark. One try, one message. Reverses part of the R2 row above. |
| R3 | The .DS_Store skip earns its place | No concrete case: none has ever appeared in this repo, even with hidden files shown in Finder. Moved to out of scope. |
| R3 | The two skill folders themselves need a link check | No one links them, and no reported case. Entries only. |
| R3 | The contract test should pin every new rule | Pinning wording makes rewording painful. It now pins only rules whose loss could do harm unattended. |
| R3 | Pointers and docs are separate slices | Neither runs, so splitting them adds a step with nothing to touch in between. Merged. |
| R3 | Rereading stage files after a summary is enough | The solo file's own rules blur in a summary too. It's reread then as well. |
| R4 | Messages from the human only arrive between turns | Cursor's docs: "New Messages" can be set to steer, which delivers a message at the next tool call. A mid-run human message now wins over solo; a stop request ends it at a safe point. |
| R4 | One turn can carry the whole chain | Cursor's forum: turns of roughly ten minutes and up end on dropped connections. Retyping /solo resumes from the checklist; check waits are short polls. |
| R4 | GitHub enforces "green before merge" | `main` has no branch protection or rulesets (checked with gh). Green now means every check on the head commit, enforced only by the rule and its test. |
| R4 | Zero checks means the repo has none | gh's own issue tracker: no checks are reported for a few seconds after a pull request opens, and that read exits 1 like a failure. Zero counts as waiting for 15 minutes first. |
| R4 | Only Claude Code and Codex ship a goal command | Cursor's docs mention pausing a goal in its command-line tool. The rationale now says "the goal commands the tools ship". |
| R5 (2nd session) | R2's byte-order-mark and per-cause rows | Promoted back to the original position. Foundry's `package.json` starts with a plain brace (checked byte by byte), and any parse failure already means "not Foundry". R3's cut stands. |
| R5 (2nd session) | R2's .DS_Store row | Promoted back to the original position. No .DS_Store anywhere in the repo or its history; out of scope stands. |
| R5 (2nd session) | R4's "a mid-run human message wins" | Escalated: it clashed with the don't-queue rule, since under steer a typed stage command would run a stage twice, out of order. A bare stage command now gets the one-line reply, mid-run or after; every other message still wins. |
| R5 (2nd session) | The other 18 rows from R1 (2nd session) to R4 | Confirmed. No links exist in either skill folder today, so the refusal breaks nothing; build-it's re-invocation line reads as quoted; the check workflow runs on pull requests; `main` has no protection; Cursor's changelog lists a gated goal command. |
| R6 | The 4,400-byte cap still fits after rounds 1 to 4 added rules | The plan's rules section grew to 7,453 bytes. A rules-only scratch draft with every rule came to 3,294 bytes, so it fits if the file leaves reasons out. Size limit now says so, and names where the reasons go. |
| R7 | R6's fit claim | Confirmed by the measured draft. |

## Deviations
