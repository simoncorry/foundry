Round 4 of implementation-challenge. Trace through the changes again from the round-4 angle. Look for bugs the prior three rounds missed. Fix what you find.

## Voice

Output prints to the human's chat: follow AGENTS.md § Voice. Pipe substantive drafts through `node scripts/voice-gate.js` and rewrite what it flags.

## Guard: nothing to challenge

If no implementation was made in this conversation, decline with: "No implementation to challenge in this conversation. Make changes first, then run the challenge chain starting with round 1."

## Guard: repeat invocation of round 4

If round 4 already ran earlier in this conversation, treat this invocation as a second pass with a NEW angle. Say it explicitly: "Round 4 invoked twice; treating as a new angle within round 4. Prior round 4 angle was X; this pass uses Y."

## Default angle for this round

**Default: external concerns (research beyond the codebase, plus outside-service contracts).** Round 4 reaches outside the repo for evidence. Two sub-checks:

**(a) Research beyond the codebase.** Use your web search capability to check the implementation against official documentation, community reports, and well-known patterns for the libraries and services this code uses. Catch confabulation: comments, error messages, or logic that assert facts not grounded in external evidence. Look for known-better approaches the implementation reinvented or contradicted; strengthen or adapt accordingly. If your tool has no web access, say so in one line and name the claims that went unchecked.

**(b) Outside-service contracts.** Trace assumptions across every external service the work touches: fields the service might emit that this code doesn't handle, fields this code expects that the service sometimes omits, responses that change mid-conversation, implicit assumptions about timing, ordering, retries, and rate limits, auth and quota behavior, and what happens when the service is briefly unavailable or returning stale data.

If the work touches no external services AND has no peer precedent to compare against, override to whichever angle from the list below is most relevant. Say which and why.

## Inline at the top of your response

1. **Read back your prior turns.** List every angle used so far (original implementation + rounds 1-3). Format: `Angles used: [round 0: X], [round 1: Y], [round 2: Z], [round 3: W]`.
2. **Confirm the round-4 angle**: either "using the default for this round: external concerns" OR "overriding the default to [angle]: [reason]". The angle must be different from rounds 0-3.

## Useful angles to rotate through

The canonical list lives in AGENTS.md § The challenge rounds: implementation / where data flows and what happens when something fails / how this code talks to its neighbours / how this code talks to outside services / config-file syntax and quoting pitfalls / what unusual or hostile inputs would break this? / what happens when shell scripts fail mid-pipeline? / will this code be discoverable when it feels unfamiliar? / is the sequence of steps right? / where else does the same root cause apply? / check whether the earlier rounds' fixes broke anything new / does this convention reach every place the mechanism reaches?

## Auto-fix bugs found (when K > 0)

Same policy as round 1: fix now via a new commit on the feature branch (no pull request until wrap-up; in no-git mode fix in place and log it). Out-of-scope findings become observations, human-territory bugs defer with `[NEEDS HUMAN-R4: <one-line ask>]`. K counts high-confidence defects only. Fix it and report the result; never ask whether to fix.

## Self-check before posting

Same checklist as round 1: line cap (20 source lines; 6-8 when clean), no sub-categorized headers, no count-justifying listings, no bare confidence declarations, no cross-round commentary or forward-looking framing, no jargon-stacked labels.

## End your response with the structured report

> **Re-verified N claims, demoted M to uncertainty.**
> **Bugs found: K. Bugs fixed: K** (or K minus the count deferred via [NEEDS HUMAN-R4] markers).

If M > 0 or unfixed bugs remain, list them with a one-line reason BEFORE declaring done.

## No-rubber-stamp guard

Reaching "no bugs" without actually consulting an external source (or naming why none applies) is rubber-stamping this round. If the angle is genuinely exhausted, say so plainly.

## Rationale (recorded so future edits don't drift it)

Agents confabulate library and tool behavior with complete confidence, and inward-facing review can't catch a claim whose refutation lives outside the repo; the research sub-check was added after exactly that failure in the project Foundry grew out of. The service-contract sub-check is older and separately earned: outside services change shape mid-conversation, omit fields, and rate-limit in ways no local test exercises.
