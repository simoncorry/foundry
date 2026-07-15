# Foundry

Designers grew up with a process but in this age of AI they're being told to move beyond it in favor of tools that work faster. Foundry is here to bridge the gap between process and tool. An agent process that will feel strangely familiar: named stages that run in order and challenge the original problem statement from fresh angles.

Foundry grew out of months of daily use building a real game, [Visiblemiles](https://visiblemiles.com), and it's the practical half of the blog series that starts with [How to Make Friends and Influence Agents](https://simoncorry.com/blog/2026/05/26/how-to-make-friends-and-influence-agents). The chain has grown a little since that post published.

Your coding tool (Cursor, Claude Code, Codex, whatever) is the harness: the thing that holds the agent, its permissions, and its tools. To be clear Foundry isn't that. Foundry is an agent process you run inside whichever harness you already use.

## The chain

Ten stages plus one optional rider, each a plain markdown command the agent reads. Nineteen command files in total, because two of the stages run as five rounds each.

**Start up** reads the ground before any work: the branch, the working tree, the note the last session left behind, and the sessions log. In design terms, re-reading the brief before the kickoff.

**Construct the plan** writes the plan as a file in your repo, split in two: a narrative half for you (the human) and a working-memory half for the agent. Nothing gets built from chat scrollback.

**Frame it** is the one stage where the agent interviews you: a short brief on the planned work first, then three to five questions, ordered by how much of the plan each answer would change. In design terms, the client interview.

**Challenge the plan** runs five review rounds before any code exists, each from a genuinely different angle, and the fifth re-reads everything the earlier rounds punted. In design terms, the crit: fresh eyes, a new focus, bringing it back to the original problem statement. Those findings get fixed in the plan before moving on.

**Build it** settles the plan and implements it. When the code forces a departure from the plan, the agent doesn't stop to ask. It picks the conservative option, logs the departure in the plan file, and keeps going; the first review round reads that log before anything else. You don't want the build to stall every time there's a small deviation (you wouldn't hover over a designer and ask them to stop every time they pushed a pixel). This is the prototype stage.

**Test it** writes tests against what the plan intended, not what the code happens to do. Designers already know this discipline: judge the work against the goal, not your bias.

**Security scan** is the optional stage for work that touches anything sensitive: an expert pass against a named checklist of threat classes, with every candidate finding forced to argue against itself before it's reported. In design terms, heuristic evaluation.

**Challenge the implementation** is five more rounds, now against the code, same angle rotation. The plan crit was about direction; this is the review that drives the work to shippable.

**Wrap up** cleans the workspace, grows the jargon list (a way to train your agent to stop talking gibberish), writes the session's log entry, distills anything durable into the wiki, and opens the one pull request. It's the state you leave your desk in.

**Hand off** writes a short note for the next session: what's in flight, what's next, what would be hard to reconstruct cold. This is how you keep building a longer form project with confidence. Handoff keeps its OG design process name because that's exactly what it is.

**Quiz** is the rider, opt-in at any point: it quizzes you on a change that just shipped and teaches through the grading, so you actually understand what you merged. This will keep you honest so you learn as you build. If you don't have an engineering background I HIGHLY recommend you do this after every session.

## The design process, mirrored

The Double Diamond (British Design Council, 2005) splits work into understanding the problem and building the thing right. The chain's first half (start up, construct the plan, frame it, the plan challenges) is the first diamond. The chain's second half (build it, test it, security scan, the implementation challenges, wrap up and hand off) represents the second diamond.

The crit is the cultural bridge and it forces some of our humanity back into an otherwise black hole of logic. The challenge rounds are structured critique with the classic rules built in: fresh eyes, because the agent can't see its own blind spots; a declared focus, which is the angle each round states up front; critique that proposes, so rounds fix what they find; and documented outcomes.

Two places you'll want to stay present. Frame it asks you directly for input, this is where your taste matters. The chain has no end-user research stage. That (to me) is still a deeply human step. In my game Visiblemiles I built a simulated player rig so you can take that route for battletesting basic UX fragility but otherwise always speak to your customers/clients for direct feedback.

## How this differs from the built-in commands

The tools already ship commands that look like they cover this ground. Claude Code and Codex both have `/goal` now: you hand the agent a finish line and it loops, turn after turn, until a separate check decides the condition is met or the budget runs out. There's `/init` to write a project memory file, `/compact` to shrink the chat history, `/review` to look over a diff, `/plan` to think before coding. They're good. `/goal` especially is genuinely impressive at what it does.

But look at what it's for: getting a machine to "done" with you out of the room. It optimizes for finishing, not for being right, and not for you understanding what happened along the way. The reasoning is a black box, you can't shape it as it runs, and when the terminal closes most of the context is lost. That's a fair trade for a weekend prototype. It's the wrong trade for something you mean to keep.

Foundry's bet is the opposite. Every stage is a checkpoint with a name and a job, and you're in the loop where your expertise matters: you approve the plan, frame it has the agent brief you and ask before anything gets built, the challenge rounds tell you what they found, the wrap up explains in plain English what changed. And the chain leaves a trail: the rules file, the plan, the session notes, the handoff note. That trail is the part that lasts, the thing that lets the next session, or the next person, pick up the soul of the project and not just its code.

So this isn't "mine beats theirs." If the work is throwaway, reach for `/goal`. It's faster and I mean that. Foundry earns its weight on projects meant to live on, where the working relationship between you and the agent is a real asset. One honest caveat: these platforms already let you write custom commands, so Foundry isn't a trick they can't do. It's a considered set of them that I use every day, plus the habits and the memory around them, so nobody has to repeat the months of trial and error it took to get here.

## The memory and the library

Two folders keep the chain from starting every session at zero. `docs/sessions/` is the log: wrap-up writes one plain-English entry per session, start-up reads it, and entries older than the current week rotate into one dated file per week (`scripts/rotate-sessions.js`, which refuses to run rather than misfile anything). `docs/wiki/` is the knowledge: one page per topic, grown by wrap-up's distill step, with an index the check enforces from both directions (a listed page that doesn't exist fails, and an existing page the index doesn't list fails).

The wiki ships stocked. Three reference shelves come with the repo: engineering fundamentals (Brooks, Parnas, Naur, and the essential-vs-accidental and wrong-abstraction lenses the challenge rounds cite), design fundamentals (the Norman-to-Rams canon distilled for hierarchy, grouping, type, and color arguments), and motion fundamentals (easing, springs, gesture feel, and motion cost, adapted with credit from Emil Kowalski's and Meng To's MIT-licensed work). Start at [the index](docs/wiki/INDEX.md).

## What it costs

The full chain is thorough and token-heavy. On a mid-size feature it plausibly lands in the low hundreds of thousands of tokens end to end, which is real money on metered plans. That's the honest price of ten review rounds and the bookkeeping around them.

You don't have to pay it every time. [The light path](docs/light-path.md) is the documented cheaper shape: same stages, two challenge rounds instead of five on each side, a fraction of the cost. Keep frame it in either path; a five-question interview is the cheapest insurance in the whole chain. Spend on the full chain when the work touches money, user data, or anything you'll live with for months.

## A session, end to end

What you actually type. Each stage is a slash command (the filename becomes the command in Cursor and Claude Code):

1. **start-up**, then describe what you want built.
2. **construct-the-plan**, and read the narrative half it writes for you.
3. **frame-it**, and answer its three to five questions. This is your last required moment at the keyboard.
4. Queue **challenge-plan** rounds one through five, **build-it**, **test-it**, **challenge-implementation** rounds one through five, and **wrap-up**. Walk away; every stage after frame-it runs unattended.
5. Come back to one pull request and a plain-English summary of what you now have. **handoff** when you want a bridge to next time, **quiz** when you want to be tested on what shipped.

## Getting started

Two ways in.

Starting fresh? Clone this repo and build your project inside it. The commands are already wired: Cursor and Claude Code pick them up the moment you open the folder, and Codex reads each one as a skill you invoke by hand.

Have a project already? Copy the three tool folders (`.cursor/commands/`, `.claude/commands/`, `.agents/`), the two rules files (`AGENTS.md`, `CLAUDE.md`), and `scripts/` into it, plus `docs/wiki/` if you want the reference library. That's the whole install. The commands are plain markdown and need nothing running on your machine; `scripts/` rides along because the commands lean on its voice gate, phrase list, and log rotation, and Node is needed only at the moments you run those checks. The sessions log creates itself at your first wrap-up.

If your tool is something else entirely, the floor still holds: every command is plain markdown, so paste the file's contents into the chat and it runs. Per-tool wiring detail lives in [the tool notes](docs/tool-notes.md), and the ground rules the agent works under are in `AGENTS.md`. The chain assumes an agent that can read and write files, run shell commands, and follow a multi-step instruction; git helps but isn't required (see AGENTS.md § What the chain assumes, which carries the no-git shape).

## If you edit anything

`.cursor/commands/` is the source of truth. The Claude and Codex shapes are generated from it (`npm run shapes`), and `npm run check` fails if they've been edited directly. The same check runs the tests, fails on any reference to a file or heading that doesn't exist, and fails on listed jargon in committed prose; one workflow runs all of it on every push to main and on every pull request.

MIT licensed.
