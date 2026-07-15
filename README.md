# Foundry

> Not published yet. This repo is being assembled and hasn't had its voice pass or its final read. Nothing here is an invitation until it goes public.

Foundry is an agent process for building software meant to last. Designers follow a design process: named stages, run in order, because the work comes out better than winging it. This is the same idea pointed at working with a coding agent.

It grew out of months of daily use building a real game, and it's the practical half of the blog series that starts with [How to Make Friends and Influence Agents](https://simoncorry.com/blog/2026/05/26/how-to-make-friends-and-influence-agents). The chain has grown a little since that post published.

One word before the tour, because this space loves its words. Your coding tool (Cursor, Claude Code, Codex) is the harness: the thing that holds the agent, its permissions, and its tools. Foundry isn't one. Foundry is an agent process you run inside whichever harness you already use.

## The chain

Ten stages plus one rider, each a plain markdown command the agent reads. Nineteen command files in total, because two of the stages run as five rounds each.

**Start up** reads the ground before any work: the branch, the working tree, the note the last session left behind. In design terms, re-reading the brief before the kickoff.

**Construct the plan** writes the plan as a file in your repo, split in two: a narrative half for the human, a working-memory half for the agent. Nothing gets built from chat scrollback.

**Frame it** is the one stage where the agent interviews you: a short brief on the territory first, then three to five questions, ordered by how much of the plan each answer would change. In design terms, the client interview.

**Challenge the plan** runs five review rounds before any code exists, each from a genuinely different angle, and the fifth re-reads everything the earlier rounds parked as uncertain. In design terms, the crit: fresh eyes, a declared focus, findings that get fixed rather than admired.

**Build it** settles the plan and implements it. When the code forces a departure from the plan, the agent takes the conservative option and logs it in the plan file instead of stopping to ask. The prototype stage.

**Test it** writes tests against what the plan intended, not what the code happens to do, then drives them to green. Designers already know this discipline: judge the work against the goal, not your fondness for what you made.

**Security scan** is the optional stage for work that touches anything sensitive: an expert pass against a named checklist of threat classes, with every candidate finding forced to argue against itself before it's reported. In design terms, heuristic evaluation.

**Challenge the implementation** is five more rounds, now against the code, same angle rotation. The plan crit was about direction; this is the review that drives the work to shippable.

**Wrap up** cleans the workspace, grows the jargon list, updates the project's notes, and opens the one pull request. It's the state you leave your desk in.

**Hand off** writes a short note for the next session: what's in flight, what's next, what would be hard to reconstruct cold. Handoff keeps its design name because that's exactly what it is.

**Quiz** is the rider, opt-in at any point: it quizzes you on a change that just shipped and teaches through the grading, so you actually understand what you merged.

## The design process, mirrored

The Double Diamond (British Design Council, 2005) splits work into understanding the problem and building the thing right. The chain's first half (start up, construct the plan, frame it, the plan challenges) is the first diamond; build it through hand off is the second. The d.school's five stages map too: Define is the plan, Prototype is build it, Test is test it.

The crit is the cultural bridge. The challenge rounds are structured critique with the classic rules built in: fresh eyes, because the maker can't see their own blind spots; a declared focus, which is the angle each round states up front; critique that proposes, so rounds fix what they find; and documented outcomes, the count lines every round ends with.

Two places the mirror bends. The chain has no end-user research stage; that seat stays open for your own skills, and taste routes to you through frame it. And where design diverges by generating alternatives, the chain diverges by generating criticisms of one candidate.

## How this differs from the built-in commands

The tools already ship commands that look like they cover this ground. Claude Code and Codex both have `/goal` now: you hand the agent a finish line and it loops, turn after turn, until a separate check decides the condition is met or the budget runs out. There's `/init` to write a project memory file, `/compact` to shrink the chat history, `/review` to look over a diff, `/plan` to think before coding. They're good. `/goal` especially is genuinely impressive at what it does.

But look at what it's for: getting a machine to "done" with you out of the room. It optimizes for finishing, not for being right, and not for you understanding what happened along the way. The reasoning is a black box, you can't shape it as it runs, and when the terminal closes most of it evaporates. That's a fair trade for a weekend prototype. It's the wrong trade for something you mean to keep.

Foundry's bet is the opposite. Every stage is a checkpoint with a name and a job, and you're in the loop at the seams: you approve the plan, frame it has the agent brief you and ask before anything gets built (the built-ins only ever take questions, they don't ask them), the challenge rounds tell you what they found, the wrap up explains in plain English what changed. And the chain leaves a trail: the rules file, the plan, the session notes, the handoff note. That trail is the part that lasts, the thing that lets the next session, or the next person, pick up the soul of the project and not just its code.

So this isn't "mine beats theirs." If the work is throwaway, reach for `/goal`. It's faster and I mean that. Foundry earns its weight on projects meant to live on, where the working relationship between you and the agent is a real asset. One honest caveat: these platforms already let you write custom commands, so Foundry isn't a trick they can't do. It's a considered set of them that I use every day, plus the habits and the memory around them, so nobody has to repeat the months of trial and error it took to get here.

## What it costs

The full chain is thorough and token-heavy. On a mid-size feature it plausibly lands in the low hundreds of thousands of tokens end to end, which is real money on metered plans. That's the honest price of ten review rounds and the bookkeeping around them.

You don't have to pay it every time. [The light path](docs/light-path.md) is the documented cheaper shape: same stages, two challenge rounds instead of five on each side, a fraction of the cost. Keep frame it in either path; a five-question interview is the cheapest insurance in the whole chain. Spend on the full chain when the work touches money, user data, or anything you'll live with for months.

## Getting started

Two ways in.

Starting fresh? Clone this repo and build your project inside it. The commands are already wired: Cursor and Claude Code pick them up the moment you open the folder, and Codex reads each one as a skill you invoke by hand.

Have a project already? Copy the three command folders (`.cursor/commands/`, `.claude/commands/`, `.agents/`) plus `AGENTS.md` and `CLAUDE.md` into it. That's the whole install. The commands are plain markdown and need nothing running on your machine; `scripts/` and the check are optional extras, and they're the only part that needs Node.

If your tool is something else entirely, the floor still holds: every command is plain markdown, so paste the file's contents into the chat and it runs. Per-tool wiring detail lives in [the tool notes](docs/tool-notes.md), and the ground rules the agent works under are in `AGENTS.md`. The chain assumes an agent that can read and write files, run shell commands, and follow a multi-step instruction; git helps but isn't required (see AGENTS.md § What the chain assumes, which carries the no-git shape).

## If you edit anything

`.cursor/commands/` is the source of truth. The Claude and Codex shapes are generated from it (`npm run shapes`), and `npm run check` fails if they've been edited directly. The same check runs the tests, fails on any reference to a file or heading that doesn't exist, and fails on listed jargon in committed prose; one workflow runs all of it on every push.

MIT licensed.
