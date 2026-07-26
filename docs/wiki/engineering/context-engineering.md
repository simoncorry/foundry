# Context engineering

Everything the agent reads before the work begins (rules files, skills, plans, memory) is context, and it shapes output more than any single prompt does. These are the principles for keeping that layer lean and honest, distilled from four practitioner accounts published for the current model generation and checked against this process's own history. All four are rewritten here with credit, never pasted.

## Judgment over rules

Newer models handle judgment well. Anthropic reports deleting 80% of Claude Code's system prompt for the Claude 5 generation with no measured loss on its coding evaluations; the guidance that stayed is the kind guarding irreversible mistakes. The test for any standing rule: would the model get this right from surrounding context and judgment alone? If yes, the rule is a tax on every session. Keep hard rules only where a mistake cannot be undone (destructive commands, money, secrets), and let judgment carry style and process. (Thariq Shihipar, "The new rules of context engineering for Claude 5 models," July 2026: https://x.com/trq212/status/2080710971228918066)

## Progressive disclosure

A tree of small files loaded at the right time beats one central file carrying every known practice. The always-loaded layer should say what the project is and where the detail lives; skills and reference pages carry the depth and load on demand. The same source's rule of thumb for the always-on file: describe the repo briefly, spend the tokens on gotchas, and never state what the model can see by looking at the tree. This wiki's two-layer model (an index that routes, pages that carry depth) is that principle applied to knowledge.

## The additive trap

Every failure tempts a new rule. The rules file grows, and rules written in natural language interact in ways nobody can predict: one fixes a failure, contradicts an earlier one, and the over-constrained model picks a rule to violate quietly. The quality jumps come from deletion, not addition: collapse duplicates, remove rules that fight each other, and move constraints out of prose into code, because a check cannot be contradicted by a later paragraph. Two corollaries worth keeping. Examples steer harder than rules: a demonstration outweighs a prohibition, and a stale example quietly constrains what the model explores. And there is no neutral filler: every line in a standing file pushes behavior somewhere. (Winter, "Why Harness Engineering Is So Hard," July 2026: https://x.com/winterarc2125/status/2081042507471696318)

## The foundation moves

Models update on someone else's schedule, and a harness tuned to one generation's failure modes guards against problems the next generation doesn't have while missing the ones it does. When the model under the process changes: capture a before-reading of whatever quality signals the project already tracks, re-read the standing rules asking which of them existed to constrain the old model, and expect the update to break something you can't yet name. A harness is never done; build it to be re-tuned, and treat that as the substrate's nature rather than a planning failure.

## The edge test for parallel work

Before running two pieces of agent work at the same time, ask whether one's output feeds the other's input. No data crossing means no dependency: run them at once. Data crossing means a real edge: the later step waits. Most sequential chains contain steps that were only typed in order, not dependent in fact, and most parallel ambitions break on edges that turn out to be real (a review round that consumes the previous round's fixes is a real edge, however tempting the speedup). One verification pattern is recorded here for when the evidence arrives: if a single skeptical reviewer provably misses a class of problem, several reviewers with genuinely different lenses (correctness, security, reproduction) catch what identical duplicates never will. Adopt that on evidence of a real miss, not ahead of it. (Codez, "Graph Engineering with Claude," July 2026: https://x.com/0xcodez/status/2079165300625330317. The plan-shape counterparts, program design and vertical slices, are credited in construct-the-plan's rationale to Dex Horthy: https://x.com/dexhorthy/status/2081058573556306030)

## Sources

- **Thariq Shihipar, "The new rules of context engineering for Claude 5 models" (July 2026)**
  - Primary: https://x.com/trq212/status/2080710971228918066
  - Wayback snapshot: https://web.archive.org/web/20260724180116/https://x.com/trq212/status/2080710971228918066
- **Winter, "Why Harness Engineering Is So Hard" (July 2026)**
  - Primary: https://x.com/winterarc2125/status/2081042507471696318
  - Wayback snapshot: not currently archived (X posts are captured inconsistently); the author, title, and date are the durable citation.
- **Codez, "Graph Engineering with Claude" (July 2026)**
  - Primary: https://x.com/0xcodez/status/2079165300625330317
  - Wayback snapshot: not currently archived (X posts are captured inconsistently); the author, title, and date are the durable citation.
- **Dex Horthy, "Why Software Factories Fail: Turning the lights back on" (July 2026)**
  - Primary: https://x.com/dexhorthy/status/2081058573556306030
  - Wayback snapshot: not currently archived (X posts are captured inconsistently); the author, title, and date are the durable citation.
