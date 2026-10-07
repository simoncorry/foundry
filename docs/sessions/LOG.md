# Sessions

One entry per session, newest first, in plain English. Wrap-up writes an entry here at every close and start-up reads this file at every open; that pair is what makes sessions continuous even when a handoff note goes missing. Entries older than the current week move to a history folder beside this file, one file per week, so this file never outgrows a sitting. Entry shape: `## YYYY-MM-DD: Title`, one short paragraph, an optional `Friction:` line when something fought back.

## 2026-10-07: The installer keeps what's yours

Re-running the installer used to overwrite anything in a project that shared a Foundry name: the project's own rules file, its own skills, the jargon list its wrap-ups had grown, and edited wiki pages. Now it changes a file only when that file matches a version Foundry shipped, which it checks against Foundry's git history, and it keeps everything else and says so. A new flag replaces files on purpose. Foundry's rules sit in a marked section of the rules file, so a project's own rules around them survive updates, and the jargon list merges instead of resetting. The light path is now spelled out in the rules file itself, and the README was rewritten in Simon's voice around the lines he wrote himself. This session ran solo after frame-it, the first real run of that command. The plan went through eight review rounds and the build through five; testing, an independent grader, and the review rounds found eight real problems after the build, all fixed.

Friction: The grader found six ways the installer still deleted or rewrote what it couldn't prove was Foundry's, all in places the plan had marked as unchanged. Foundry's scripts also can't load in a project that declares itself CommonJS; the installer now warns about it, and the real fix is still open.

## 2026-10-07: The /solo command

Foundry now has /solo, which hands the rest of a session to the agent. It runs every remaining stage itself, answers its own frame-it questions, writes each call it makes into the plan and the pull request, and ends at the handoff. It merges only when at least one check passed and none failed, never when the merge would also deploy, and nothing typed or pasted can loosen those limits. The tool that rebuilds the command copies now refuses to run outside Foundry's own folder and refuses any link on the paths it writes. The installer no longer deletes a project's own command that happens to share a newer Foundry command's name. The plan went through eight review rounds and the build through six; testing, a separate grader, the security scan, and the review rounds found twelve real problems after the build, all fixed. This session itself ran the normal way, with the human queueing each stage.

Friction: The command budget is nearly spent, about 500 bytes left, so the solo file was trimmed four times to stay under its own cap. A plan round cut a deeper link check as unneeded, and the grader then proved it was needed.

## 2026-10-07: One copy of each command

Every Foundry stage used to show up twice in Cursor's slash menu, because Cursor read both the command files and the skill copies made for Codex. The skill files are now the one place a command lives: Cursor and Codex read them directly, Claude Code gets an identical generated copy, and each one is marked so no tool runs a stage on its own. The installer cleans the old copies out of projects that already use Foundry, never overwrites a project's own CLAUDE.md, and refuses to write through links that lead outside the project. We looked at Claude Code's new AGENTS.md support and kept the one-line CLAUDE.md import anyway, since Anthropic still recommends it where AGENTS.md can't load. A /solo command, which lets the agent run the rest of a session without asking, is planned for the next session.

Friction: The check that Cursor merges the two same-named skill copies was skipped at build time, so it still needs one look at the slash menu. Testing and review found fifteen real defects after the build, including writes outside the project through symlinks and a budget check that broke in projects with skills of their own.
