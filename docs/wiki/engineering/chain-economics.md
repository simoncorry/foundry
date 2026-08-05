# Chain economics

Foundry grew out of a large working chain, so it carries a real temptation: call every bit of process expensive, cut the visible review rounds, and tell ourselves the shorter shape costs a fraction as much. The source project's evidence does not support that story.

It supports a narrower one. Long builds repeatedly paid to carry a large conversation through small tool resumptions. Large file rereads, duplicate complete checks, manual polling, and mechanical close-out work were visible costs. The review rounds were usually short, and later rounds plus independent graders kept finding defects. The useful target is repeated context and ritual, not review depth by default.

## What was measured

The July 27 to August 3, 2026 cost program used flushed transcripts, usage exports when one was available, and an explicitly approximate transcript model when billing was not. The distinction matters: a transcript estimate is not an invoice, and an in-flight transcript can lag badly enough to miss the stage currently running.

| Evidence | Result | What it supports |
|---|---|---|
| Session 734 billing correction | Ordinary chains in the measured sample cost roughly $176 to $293 under that tool and model setup. Cached input plus the tool fee dominated. Earlier transcript constants had understated cost. | Use an attributable billing or usage surface for money claims. Treat stage-start transcript meters as lower bounds. |
| Session 737 model reversal | A theoretically cheaper builder produced enough correction burden that the project restored the more capable builder and kept a separate reviewer. | Do not make a generic cheaper-model recommendation. Quality and rework belong in the economic calculation. |
| Sessions 740 to 755, three-build pilot | Median assistant turns moved from 175 to 172. Median tool calls moved from 195 to 236. The approximate transcript estimate moved from about $103 to about $116. Billing was unavailable. Quality held under selective live voice checks, coherent batching guidance, and freshness-aware rereads. | Keep the smaller defaults because their quality bar held. Do not claim they saved money. |
| The same three-build pilot, wrap-up stage | Wrap-up used 33 to 53 turns after the changes, compared with 62 to 67 in the baseline. A project-specific runner and batching guidance had both changed. | The stage moved in the useful direction, but no single change gets causal credit. |
| Session 757 administrative follow-up | Most administrative work was already batched or represented real decision points. The remaining avoidable ledger calls were modelled at roughly $4 per chain. | Do not add a generic administrative runner for a small, uncertain remnant. |
| Sessions 763 to 766 compaction pilot | Five measured summary boundaries lowered later per-event cost by 31.8 to 66.3 percent, but the summary's own full-price reread outweighed the recovery. Median net saving was -19.3 percent. Quality stayed flat. | Do not prompt compaction as a savings mechanism. Keep durable recovery checkpoints on correctness merit only. |

One result sits outside the table because it is easy to misread. Session 744 was expensive, granular work: 284 assistant turns, 343 tool calls, repeated large reads, and an approximate cost near $300. An independent grader also found a real WebSocket authority defect that five review rounds missed. The avoidable part was execution granularity and late mechanical work. The grader paid for itself.

## What is modelled or still uncertain

Transcript-derived dollar figures use an approximate rate and reconstructed context. They are useful for locating where a session grew, not for stating what was billed. Compaction makes the in-chain meter less trustworthy because the visible transcript no longer represents everything the provider charged to reread.

The three-build pilot was heterogeneous and changed three defaults together. It can say quality held. It cannot divide a saving among selective live checks, batching, and freshness-aware rereads, and its billed cost was unavailable. The wrap-up movement is descriptive for the same reason.

Tool economics also move underneath the process. As checked on August 5, 2026, [Cursor's summarization release note](https://cursor.com/changelog/1-6) describes context management rather than a savings guarantee; [Cursor's pricing policy](https://cursor.com/terms/pricing/2026-03-25), the [Codex rate card](https://help.openai.com/en/articles/20001106-codex-rate-card), and [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing) expose different units and cache treatment. These are examples of variation, not Foundry policy. Recheck the live provider before doing money math.

## Defaults this evidence earns

- Keep five review rounds in the full path. Use the light path as a lower-assurance choice, never as a promised fraction of the cost.
- Keep live voice checks where prose quality has real room to drift: final plan prose, frame-it, quiz, wrap-up, handoff, and any draft the agent itself finds dense or awkward. Let fixed short reports rely on their shape, while committed prose still passes the blocking scan.
- Read every changed file in full during implementation rounds 1 and 5. In rounds 2 through 4, fully read files changed since the last inspection and whatever the new angle needs. Compaction, intervening edits, or unseen surrounding code force a full reread.
- Use targeted checks while working. Run one complete project check in test-it and one final complete check in wrap-up on a clean chain. A failure or a substantive later change earns another run.
- Batch independent reads, but keep real dependencies ordered. Large output can land in a file with a short chat summary. Never combine unrelated work to improve a turn count.
- Keep the always-loaded rules and source commands below their executable limits. `node scripts/check-context-budgets.js` reports the current weight; `--check` makes an overage fail.

## How to revisit the call

Start with an attributable usage or billing export and a flushed transcript. Predeclare which sessions count, which fields will be compared, and the exact window used for every metric. Record quality findings beside cost. If several defaults change together, judge the bundle and refuse per-lever attribution. A useful result can still be "quality held, saving not demonstrated." That is better than a neat percentage built on stale telemetry.
