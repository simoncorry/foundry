# Tool notes

Foundry's commands are plain markdown and assume nothing tool-specific. This page collects the per-tool detail that used to live inside the commands, for whoever wants it. Most of it is Cursor, where the chain grew up.

## Claude Code

Claude Code reads each command from `.claude/skills/<name>/SKILL.md`, a byte-identical copy of the skill file the generator writes, because Claude Code doesn't read `.agents/skills/`. The open request to add it is anthropics/claude-code issue 31005. It also asked for `AGENTS.md` support, and only that half shipped, in 2.1.277. When `.agents/skills/` support lands, the Claude copy can go. The header's manual-only switch (`disable-model-invocation: true`) means Claude runs a stage only when you type it.

The shared rules come in through CLAUDE.md's one-line `@AGENTS.md` import. Since version 2.1.277 (September 2026) Claude Code can read `AGENTS.md` on its own when a project has no `CLAUDE.md`, but Foundry keeps the import. Anthropic's own docs recommend it for sessions that can't load `AGENTS.md`, and older versions need it. Two cases quietly switch that fallback off, even with the import kept elsewhere: a CLAUDE.local.md, or a `CLAUDE.md` in a folder above your project. Claude Code then reads that file instead of `AGENTS.md`, so give it the import line too.

## Codex

Codex reads each command as a skill at `.agents/skills/<name>/`, invoked with a dollar sign (`$build-it`). It ignores the header's manual-only switch; the policy file beside each skill, `.agents/skills/<name>/agents/openai.yaml`, does that job for Codex, so the chain keeps its deliberate-checkpoint feel and Codex won't jump a stage in on its own. Codex loads the extra header line without complaint at runtime. Its skill installer's validator is stricter and rejects it ("Unexpected key(s) in SKILL.md frontmatter"), but Foundry never installs through that path. If you use some other tool entirely, the universal floor still applies: every command is plain markdown, so paste the skill file into the chat and it runs.

## Cursor: command loading

Cursor reads `.agents/skills/<name>/SKILL.md` as one of its own skill folders the moment you open the repo, and the folder name becomes the slash command. Zero setup. The header's manual-only switch turns each skill into a deliberate slash command, so Cursor never applies a stage on its own. Foundry used to ship a separate Cursor commands folder as well. Cursor listed those commands beside the skills, so every stage appeared twice; re-running the installer clears the old copies out of a project.

Cursor also loads `.claude/skills/` for compatibility, so it sees each skill twice by name. Cursor staff reported that version 3.17 merges same-named skills across its skill folders (forum thread 160677, August 2026). The two copies are byte-identical, so whichever one Cursor keeps is the same file. That report was about personal skill folders. If a stage still shows twice in a project's slash menu, Cursor isn't merging there, and the fix belongs in Foundry's layout, not in your settings. Don't fix a duplicate by turning off Cursor's "Include Third-Party Plugins, Skills, and Other Configs" setting. Cursor staff have said it can stop `.agents/` loading too, which would remove every Foundry stage.

## Cursor: plan mode

Cursor has a plan mode that drafts plans in a workspace folder outside your repo. Foundry's construct-the-plan command writes plans straight into `docs/plans/` instead, so nothing here depends on plan mode existing. If you use plan mode anyway, move the result into `docs/plans/<slug>.md` before building, so the plan lives in git next to the work. If you type `/solo` while plan mode is on, the agent switches to its editing mode where Cursor allows it; where it can't, it says so in one line, since that mode is your setting.

## Cursor: blocking questions and the timeout bug

Cursor's blocking question dialog (the AskQuestion tool) has a documented bug where an idle connection timeout can answer the dialog by itself with a literal "Questions skipped by the user" response (Cursor forum threads 158485, 160858, 163317; confirmed by Cursor staff, reproduced on builds through mid-2026). The chain's rule (a timed-out question is HALT, never consent) exists because of this: if an unattended run can have its questions answered by a timeout, the only safe reading of a skipped question is "stop and wait for the human."

## Cursor: transcript-driven jargon discovery (optional, not shipped)

The phrase list grows through wrap-up's jargon step: the agent re-reads its own session and appends what it had to explain. That works in every tool. Cursor users who want extra signal can additionally scan Cursor's on-disk session transcripts for jargon candidates and feed those in too; it's a nice-to-have with real setup cost, so Foundry doesn't ship it and nothing depends on it.

## Cursor: hooks

Cursor can inject session-start context via hooks, but injection has a confirmed timing race (staff-acknowledged, no fix as of July 2026) where the output silently never arrives. Treat hook injection as a nice-to-have and keep the manual path dependable: start-up runs its own checks rather than trusting anything was injected.

## Cursor: queued chains

Cursor processes queued messages when the current turn ends, which is what lets you queue the whole chain (`/challenge-plan-2` through `/handoff`) and walk away. Two disciplines make that safe: never end a turn while something the next command depends on is still pending, and use a blocking question (not a printed refusal) when the chain must stop, so the queue halts at the failure point instead of firing every remaining command into a dead state. Don't queue stages behind `/solo`; it runs them itself, and a stage command that reaches it gets a one-line reply. Cursor's "New Messages" setting (Settings, Agents, Conversation) can also be set to steer instead of queue, which delivers a message typed mid-run at the agent's next tool call rather than after the turn.
