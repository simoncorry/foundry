---
id: single-command-copy
status: SHIPPED
created: 2026-10-07
---

# One copy of each command in Cursor

## What and why

Every Foundry stage shows up twice in Cursor's slash menu. Cursor reads the command files in its commands folder, and it also reads the skill copies we generate for Codex in `.agents/skills/`. Cursor lists commands and skills side by side and never merges a skill into a command with the same name, so `/build-it` appears once as a command and once as a skill. Codex can only read `.agents/skills/`, so those skill files have to stay.

The fix is to stop shipping a copy Cursor reads as a command. The skill files in `.agents/skills/` become the one place you edit, and Cursor and Codex both read them directly. Cursor's own docs are steering people toward skills too. Claude Code moves from its legacy commands folder to its skills folder, with a generated copy.

There's also a quieter problem this fixes. Cursor treats skills as things it may apply on its own, so today it can decide to run a Foundry stage without being asked. Each skill copy will carry the `disable-model-invocation` setting that Cursor documents for this, which turns a skill back into a deliberate slash command. Codex keeps its separate policy file for the same reason.

## What ships

- `.agents/skills/<name>/SKILL.md` becomes the source you edit. You write the instructions; the generator writes the short header at the top (name, description, and the manual-only switch) from the folder name and the first sentence, so the header can't drift from the text. The file is still plain markdown you can paste into any tool.
- The generator then copies each `.agents/skills/<name>/SKILL.md` byte-for-byte to `.claude/skills/<name>/SKILL.md` for Claude Code, and keeps writing Codex's `.agents/skills/<name>/agents/openai.yaml`. Because the two copies are identical, it doesn't matter which one Cursor keeps when it merges them. Cursor's and Claude's commands folders go away, which takes Foundry from four files per stage to three.
- Re-running the installer on a project that already has Foundry removes the old copies from Cursor's and Claude's commands folders. It removes only files whose names match a Foundry stage, lists each one it removes, and shows them in `--dry-run` without touching anything. The project's own commands are left alone.
- `CLAUDE.md` stays as Foundry's one-line `@AGENTS.md` import. Since version 2.1.277 (September 18, 2026), Claude Code reads `AGENTS.md` on its own when a project has no `CLAUDE.md`, and every release channel has it now. But Anthropic's own docs still say to keep the import "in sessions that can't load `AGENTS.md`", and in any Claude Code older than 2.1.277 (this machine runs 2.1.212). Keeping an 11-byte file that works everywhere beats deleting it to save one file.
- The real `CLAUDE.md` hazard gets fixed instead: today the installer overwrites a project's own `CLAUDE.md` with the one-line import. The installer will create `CLAUDE.md` only when the target has none. When the target already has a `CLAUDE.md` or a `CLAUDE.md` inside the `.claude` folder that doesn't import `AGENTS.md`, it leaves the file alone and prints one line. Claude Code reads that file instead of `AGENTS.md` (it falls back, it doesn't merge), so the project needs to add `@AGENTS.md` to it. The rarer cases, a CLAUDE.local.md or a `CLAUDE.md` in a folder above the project, get one sentence in the tool notes.

## Calls I made for you

- **The skill files are the source.** An earlier draft added a separate source folder that no tool loads. That meant a fourth file per stage and a new folder to find, just to keep the source free of a short header. Editing the skill file directly removes both. The cost is that the generator now rewrites the header of the file you edit. It only ever touches those header lines, and the confirm check fails if they're stale.
- **Claude Code moves to skills now.** The tool notes already list a skills-based Claude shape as the planned move once the commands folder is retired. Doing it now means Cursor sees two skill copies with the same name. Cursor 3.17 fixed duplicate skill loading by merging same-named skills across its skill folders (Cursor staff on forum thread 160677, August 14, 2026). This machine runs Cursor 3.23.23.

## Honest risks

- **Cursor's merge is reported, not yet seen on a project folder.** The staff fix note covers user-level folders. A throwaway project at the /tmp/foundry-probe project confirms it for project folders in ten seconds, and that check is a gate before build (see Taste checkpoints). Turning off Cursor's third-party switch is NOT a safe fallback. Cursor staff on the same thread said the switch also stops loading from `.agents/`, which would remove every Foundry stage from Cursor. If the merge fails, the plan comes back to frame-it rather than shipping duplicates.
- **Codex and the extra frontmatter line.** Codex's runtime skill loader ignores keys it doesn't know (its frontmatter struct has no strict-field setting), so the line is safe in `.agents/skills/`. Codex's install-time validator is stricter. It rejects `disable-model-invocation` with "Unexpected key(s) in SKILL.md frontmatter", but it only runs when someone installs a skill through `$skill-installer`, and Foundry doesn't install that way. Codex itself still uses `.agents/skills/<name>/agents/openai.yaml` for the same job, which is why that file stays. The tool notes record the validator caveat.
- **Projects already on Foundry** keep their duplicates until they re-run the installer. The README's update line says so.
- **Claude Code still doesn't read `.agents/skills/`.** The open request to add it is anthropics/claude-code issue 31005; version 2.1.277 shipped only its `AGENTS.md` half. So the `.claude/skills/` copy stays.

## Out of scope

The /solo command. Its plan (in Cursor's plan folder, not yet copied in) reads stage files by path, so it lands after this one and points at the new layout.

The installer also overwrites a project's own `AGENTS.md`. That predates this work and the README already warns about it ("treat your copies as consumed"). It's recorded here so it isn't lost, and it isn't fixed in this change.

## Taste checkpoints

- **Before build:** open the /tmp/foundry-probe project in Cursor and type /probe in the chat. You should see `probe-alpha` once, which confirms the merge. `probe-beta` should show twice, as a command and a skill; that's today's duplicate, reproduced. If `probe-alpha` shows twice, stop and re-plan.
- After the build, Foundry's own slash menu shows each stage exactly once.

---

## Inputs

- `scripts/generate-command-shapes.js` (source folder, shapes, orphan scan), `scripts/install.js` (`COPY_SET`), `scripts/check-context-budgets.js` (reads the source folder), `scripts/check-links.js` and `scripts/check-jargon.js` (walk the source folder; check-links resolves slash-command mentions to a source file).
- Tests that name the paths: `tests/generate-command-shapes.test.js`, `tests/check-context-budgets.test.js`, `tests/check-jargon.test.js`, `tests/check-links.test.js`, `tests/install.test.js`, `tests/chain-economics-contract.test.js`, `tests/handoff-pr-authority.test.js`.
- Docs: `README.md` (install copy list, "If you edit anything", "A session, end to end"), `docs/tool-notes.md` (Claude Code, Codex, and Cursor command-loading sections).
- Evidence: Cursor's command loader keys commands by filename, so a Cursor command and a Claude command with the same filename merge (read from Cursor's bundled workbench code). Skills load from `.agents/skills/` as a native folder and from `.claude/skills/` for compatibility (Cursor's skills docs). Whether the third-party switch also stops `.agents/` is disputed: forum thread 166558 says no, and staff on thread 160677 say yes. The plan doesn't depend on either answer. Same-named skills merge as of Cursor 3.17 (thread 160677). Codex: repo skills come only from `.agents/skills/`, and same-named skills there are not merged (developers.openai.com/codex/skills). Its loader ignores unknown frontmatter (codex-rs/core-skills/src/loader.rs in the Codex repository). Its validator rejects them (mattpocock/skills issue 360).

## File-tree change

```diff
- Cursor commands folder               source
- Claude commands folder               generated byte-copy
  .agents/skills/<name>/SKILL.md      source (body hand-edited, frontmatter generated): Cursor and Codex
  .agents/skills/<name>/agents/openai.yaml   generated: Codex
+ .claude/skills/<name>/SKILL.md      generated byte-copy: Claude Code
```

The frontmatter is `name` (always the folder name, as the Agent Skills standard and Cursor require), `description` (the body's first sentence, built the way `firstSentence()` builds it today), and `disable-model-invocation: true`. Today's "Generated from" comment line is dropped from both copies, which keeps them byte-identical. The "edit `.agents/skills/`, run `npm run shapes`" instruction lives in the README's "If you edit anything" section, and in the confirm mode's failure message.

```diff
  generate-command-shapes.js
-   read .cursor/commands/<name>.md -> write .claude/commands, .agents/skills SKILL.md + openai.yaml
+   for each .agents/skills/<name>/SKILL.md:
+     split frontmatter from body; rebuild frontmatter from <name> + body
+     write mode: rewrite SKILL.md if the frontmatter changed; write .claude/skills copy and openai.yaml
+     confirm mode: fail on stale frontmatter, a differing .claude copy, a missing openai.yaml, or orphans
  check-context-budgets.js
-   bytes of .cursor/commands/*.md
+   bytes of each SKILL.md body, frontmatter excluded (the 3,968 header bytes would otherwise push the total to 111,498 of 112,640)
```

### Header rules (the generator rewrites hand-edited files, so these are exact)

- **Splitting.** One exported function, `splitSkill(text)`, is used by the generator and the budget checker alike, so the two can't disagree. It lives in its own side-effect-free module, `scripts/skill-file.js`, because `scripts/generate-command-shapes.js` does all its work at the top level of the file, and importing from it would run the generator inside the budget check (see Deviations). It strips a leading UTF-8 byte-order mark. A header exists only when the file's very first line is `---`; it ends at the next line that is exactly `---`. Both checks accept `\r\n`. A `---` anywhere else is body text. That matters because construct-the-plan's body has a YAML example framed by `---` lines, and handoff's has a `---` divider. A file without a header (a brand-new skill) is all body.
- **Body boundary.** The header is written as `---\n` + three lines + `---\n\n`, and the body is everything after that blank line, byte-for-byte. The split takes at most one blank line after the closing `---`, so the body round-trips exactly.
- **Never stack a header.** If the body after splitting still starts with a `---` line, the generator fails and names the file. The usual cause is a byte-order mark or a stray blank line above an old header, and silently adding a second header would bury the first one in the instructions.
- **Never drop a hand-added key.** The header's key lines are read as plain `key:` prefixes, with no YAML library. Any key other than `name`, `description`, and `disable-model-invocation` fails the run with a message to add it to the generator or remove it. For example, someone might add Cursor's `paths` or `icon` by hand; without this, the next generator run would delete it quietly.
- **Values.** `name` and `description` stay single-quoted, with an apostrophe doubled (handoff's "what's" becomes `what''s`), exactly as `firstSentence()` does today. `disable-model-invocation: true` is an unquoted boolean, because a quoted `'true'` is a string, which a tool may not read as on.
- **Comparison.** Confirm mode compares the regenerated header text with the file's header text after normalizing line endings, so a Windows checkout doesn't report false drift.
- **Check everything before writing anything.** The generator validates all 19 skills before it writes a single file, as today's `expected()` already does: work out every output first, then write. A bad header key in the twelfth skill must not leave eleven rewritten.
- **Fail loudly on input the tools would skip silently.** These cases fail with the file named: a folder name that isn't lowercase letters, digits, and single hyphens; an empty body; or an empty first sentence. Cursor and the Agent Skills standard reject such skills, and they would simply not appear in the menu.

## Steps

1. Branch `single-command-copy`, flip this plan to IN_PROGRESS, and commit it.
2. Gate: the the /tmp/foundry-probe project check from Taste checkpoints has been answered at frame-it. If it hasn't been answered, hold.
3. Rewrite the generator per the sketch above. Seed each `.agents/skills/<name>/SKILL.md` with the old Cursor command file content as its body. Don't split today's files to get the body: their body still starts with the old "Generated from" comment line, which would survive the split. Run `npm run shapes`, then delete Cursor's and Claude's commands folders. Each `.agents/skills/<name>/SKILL.md` body must equal its old Cursor's commands folder file byte-for-byte; verify that with a one-off diff before deleting. Then confirm that `npm run shapes -- --confirm` is clean.
4. Point the budget checker at `.agents/skills/<name>/SKILL.md` bodies with the frontmatter excluded, and point the links and jargon checkers at `.agents/skills/*/SKILL.md`; they still skip `.claude/`. A slash-command mention resolves to `.agents/skills/<name>/SKILL.md`.
5. Installer: the new `COPY_SET`, plus removal of stale Foundry-named files from Cursor's and Claude's commands folders in the target, reported as `remove <path>` and honoured by `--dry-run`. Removal runs only after every copy has succeeded. A copy that fails partway then leaves the old commands in place, rather than a project with neither the old commands nor the new skills.
6. Update the tests to the new paths, and add installer tests for the removal: stale Foundry files are removed, the project's own same-folder commands survive, and a dry run removes nothing.
7. Keep `CLAUDE.md`. Move it out of the installer's always-overwrite `COPY_SET` into a create-only step, which writes it only when the target has none. Add the one-line notice, which fires when the target has a `CLAUDE.md` or a `CLAUDE.md` inside the `.claude` folder that doesn't contain `@AGENTS.md`. Update `tests/install.test.js`.
8. README and tool notes. Cover the new layout, the update path, and Cursor 3.17 as the version that merges same-named skills. Add the Codex validator caveat, and say that Claude Code 2.1.277 can read `AGENTS.md` without the import but Foundry keeps the import for older versions and sessions that can't. Rewrite the tool notes' "Cursor: command loading" section, which describes Cursor's commands folder and calls the source "frontmatter-free", so it describes the skill files instead. Leave the third-party switch out entirely; it might hide `.agents/skills/` too.
9. Run `npm run check`.

## Acceptance bars

- `npm run check` passes.
- No Cursor's commands folder or Claude's commands folder folder exists in the repo. Searching for those paths finds them only in the installer's removal logic, its tests, and the docs that explain the move.
- `.agents/skills/` and `.claude/skills/` each hold 19 skills. Each body matches its old Cursor's commands folder file byte-for-byte, and each pair of `.agents/skills/<name>/SKILL.md` files is byte-identical. The confirm mode catches three kinds of drift: a hand edit to the `.claude/` copy, a stale header in the source, and a stray file.
- Installer tests prove three things: stale Foundry-named files are removed, a non-Foundry command in the same folder survives, and `--dry-run` writes and removes nothing.
- The budget report still reads 19 files and 107,530 bytes, the same as before the move.
- Generator tests cover the header rules, using fixture trees through `SHAPES_ROOT`:
  - construct-the-plan's real body round-trips byte-for-byte, despite its `---` lines;
  - a header-less body gets a header;
  - a byte-order mark and Windows line endings are accepted without a second header or false drift;
  - an unknown header key fails;
  - an invalid folder name and an empty body each fail;
  - two runs in a row leave the files unchanged.
- A test proves that importing `splitSkill` doesn't run the generator; nothing gets written.
- Installer tests for `CLAUDE.md`:
  - a target with no `CLAUDE.md` gets Foundry's one-line import;
  - a target's own `CLAUDE.md` survives byte-for-byte on install and re-install;
  - the notice prints when that file lacks `@AGENTS.md`, and stays silent when it already has it.

## Demoted-claims tracking

| Round | Claim | Resolution |
|---|---|---|
| R2 | Codex's handling of extra frontmatter is unknown and needs a build-time check | Resolved by research: the runtime loader ignores unknown keys, and only the `$skill-installer` validator rejects them. The key stays, the caveat goes in the tool notes, and the build step is replaced by the probe gate. |
| R2 | Turning off Cursor's third-party switch is a safe fallback | Cursor staff say the switch also stops `.agents/` loading. Removed. A failed probe sends the plan back to frame-it instead. |
| R2 | Same-named skill merging in Cursor is unknown | Cursor 3.17 fixed it, and this machine runs 3.23.23. The copies are now byte-identical so the merge can't pick the wrong one. The probe still confirms it before build. |
| R2 | Only the target's own `CLAUDE.md` blocks the AGENTS.md fallback | Claude Code checks parent folders, a `CLAUDE.md` inside the `.claude` folder, and CLAUDE.local.md too. The installer notice and its tests now cover all of them. |
| R2 | Every Cursor surface shows `.agents/skills/` in the slash menu | A reported command-line bug scanned only Cursor's own skills folder, and its fix status is unconfirmed. Added as a risk and a tool-notes caveat. |
| R3 | A separate source folder (an unloaded folder) is needed | It only existed to keep a short header out of the source. The `.agents/skills/` files are now the source, with the generator writing their header. That removes a folder, 19 files, and the hidden-folder call. |
| R3 | The installer should walk parent folders and check three filenames for `CLAUDE.md` | The common case is the project's own file. The installer checks `CLAUDE.md` and a `CLAUDE.md` inside the `.claude` folder in the target only. Parent folders and CLAUDE.local.md get a tool-notes sentence. One test is dropped. |
| R4 | Splitting a header from the body is trivial | construct-the-plan and handoff both contain `---` lines in their text. The header is only recognized at the very first line and ends at the next whole `---` line, with a test on construct-the-plan's real body. |
| R4 | Rebuilding the header from scratch loses nothing | It would silently delete hand-added keys like Cursor's `paths`. An unknown key now fails the run. |
| R4 | Running the generator twice gives the same result on any file | A byte-order mark or a blank line above an old header would make it stack a second header. It now strips the mark, accepts Windows line endings, refuses to stack, and has a run-twice test. |
| R4 | Any folder name and body make a working skill | An invalid name or empty description makes the tools skip the skill silently. Both now fail loudly. |
| R4 | The budget checker and generator split headers the same way | Nothing guaranteed it. They now share one exported function. |
| R5 | (R2, Cursor command-line menu) | Promoted. The bug report is from March 2026, and staff said the fix would ship in the next release. The stated workaround (name the stage in plain words) also contradicted the manual-only switch. Risk and caveat removed. |
| R5 | (R2, CLAUDE.md fallback scope) | Escalated. Anthropic's memory docs say to keep an `@AGENTS.md` import "in sessions that can't load `AGENTS.md`", and older versions need it too. `CLAUDE.md` now stays. The installer creates it only when missing and never overwrites a project's own file. |
| R5 | (R4, running twice gives the same result) | Escalated. Today's skill bodies start with the old "Generated from" comment, so splitting them during the move would keep that line. Step 3 now seeds bodies from Cursor's commands folder. |
| R5 | (R4, one shared split function) | Escalated. The generator runs its whole job when the file is loaded, so importing from it would run it. It now gets the invoked-directly guard, plus a test. |
| R5 | All other R2 to R4 rows | Confirmed. Codex's loader enforces only length limits (64 for names, 1,024 for descriptions), and the longest Foundry description is 167. construct-the-plan's `---` lines are at 18 and 22, and handoff's is at 35. Cursor's code doesn't show the skill merge either way, so the probe gate stays. The third-party switch evidence is still disputed. |
| R6 | The generator's writes are safe to stop partway | Only if it checks everything first. That's now stated as a header rule. |
| R6 | The installer's order of copy and removal doesn't matter | Removing first, then failing a copy, would leave a project with no Foundry commands at all. Removal now runs last. |

## Deviations

- **Probe gate (Step 2).** Plan: hold until the /tmp/foundry-probe result is in. Forced: at build time the human chose to skip the check. Chosen: build anyway; the merge gets confirmed in Foundry's own slash menu after the build (the second taste checkpoint). Lesson: a gate that needs a person to look should be asked at frame-it, not discovered at build.
- **Shared split function (Header rules, Splitting).** Plan: export `splitSkill` from `scripts/generate-command-shapes.js` and move its top-level work behind a run-only-when-called-directly guard. Forced: that guard means copying about fifteen lines of argument-path handling from `scripts/check-context-budgets.js`. Chosen: a small side-effect-free module, `scripts/skill-file.js`, that both scripts import. The generator stays a plain script. The acceptance test "importing does not run the generator" becomes moot, and a test that the budget counts bodies only replaces it. Lesson: when two scripts need shared code, a third module is simpler than making one script importable.
- **Description length (Header rules, Fail loudly).** Plan: fail on an empty description. Forced: the Agent Skills standard caps a description at 1,024 characters, and an older Codex loader enforced that cap (`MAX_DESCRIPTION_LEN`; its current parser, codex-rs/skills/src/parser.rs in the Codex repository, checks only that the description isn't empty). Chosen: `skillProblems()` fails on an over-long description too, because the standard is the shared contract and a tool may enforce it. Lesson: hold to the standard's limits rather than to one tool's current version of them; versions move.
- **Naming removed folders in prose (Acceptance bars, search clause).** Plan: docs that explain the move may name the old folders by path. Forced: `scripts/check-links.js` fails on any backticked or bare path that doesn't exist, and that includes plan files. Chosen: docs and this plan describe the old folders in words ("Cursor's commands folder"), and only code and tests name them by path. Lesson: a deletion plan has to be written so the link checker can still pass once the deletion lands.
