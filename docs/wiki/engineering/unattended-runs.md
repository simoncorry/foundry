# Unattended runs

What we learned building `/solo`, the command that lets the agent run the rest of a session without asking. Each point is a fact from outside the repo that an unattended run leans on, with where it came from, so the next change to that command doesn't have to rediscover it.

## A merge is only as safe as the agent's reading of the checks

This repository's `main` has no branch protection and no rulesets (checked with the GitHub command-line tool in October 2026), so GitHub itself would let a pull request with a failing check merge. Any rule like "merge only when checks pass" is enforced by the agent reading the checks, nothing else. Read every check on the head commit, not only required ones. The command-line tool sorts results into five groups: pass, skipping (which includes neutral), fail, cancel, and pending (which includes stale). Require at least one pass, because a commit message ending in `skip-checks: true` can skip everything, and all-skipped proves nothing. (GitHub CLI, "Describe bucket and state JSON fields," pull request 9439: https://github.com/cli/cli/pull/9439)

## "No checks" can mean "not yet"

For a few seconds after a pull request opens, GitHub reports no checks at all, and `gh pr checks` exits with the same code for "no checks" as for a failure. Treat zero as waiting for a bounded time (solo uses 15 minutes) before concluding the repository has none. Poll in short calls rather than one long silent wait. (GitHub CLI issues 7401 and 9390: https://github.com/cli/cli/issues/7401, https://github.com/cli/cli/issues/9390)

## Merging can be deploying

Vercel and Netlify deploy production from their own GitHub apps whenever the production branch moves, so nothing in the repository's workflows says a merge will deploy. The sign that shows up is on the pull request: a preview deploy, as a check, a status, or a comment. An agent forbidden to deploy has to treat that merge as a deploy. (Vercel, "Deploying Git Repositories": https://vercel.com/docs/git; Netlify, "Git workflows overview": https://docs.netlify.com/build/git-workflows/overview)

## Long turns drop

An agent turn that runs for a long time is exposed to dropped connections; Cursor's own forum reports turns of roughly ten minutes and up ending on connection errors. A whole chain in one turn can run for hours, so progress has to live in a file (solo ticks a checklist in the plan) and retyping the command has to resume, not restart. Cursor's "New Messages" setting can also deliver a message typed mid-run at the agent's next tool call instead of after the turn, so an unattended run has to expect the human to break in. (Cursor forum, "Unattended work impossible due to CLI failures": https://forum.cursor.com/t/unattended-work-impossible-due-to-cli-failures/173810; Cursor docs, "Agent": https://cursor.com/docs/agent/overview)

## Two lessons from the build

- **Check every path a script writes, not the names it lists.** The skill generator first refused links only among the folders it listed; an independent grader still got writes out of the repo through a link one level deeper. Walking each write path from the root down closed the whole class at once.
- **A scratch draft undercounts a byte budget.** A rules-only draft of the solo command measured about 3.3 KB; the real file, with exact quoted phrases, came out about a quarter larger. When a budget is tight, measure the real file early.
