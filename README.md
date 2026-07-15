# Foundry

> Not published yet. This repo is being assembled and hasn't had its voice pass or its final read. Nothing here is an invitation until it goes public.

Foundry is an agent process for building software meant to last. Designers follow a design process; this is the same idea pointed at working with a coding agent. Named stages you run in order, because the work comes out better than winging it.

It grew out of months of daily use building a real game, and it's the practical half of the blog series that starts with [How to Make Friends and Influence Agents](https://simoncorry.com/blog/2026/05/26/how-to-make-friends-and-influence-agents). The chain has grown a little since that post published.

## The chain

Start up, construct the plan, frame it (the agent interviews you), challenge the plan, build it, test it, security check, challenge the implementation, wrap up, hand off. Plus quiz, an opt-in comprehension check on anything that just shipped.

Every command is a plain markdown file. Cursor and Claude Code read their command folders the moment you open the repo. Codex reads each command as a skill you invoke by hand. Any other tool works by pasting a command file into the chat. Details in `docs/`.

One rule if you edit anything: `.cursor/commands/` is the source of truth. The Claude and Codex shapes are generated from it (`npm run shapes`), and `npm run check` fails if they've been edited directly. The same check runs the tests, fails on any reference to a file or heading that doesn't exist, and fails on listed jargon in committed prose; one workflow runs all of it on every push.

## Status

Scaffolding in progress. The full README (what each stage does, the honest cost section, how this differs from the built-in commands, the design-process mirror) lands with the voice pass before publish.

MIT licensed.
