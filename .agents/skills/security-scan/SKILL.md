---
name: 'security-scan'
description: 'Single-round adversarial security scan.'
---

<!-- Generated from .cursor/commands/security-scan.md. Edit there and run: npm run shapes -->

Single-round adversarial security scan. Scan a focused surface for findings anchored to named threat classes, argue against each candidate before believing it, and require an articulated reproduction path before anything gets reported. Run it after editing security-sensitive code (auth, payments, user data, anything that parses untrusted input) and BEFORE the implementation-challenge chain.

## Voice

Output prints to the human's chat: follow AGENTS.md § Voice. Pipe substantive drafts through `node scripts/voice-gate.js` and rewrite what it flags.

## Guard: nothing to scan

The scan covers the files modified by the agent in this conversation. If none, decline with: "No scan scope detected; make code edits in this conversation first, or name file paths explicitly after the command." Don't invent imaginary changes to scan.

## Guard: repeat invocation

If the scan already ran in this conversation, treat this invocation as a fresh pass over the same surface to catch what the first pass missed. Say so explicitly.

## Guard: during the chain

If build-it's flow is running (no pull request open yet), any bugs the scan finds get fixed via new commits on the feature branch. Do NOT open a pull request; that's wrap-up's job.

## Scope

Files modified by the agent in this conversation, or files explicitly named after the command. Nothing else.

## Sequence note

Run the scan BEFORE implementation-challenge round 1 when both are used: any security bug the scan fixes becomes part of the diff the chain then reviews. Reverse order means the chain validates a not-yet-fixed surface. Test-it runs before the scan for the same reason; the scan should see the finished diff, tests included.

## Threat classes (define these for your project, once)

The scan only works when the search is anchored to failure modes your project actually has. Write 5-8 threat classes into your project's AGENTS.md or a security doc, each with the concrete surfaces to check, and cross-reference the industry-standard OWASP Top 10 categories where they map. A worked example set for a typical web app with accounts:

1. **Cross-user data exposure** (OWASP A01, Broken Access Control). User A seeing user B's data through any read path: list endpoints, search, joins, cached responses.
2. **Authorization bypass** (OWASP A01). Actions gated in the UI but not on the server; object IDs accepted from the client without an ownership check.
3. **Injection and composition bugs** (OWASP A05, Injection). One component's safe output becoming another's unsafe input: string-built SQL, HTML rendered from stored text, shell commands built from user fields. Trace input to sink, seam by seam.
4. **Resource exhaustion** (denial of service). Unbounded loops over client-supplied collections, missing rate limits, queries without limits, large-payload handlers.
5. **Auth and session bugs** (OWASP A07, Authentication Failures). Expired tokens accepted, second-factor bypass, replay, session confusion across reconnect or refresh paths.
6. **Data-write authorization** (OWASP A01). Missing ownership checks on update and delete, database policies that trust the client, raw queries carrying user input.
7. **Secrets exposure**. Keys or tokens in logs, error messages, client bundles, or committed files.

For each class, ask: where in the scoped files could THIS specific failure occur? Be concrete. Not "validation might be missing" but "the message handler at file:line passes payload.text onward without re-running the filter."

## Adversarial validation (before reporting anything)

For every candidate finding, switch sides and try to kill it. Does the surrounding architecture already make the path unreachable? Is the "attack" within what the product intends to allow? Could a realistic caller already do the same thing through a sanctioned route? A finding survives only if it grants an attacker capability they don't already have. Drop everything else.

This step exists because scanning agents overstate: they report reachable-looking paths that the wider system already blocks. Hunting and judging are different modes; do them separately, in that order.

## Reproduction path requirement

For every finding that survives, articulate the data flow from untrusted input to the vulnerable sink as `file:line -> file:line -> file:line`. Short paths are fine for resource-exhaustion findings; composition bugs usually take several hops. A finding without an articulable path gets demoted to Hardening or dropped. (Bigger pipelines write an actual reproduction test per finding; for a single-agent scan, the articulated path is the affordable substitute.)

## Severity grading (5 tiers)

- **High**: directly exploitable under realistic conditions; patch immediately.
- **Medium**: exploitable in principle, but needs chained preconditions or unlikely access.
- **Low**: real issue, marginal practical impact.
- **Hardening**: real pattern, but grants nothing beyond what sanctioned callers already have. Defense-in-depth observation.
- **Not applicable**: the threat model didn't survive adversarial validation; dropped from the report.

## Auto-fix policy

Same policy as the implementation rounds: high-confidence bugs get fixed now via a new commit on the feature branch (no pull request until wrap-up; in no-git mode, fix in place and log it). Out-of-scope findings become observations. Findings needing the human's call defer with a `[NEEDS HUMAN: <one-line ask>]` marker, translated to plain English in chat.

## End your response with the structured report

```
Findings before adversarial validation: N.
Demoted by validation as unreachable / sanctioned / not-applicable: M.
Final severity counts: High: K_h. Medium: K_m. Low: K_l. Hardening: K_ha.
Bugs fixed: K.
```

For each surviving finding: threat class and surface, reproduction path, disposition (fixed inline / fixed in commit / deferred with marker).

## No-rubber-stamp guard

Reaching "no findings" without at least one attempted reproduction path per threat class means the scan was skipped, not passed. The classes exist to anchor the search; trace each one against the scoped files. A genuinely clean scan closes with: "Traced [N] threat classes against [M] scoped files; no high-confidence findings."

## Rationale (recorded so future edits don't drift it)

The scan's shape adapts Ramp Engineering's write-up "Finding high-severity security issues with publicly available models": threat-class anchoring so the search doesn't wander, an adversarial self-argument step to suppress the overstatement scanning agents reliably exhibit, and a reproduction-path bar so findings are evidence, not vibes. The adversarial step's wording here is our own; the technique and its motivation are theirs, and their multi-agent pipeline (where a validator writes a real test per finding) is the fuller version this single-agent scan approximates.
