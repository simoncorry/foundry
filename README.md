# Foundry

Designers grew up with a process but in this age of AI they're being told to move beyond it in favor of tools that work faster. Foundry is here to bridge the gap between process and tool. An agent process that will feel strangely familiar: named stages that run in order and challenge the original problem statement from fresh angles.

Foundry grew out of months of daily use building a real game, [Sol Wilds](https://discord.gg/solwilds), and it's the practical half of the blog series [Design Process, Meet Agent Process](https://simoncorry.com/blog/2026/07/15/design-process-meet-agent-process).

Your coding tool (Cursor, Claude Code, Codex, whatever) is the harness: the thing that holds the agent, its permissions, and its tools. To be clear Foundry isn't that. Foundry is an agent process you run inside whichever harness you already use.

## The chain

There are ten stages plus two optional riders, and each one is a plain markdown command the agent reads. That's twenty command files in total, because two of the stages run as five rounds each.

**Start up** reads the ground before any work happens: the branch, the working tree, the note the last session left behind, and the sessions log. In design terms, it's re-reading the brief before the kickoff.

**Construct the plan** writes the plan as a file in your repo, split in two: a narrative half for you (the human) and a working-memory half for the agent. Nothing gets built from chat scrollback.

**Frame it** is the one stage where the agent interviews you: a short brief on the planned work first, then three to five questions, ordered by how much of the plan each answer would change. In design terms, the client interview.

**Challenge the plan** runs five review rounds before any code exists, each from a genuinely different angle, and the fifth re-reads everything the earlier rounds punted. In design terms, the crit: fresh eyes, a new focus, bringing it back to the original problem statement. Those findings get fixed in the plan before moving on.

**Build it** settles the plan and implements it. When the code forces a change to the plan, the agent doesn't stop to ask. It takes the conservative option and writes the change down in the plan file, and the first review round reads that list before anything else. You don't want the build to stall every time there's a small deviation (you wouldn't hover over a designer and ask them to stop every time they pushed a pixel). This is the prototype stage.

**Test it** writes tests against what the plan intended, not what the code happens to do. Designers already know this discipline: judge the work against the goal, not your bias.

**Security scan** is the optional stage for work that touches anything sensitive, like sign-in, payments, or anything a stranger can type into. It's an expert pass against a named checklist of the ways things go wrong, and every finding has to argue against itself before it makes the report, because agents (like juniors) want to look useful and will flag everything. In design terms, heuristic evaluation.

**Challenge the implementation** is five more rounds, this time against the code, with the same rule about rotating angles. The plan crit was about direction; this is the review that drives the work to shippable.

**Wrap up** cleans the workspace, grows the jargon list (a way to train your agent to stop talking gibberish), writes the session's log entry, moves anything worth keeping into the wiki, and opens the one pull request. It's the state you leave your desk in.

**Hand off** writes a short note for the next session: what's in flight, what's next, what would be hard to reconstruct cold. This is how you keep building a longer form project with confidence. Handoff keeps its OG design process name because that's exactly what it is.

**Quiz** is the first rider, and you can call it at any point. It quizzes you on a change that just shipped and teaches through the grading, so you actually understand what you merged. This will keep you honest so you learn as you build. If you don't have an engineering background I HIGHLY recommend you do this after every session.

**Solo** is the other rider. Type it at any point and the agent runs every remaining stage itself, all the way through the handoff. Anywhere a stage would normally ask you something, it makes the call, writes it down in the plan, and copies that list into the pull request so you can go back and overrule it. It still won't spend money, deploy, or merge past a failing check. Add `light` and it runs the light path (more on that below).

## The design process, mirrored

The Double Diamond (British Design Council, 2005) splits work into understanding the problem and building the thing right. The chain's first half (start up, construct the plan, frame it, the plan challenges) is the first diamond. The chain's second half (build it, test it, security scan, the implementation challenges, wrap up and hand off) represents the second diamond.

The crit is the cultural bridge and it forces some of our humanity back into an otherwise black hole of logic. The challenge rounds are structured critique with the classic rules built in: fresh eyes, because the agent can't see its own blind spots; a declared focus, which is the angle each round states up front; critique that proposes, so rounds fix what they find; and documented outcomes.

Two places you'll want to stay present. Frame it asks you directly for input, this is where your taste matters. The chain has no end-user research stage. That (to me) is still a deeply human step. In my game Sol Wilds I built a simulated player rig so you can take that route for battletesting basic UX fragility but otherwise always speak to your customers/clients for direct feedback.

## How this differs from the built-in commands

The tools already ship commands that look like they cover this ground. Claude Code and Codex both have `/goal` now: you give the agent a finish line and it keeps looping, turn after turn, until a separate check says it's done or the budget runs out. There's also `/init` to write a project memory file, `/compact` to shrink the chat history, `/review` to look over a diff, and `/plan` to think before coding. They're good, and `/goal` especially is genuinely impressive at what it does.

But look at what it's for: getting a machine to "done" with you out of the room. It optimizes for finishing, not for being right, and not for you understanding what happened along the way. The reasoning is a black box, you can't shape it as it runs, and when the terminal closes most of the context is lost. That's a fair trade for a weekend prototype. It's the wrong trade for something you mean to keep.

Foundry's bet is the opposite. Every stage is a checkpoint with a name and a job, and you're in the loop where your expertise matters: you approve the plan, frame it has the agent brief you and ask before anything gets built, the challenge rounds tell you what they found, the wrap up explains in plain English what changed. And the chain leaves a trail: the rules file, the plan, the session notes, the handoff note. That trail is the part that lasts, the thing that lets the next session, or the next person, pick up the soul of the project and not just its code.

Foundry has its own way to finish without you now, too. `/solo` runs the rest of the chain unattended, but it leaves the plan, every call it made, and the handoff note behind, so you can read back what happened and disagree with any of it.

If the work is throwaway, reach for `/goal`. It's faster and I mean that. Foundry pays off on a project you plan to keep living in, where the working relationship between you and the agent is worth something. And to be fair, all of these tools already let you write your own commands, so Foundry isn't doing anything they can't. It's the set I use every day, plus the habits and the memory around them, so you don't have to spend the months of trial and error I did.

## The memory and the library

Two folders stop every session from starting at zero. The sessions log in docs/sessions/ is what happened. Wrap-up writes one plain-English entry at the end of each session and start-up reads it at the beginning of the next. Once an entry is more than a week old it moves into a dated history file, so the log never gets too long to read in one sitting. The wiki in docs/wiki/ is what we know. It's one page per topic, and it grows at wrap-up whenever a session teaches something worth keeping. Every page needs a line in the index, and the check fails if a listed page is missing or a page isn't listed.

The wiki doesn't start empty. It ships with three reference shelves: engineering fundamentals (Brooks, Parnas, Naur, and the essential-versus-accidental and wrong-abstraction ideas the challenge rounds lean on), design fundamentals (the Norman-to-Rams canon, boiled down for arguments about hierarchy, grouping, type, and color), and motion (easing, springs, gesture feel, and what animation costs, adapted with credit from Emil Kowalski's and Meng To's MIT-licensed work). My agent cites Dieter Rams at me during reviews now. Start at [the index](docs/wiki/INDEX.md).

## What it costs

The full chain is thorough and it eats tokens. On a mid-size feature it probably lands in the low hundreds of thousands of tokens end to end, which is real money if you're paying per token. You'd think the review rounds are the expensive part. In the measured runs from the project Foundry grew out of, they often weren't: the build itself, rereading big files over and over, running the same checks twice, and late mechanical cleanup cost as much or more. The rounds also kept finding real defects late in the chain.

You don't have to run all of it every time. [The light path](docs/light-path.md) keeps every stage but runs two challenge rounds instead of five on each side. It usually does less work, but I can't promise a fixed saving, because that depends on the model, the tool, the task, and how much context is already loaded. Keep frame it either way, since a five-question interview is the cheapest insurance in the whole chain. Spend on the full chain when the work touches money or user data, or anything you'll be living with for months. The evidence, and the limits of what it proves, are in [chain economics](docs/wiki/engineering/chain-economics.md).

## A session, end to end

Here's what you actually type. Each stage is a slash command (the skill's folder name becomes the command in Cursor and Claude Code):

1. **start-up**, then tell it what you want built.
2. **construct-the-plan**, then read the narrative half it writes for you.
3. **frame-it**, and answer its three to five questions. This is your last required moment at the keyboard.
4. Queue the five **challenge-plan** rounds, **build-it**, **test-it**, **security-scan** if the work touches anything sensitive, the five **challenge-implementation** rounds, and **wrap-up**, then walk away. Everything after frame-it runs without you. Or type **solo** at any point and the agent runs the rest itself, frame-it included.
5. Come back to one pull request and a plain-English summary of what you now have. Run **handoff** when you want a bridge to next time. Invoking it also authorizes the agent to merge a ready pull request from that work, or close it without merging when it shouldn't ship. Run **quiz** whenever you want to be tested on what shipped.

## Getting started

There are two ways in.

Starting fresh? Clone this repo and build your project inside it. Everything's already wired up: Cursor and Claude Code pick up the commands the moment you open the folder, and Codex reads each one as a skill you call by hand.

Already have a project? Let the installer do the copying. From this repo's root, run `node scripts/install.js <your-project>`, adding `--wiki` if you want the reference library or `--dry-run` to see what it would do first. It copies the two tool folders (.agents/ and .claude/skills/), the rules file, and scripts/ into your project, and it writes a one-line CLAUDE.md if you don't have one yet. Re-run it after pulling Foundry to pick up the newer versions. (You can copy those folders by hand too, but then merging Foundry's rules into an AGENTS.md you already have is on you.)

The important part is that it won't trample your work. A re-run only updates files that are still an untouched copy of something Foundry shipped. Anything you wrote or edited stays put, and the report says it kept it. If you really do want Foundry's version back, add `--overwrite`. A few files get their own handling:

- **AGENTS.md.** Foundry's rules sit in a marked section between two comment lines, and the installer only ever refreshes that section, so your own rules above or below it survive every update. If you already had an AGENTS.md, Foundry's section goes in below what's there. Heads up that Codex reads only the first 32 KB of AGENTS.md by default and drops the rest without telling you, so the installer warns you when the file gets that big.
- **CLAUDE.md.** Never touched if you have one. Claude Code reads it in place of AGENTS.md (not alongside it), so if yours doesn't import AGENTS.md the installer tells you to add a line reading `@AGENTS.md`.
- **The phrase list.** Your project grows its own list of jargon at every wrap-up. An update keeps all of yours and adds Foundry's new ones after them.
- **Skills named like a Foundry command.** If you wrote your own `solo`, Foundry leaves it alone and skips installing its version.

Upgrading from an install older than October 2026? Re-run the installer. It clears out the old copies in Cursor's and Claude's commands folders that made every stage show up twice in Cursor, and it leaves your own commands in there alone.

The commands are plain markdown and need nothing running on your machine. The scripts/ folder comes along because the commands lean on its voice gate, phrase list, log rotation, and context-budget report, and you only need Node at the moments those run. One known gap: if your package.json sets `"type": "commonjs"`, Node can't load those scripts, and the installer will tell you. The installer never touches your package scripts, so if you want Foundry's size limits enforced, add `node scripts/check-context-budgets.js --check` to your own project's check. The sessions log creates itself at your first wrap-up.

If your project's docs point at wiki pages in a local Foundry checkout instead of copying the library in, `scripts/check-wiki-pointers.js` re-checks those pointers from your own project's check, so a page renamed here fails loudly over there instead of rotting. Its arguments are in the header of the file.

If your tool is something else entirely, the fallback still holds: every command is plain markdown, so paste the file into the chat and it runs. Per-tool details live in [the tool notes](docs/tool-notes.md), and the ground rules the agent works under are in `AGENTS.md`. The chain needs an agent that can read and write files, run shell commands, and follow a multi-step instruction. Git helps but isn't required (see AGENTS.md § What the chain assumes, which covers the no-git version).

## If you edit anything

Each command lives in one place: its skill file, `.agents/skills/<name>/SKILL.md`. Edit the instructions under its short header, then run `npm run shapes`. That rebuilds the header from the folder name and first sentence, and refreshes the Claude Code copy, the Codex policy file, and `scripts/foundry-commands.json`. That last one is the list that lets an installed project's budget check count only Foundry's commands and never your own skills.

`npm run check` is the one check. It fails if a header goes stale or someone edits a generated copy directly. It also runs the tests, fails on any reference to a file or heading that doesn't exist, and fails when listed jargon shows up in committed prose. One GitHub Actions workflow runs it on every push to main and on every pull request.

MIT licensed.
