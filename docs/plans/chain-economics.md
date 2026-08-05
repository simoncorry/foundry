---
id: chain-economics
status: IN_PROGRESS
created: 2026-08-05
---

# Make Foundry cheaper in the places the evidence actually supports

Foundry's current cost advice points at the review rounds. That is the wrong emphasis. The source project's July 27 to August 3 evidence says the expensive part is carrying a large conversation through many tool resumptions, repeated reads, duplicate checks, and mechanical close-out work. The review rounds were usually short, and late rounds plus independent graders kept finding real defects. Calling the two-round light path "a fraction of the cost" is stronger than the evidence allows and quietly encourages people to cut the part that was still earning its keep.

This change will give Foundry a more honest economic story and a few small defaults that follow from it. It will keep the full and light paths, but describe the light path as a lower-assurance trade rather than a proven fraction-of-cost shortcut. It will put executable ceilings behind the context budgets Foundry already claims. It will stop asking for a live voice-gate call on every short stage report, stop reprinting unchanged files in the middle implementation rounds, and define one clean validation ladder: targeted checks while working, one complete project check in test-it, and one final complete check in wrap-up.

The claim is intentionally modest. These changes remove known sources of repeated context and preserve the quality bar seen in local use. They do not come with a percentage or dollar-saving promise. The three-build batching and reread pilot held quality, but its median turns were flat, tool calls rose, and billed cost was unavailable. That is enough to keep the safer defaults. It is not enough to advertise savings.

## Calls made here

- Keep all five review rounds in the full path. The local record shows later rounds and independent graders still found consequential bugs.
- Keep the light path, but remove "a fraction of the cost" and explain that its saving depends on the tool, model, task shape, and amount of context already carried.
- Make the voice gate selective: final plan prose, frame-it, quiz, wrap-up, handoff, and any response the agent itself suspects is dense or awkward. Frame-it stays because it is the one human interview and runs only once. Quiz stays because it is opt-in, outside the ordinary chain, and often produces long teaching prose. Short structured round reports rely on their tight format; committed prose still meets the blocking jargon check.
- Keep full-file reads in implementation rounds 1 and 5. Rounds 2 through 4 read files changed since the last inspection plus whatever their new angle needs. Compaction, intervening edits, or unseen context force a full read.
- Run a complete project check once in test-it and once at wrap-up on a clean chain. Failures or substantive later changes can force extra runs. Targeted tests remain unlimited.
- Enforce the existing 8 KiB `AGENTS.md` ceiling and add a 110 KiB ceiling for the nineteen source command files together. The command ceiling has about 6 percent headroom from today's 105,823-byte baseline; new instructions must displace old ones instead of silently growing the chain.

## What this deliberately does not ship

- No Foundry cost estimator. The local transcript meter was delayed, tool-specific, and commonly undercounted by 40 to 75 percent after compaction. Billing or usage exports remain the authority.
- No automatic or prompted compaction for savings. Five measured boundaries lowered subsequent event cost but produced a median net result of -19.3 percent once summary cost was included.
- No cheaper-model recommendation. The local model switch was confounded, but the observed correction burden was bad enough that it was reversed. Foundry is also deliberately model-neutral.
- No generic wrap-up runner. It paid off in a project with many known deterministic chores. Foundry cannot safely invent those chores for every consumer project.
- No new administrative wrapper. A later audit found the remaining administrative turns were mostly real decision points or already batched.
- No claim that coherent batching saves a fixed amount. It stays as tool-use hygiene because it removes needless resumptions without combining dependent work.
- No durable chain ledger in this patch. Local evidence supports it as recovery and sequence protection, not as a cost reduction. It deserves a separate Foundry plan so its added guard turns are judged against the missed-stage risk honestly.

## Risks

The selective voice gate could let an awkward short chat response through. The mitigation is the strict report shape, the agent's "this feels dense" escape, and the existing blocking scan for committed prose. Freshness-aware rereads could miss adjacent context if an agent falsely remembers what it saw; the escape conditions are therefore mechanical and rounds 1 and 5 remain full reads. A hard command-size ceiling could reward cryptic prose; the check only blocks growth, while the existing voice, link, generated-shape, and behavioral tests continue to judge quality.

---

## Inputs

- Source-project evidence: Sol Wilds' July 27 build-chain cost audit, especially the session-734 measured-cost correction, session-737 model reversal, session-752 economic-gains adjudication, session-757 no-code verdict, and session-766 compaction rejection.
- Foundry's current public claims: `README.md` and `docs/light-path.md`.
- Foundry's current context guidance and budgets: `AGENTS.md` and `docs/wiki/engineering/context-engineering.md`.
- Foundry's current stage behavior: `.cursor/commands/build-it.md`, `.cursor/commands/test-it.md`, `.cursor/commands/wrap-up.md`, and `.cursor/commands/challenge-implementation-{1..5}.md`.
- Current size baseline: `AGENTS.md` 6,343 bytes; nineteen `.cursor/commands/*.md` files 105,823 bytes total.
- Current vendor contracts, used only to keep the prose neutral: [Cursor summarization](https://docs.cursor.com/en/agent/chat/summarization) documents context management, not a savings guarantee; [Cursor pricing](https://docs.cursor.com/account/pricing) and the [Codex rate card](https://help.openai.com/en/articles/20001106-codex-rate-card) expose tool-specific token economics; [Anthropic pricing](https://docs.anthropic.com/en/docs/about-claude/pricing) exposes separate cache-write and cache-hit rates. These are dated examples checked on 2026-08-05, not Foundry policy.

## File-tree change

```diff
 foundry/
 ├── AGENTS.md
 ├── README.md
 ├── package.json
 ├── .cursor/commands/
 │   ├── build-it.md
 │   ├── test-it.md
 │   ├── wrap-up.md
 │   ├── challenge-implementation-2.md
 │   ├── challenge-implementation-3.md
 │   ├── challenge-implementation-4.md
 │   └── selected stage files with repeated voice-gate boilerplate
 ├── docs/
 │   ├── light-path.md
 │   └── wiki/
 │       ├── INDEX.md
+│       └── engineering/chain-economics.md
 ├── scripts/
+│   └── check-context-budgets.js
 └── tests/
+    ├── check-context-budgets.test.js
+    └── chain-economics-contract.test.js
```

Generated `.claude/commands/` and `.agents/skills/` copies change only through `npm run shapes`.

## Program design

```text
npm run check
├── check-context-budgets --check
├── node --test
│   └── context-budget behavior tests
├── generate-command-shapes --confirm
├── check-links
└── check-jargon

check-context-budgets --check
├── measure AGENTS.md
├── measure the .cursor/commands/*.md source set
└── fail with current, limit, and overage when either ceiling is crossed
```

Proposed script surface:

```js
export function measureContextBudgets(rootDir): {
  agentsBytes: number,
  commandBytes: number,
  commandCount: number,
  commandFiles: Array<{ path: string, bytes: number }>
}

export function evaluateContextBudgets(measurement, limits): {
  ok: boolean,
  violations: Array<{ name: string, actual: number, limit: number }>
}
```

The command line supports `--check` for CI failure and a default human-readable report. Report mode exits zero after printing measurements. Check mode exits nonzero on a ceiling violation, missing input, unreadable file, or empty command set. Importing the module exports functions and does nothing else; CLI execution sits behind the same direct-run guard used by Foundry's other importable scripts. It reads files only and has no vendor or transcript dependency. Foundry's own `npm run check` makes the ceiling mandatory in this repository. Consumer projects receive the script through the existing installer, but enforcing it in their own check command is opt-in because Foundry does not own their package scripts.

Measurement is portable: read UTF-8 text, normalize CRLF and lone CR line endings to LF, then count bytes. Refuse a missing `AGENTS.md`, a missing source-command directory, or a directory containing zero markdown commands. A broken input must never pass by measuring as zero. The report prints every command file in deterministic size-descending, path-ascending order so an overage names where the weight actually sits.

The checker constants are the one executable home for the exact ceilings. `AGENTS.md` keeps its approximate human explanation and points at the checker; the economics page explains why the gate exists and how to justify a future change without copying another authoritative number.

## Build steps

1. Add the economic record and correct the public claim. Create the proposed chain-economics page under `docs/wiki/engineering/`, add it to the wiki index, add one `See also` pointer from `docs/wiki/engineering/context-engineering.md`, and revise `README.md` plus `docs/light-path.md`. Include the measured positive, negative, and uncertain findings. Do not publish a savings percentage or duplicate the economic record across both wiki pages.
2. Put teeth behind context size. Add the read-only budget script and behavioral tests, integrate it into `npm run check`, and pin both missing-file and over-budget failures. Extend the installer test to prove a fresh consumer receives the checker while its package scripts remain untouched. The first slice is runnable here: the current tree passes, while a temporary oversized fixture fails with an exact overage.
3. Remove paid ritual from the voice gate. Put the selective rule in `AGENTS.md`; retain explicit live-gate calls in construct-the-plan, frame-it, quiz, wrap-up, and handoff; let the self-suspected dense-response clause cover other unusual prose. Remove the repeated `## Voice` blocks from build-it, start-up, test-it, security-scan, all five plan challenges, and all five implementation challenges. Add a semantic command-contract test that identifies the retained set by behavior rather than exact prose. Regenerate the Claude and Codex shapes and keep the total source-command set below its new ceiling.
4. Port freshness-aware review reads. Change implementation rounds 2 through 4 only. Each round fully reads files changed in the preceding round and any files its angle newly requires. It fully rereads everything when prior context was compacted, a file changed since inspection, or the new angle needs unseen surrounding code. Keep rounds 1 and 5 unchanged. Extend the command-contract test to prove all three escape concepts are present in rounds 2 through 4 and that rounds 1 and 5 still require full surrounding-context reads.
5. Define the validation ladder. Update build-it, test-it, and wrap-up so targeted checks run during implementation and fixes. Test-it discovers the canonical complete check from explicit project rules first, then the commands the CI workflow actually runs, then package scripts when neither stronger source exists. A CI workflow with several verification commands defines an ordered check set, not a guessed single script. Test-it runs the discovered check or set once after the behavioral tests are green; when no canonical check exists, it runs the broadest existing suite and names the missing project-level check in its report rather than inventing a command. Wrap-up repeats the same discovery after cumulative review. Extra complete checks require a red result or a substantive change after the last one. Remove the unconditional immediate rerun of an already green deterministic suite, and rewrite test-it's rationale so it preserves the narrower flake-canary reason instead of the retired run-it-twice rule. The command-contract test proves the two clean-chain complete-check stages, the targeted-check allowance, and the named rerun reasons without matching whole sentences.
6. Add coherent tool-use guidance without a runner. Build-it gets one compact paragraph: run independent reads together, keep dependent steps ordered, write large outputs to a file and return a short summary, use bounded reads when only one section is needed, and never combine unrelated edits to improve a metric.
7. Regenerate all command shapes, run `npm run check`, and inspect the final size report. The patch fails its own bar if it increases the source command total above 110 KiB or pushes `AGENTS.md` above 8 KiB.

## Acceptance bars

- `README.md` and `docs/light-path.md` no longer claim the light path costs "a fraction" or imply that review rounds are the dominant cost.
- The new economic page separates measured outcomes, modelled estimates, and uncertain inference. It includes the compaction rejection, model reversal, no-code administrative verdict, quality-held reread pilot, and the observed wrap-up movement after project-specific runners landed. It does not attribute that movement to the runner alone.
- `docs/wiki/engineering/context-engineering.md` links to the economic page without repeating its evidence table or operational rules.
- Current official vendor facts appear only as dated examples of why costs vary. No model name, price, cache duration, transcript path, billing threshold, or claim that every provider discounts cache use becomes Foundry policy.
- `npm run check` fails when `AGENTS.md` exceeds 8,192 bytes or the nineteen source commands exceed 112,640 bytes, and passes at the current baseline.
- Budget tests cover pass, exact-boundary pass, one-byte-over failure, CRLF/LF parity, missing `AGENTS.md`, missing source directory, empty source directory, unreadable input, deterministic file ordering, the largest-contributor report, CLI exit codes, and import-without-execution. The existing installer suite proves the checker is copied to a fresh consumer without rewriting that consumer's package scripts.
- Exact byte limits live once in the checker. `AGENTS.md` and the economic page explain and route to that source without defining independent executable values.
- Only construct-the-plan, frame-it, quiz, wrap-up, handoff, and the central self-suspected dense-response rule require live voice-gate calls. Generated command shapes remain byte-derived from `.cursor/commands/`.
- Foundry's own `npm run check` enforces the context ceilings. The installer copies the checker, documents how a consumer opts in, and does not rewrite a consumer project's package scripts to force adoption.
- Implementation rounds 2 through 4 carry all three full-reread escape conditions. Rounds 1 and 5 still require a full surrounding-context read.
- A clean chain with a canonical complete check requests it once in test-it and once in wrap-up. Discovery follows explicit project rules, then CI commands, then package scripts; multiple CI verification commands remain an ordered set. If none names a complete check, both stages use the broadest existing suite and report the gap. Targeted checks, red-result reruns, and post-check substantive-change reruns remain allowed. A new test involving time, randomness, concurrency, or an outside process gets one targeted canary rerun even when the first result is green.
- Test-it's recorded rationale describes the narrow flake canary and no longer teaches an unconditional run-it-twice rule that contradicts the procedure.
- Tool guidance never parallelizes work with a real data dependency and never encourages hiding output, combining unrelated edits, or optimizing a turn-count target.
- One semantic command-contract test pins the selective voice-gate set, freshness-aware reread escapes, rounds 1 and 5 full-read rule, and validation ladder. It must accept meaning-preserving rewording and reject a reintroduced universal gate, missing reread escape, or unconditional extra complete-suite run.
- `npm run check` is green after regeneration, link checks, jargon checks, and the new budget gate.

## Demoted-claims tracking

| Round | Claim | Outcome | Plan change |
|---|---|---|---|
| R1 | Frame-it can rely on the dense-response escape instead of a live voice check. | Demoted. Its questions are the chain's one human interview and the stage runs once, so the quality trade is not earned. | Retained an explicit live voice check in frame-it. |
| R1 | Adding the checker to Foundry's package script enforces the ceiling in installed projects. | Demoted. Foundry does not own a consumer's package scripts. | Made Foundry enforcement mandatory and consumer enforcement documented opt-in. |
| R2 | The later wrap-up turn reduction measures the runner's savings. | Demoted. The runner, batching rule, and task shapes changed together. | Report the stage movement as observed and refuse per-lever attribution. |
| R2 | Every already-green test suite can lose its immediate second run. | Demoted. Flake-prone tests need a narrow reproducibility check. | Keep a targeted canary rerun for new time, randomness, concurrency, or outside-process tests. |
| R3 | Quiz can rely on the dense-response escape instead of a live voice check. | Demoted. Quiz is outside the ordinary chain and commonly produces long teaching prose, so removal adds risk without ordinary-chain savings. | Retained an explicit live voice check in quiz. |
| R4 | Discounted cached input is a durable cross-vendor rule. | Demoted. It holds in the current examples, but vendors can change pricing and cache behavior independently. | Use dated official examples and make live measurement, not a cache assumption, the durable rule. |
| R5 | R1 frame-it demotion | Confirmed after rereading `/frame-it`; this is the only required human interview and the saved call is one per chain. | No change. |
| R5 | R1 consumer-enforcement demotion | Confirmed in `scripts/install.js`; scripts copy, consumer package scripts do not. | No change. |
| R5 | R2 runner-attribution demotion | Confirmed in the source audit; runner and batching changes overlap and the later sample was heterogeneous. | No change. |
| R5 | R2 blanket-rerun demotion | Confirmed against `/test-it`; narrow flake canaries preserve the reason the second run existed without repeating every complete suite. | No change. |
| R5 | R3 quiz demotion | Confirmed in `/quiz`; it is opt-in and outside ordinary-chain cost. | No change. |
| R5 | R4 cross-vendor cache demotion | Confirmed against the dated official sources; current examples agree, but the contract is vendor-owned. | No change. |
| R1 repeat | Every consumer project has a canonical complete check test-it can invoke. | Demoted. Some installed projects may expose only partial suites or no named check. | Added ordered discovery and an honest broadest-suite fallback with the gap reported. |
| R1 repeat | Copying the scripts directory is enough proof that consumers receive the checker. | Demoted. That is current implementation, not a pinned install contract. | Added an installer acceptance test for the checker and the no-package-rewrite boundary. |
| R2 repeat | Raw file bytes give a stable context-budget result on every supported checkout. | Demoted. CRLF checkouts inflate the same prose relative to LF checkouts. | Normalize line endings to LF before measuring and test parity. |
| R2 repeat | Missing or empty command input will naturally fail the budget check. | Demoted. Zero files can produce a zero-byte pass unless it is rejected explicitly. | Refuse missing `AGENTS.md`, a missing command directory, and an empty command set. |
| R3 repeat | A total-only budget failure is actionable enough for a future maintainer. | Demoted. It names the problem but not the files contributing most to it. | Add a stable per-command size breakdown, largest first. |
| R3 repeat | Repeating exact ceilings in the checker and explanatory prose is harmless. | Demoted. The numbers can drift and make the prose lie about enforcement. | Make checker constants authoritative; prose points at them and carries reasons only. |
| R4 repeat | The checker can leave exit behavior implicit. | Demoted. CI needs violations and broken inputs to fail, while a report-only invocation should remain informational. | Defined zero/nonzero behavior for report and check modes. |
| R4 repeat | Exported functions imply the module is safe to import in tests. | Demoted. A top-level CLI path could inspect the real checkout or exit during import. | Require a direct-run guard and an import-without-execution test. |
| R5 repeat | R1-repeat complete-check discovery | Escalated after rereading test-it, wrap-up, package scripts, and CI ownership. Package script names are weaker evidence than the commands CI actually runs. | Reordered discovery to project rules, CI, then package scripts; preserve multi-command CI verification as a set. |
| R5 repeat | R1-repeat installer contract | Confirmed in `scripts/install.js` and its fresh-install fixture. | No change. |
| R5 repeat | R2-repeat line-ending portability | Confirmed; the repository has no checkout-level line-ending pin. | No change. |
| R5 repeat | R2-repeat missing-input refusal | Confirmed; an empty sum needs an explicit invalid-input branch. | No change. |
| R5 repeat | R3-repeat actionable budget output | Confirmed; current totals alone would not identify the largest command contributors. | No change. |
| R5 repeat | R3-repeat single limit authority | Confirmed against the existing approximate `AGENTS.md` budget note. | No change. |
| R5 repeat | R4-repeat CLI exit contract | Confirmed by the `&&`-chained `npm run check` pipeline. | No change. |
| R5 repeat | R4-repeat import safety | Confirmed against the import-safe pattern and regression test in `scripts/rotate-sessions.js`. | No change. |
| R6 | Generated-shape parity and prose acceptance bars are enough to preserve the three command-policy changes. | Demoted. Shape generation proves copies agree, not that the source commands retain the intended semantics. | Add one behavior-based command-contract test covering voice routing, reread escapes, and the validation ladder. |
| R7 | R6 semantic command-policy contract | Confirmed after rereading the generated-shape suite. It proves copies are synchronized but never inspects the source commands' economic policies. | No change. |
| R8 | Replacing test-it's unconditional rerun in the procedure is enough to retire the old rule. | Demoted. Test-it's rationale explicitly preserves the run-it-twice rule and would contradict the new validation ladder. | Require the rationale to carry the narrower flake-canary reason and remove the retired rule. |

## Deviations

- The plan said implementation round 5 already required a full surrounding-context read. The command had only a narrow reminder to reread guards. Added the full accumulated-file read to `.cursor/commands/challenge-implementation-5.md` so the acceptance bar wins over the mistaken baseline. Lesson: verify an asserted existing safeguard before planning to leave it unchanged.
