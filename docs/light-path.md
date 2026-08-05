# The light path

The full chain is thorough and token-heavy: five plan challenges, a build, tests, a security check, five implementation challenges, and the bookkeeping around them. On a mid-size feature that plausibly lands in the low hundreds of thousands of tokens end to end. If you're paying per token, or working with a smaller model that gets less out of each round, that's real money.

The light path is the lower-assurance shape. It asks for fewer review rounds, so it normally does less work, but Foundry has not measured a fixed saving and does not treat the rounds as the dominant cost. Build volume, repeated reads, duplicate checks, and late mechanical work can outweigh them. Use this shape when the lower assurance is an honest trade:

1. **start-up**, then **construct-the-plan** as normal.
2. **frame-it stays.** A five-question interview is the cheapest insurance in the whole chain; never cut it first.
3. **challenge-plan twice**, not five times. Two genuinely different angles catch the worst of it.
4. **build-it** and **test-it** as normal.
5. **challenge-implementation twice**, not five times.
6. **wrap-up** and **handoff** as normal.

When to spend on the full chain instead: work you'll live with for months, work that touches money or user data, work where being subtly wrong is expensive. The extra rounds exist because "done" and "right" aren't the same thing. In the source project's measured runs, later rounds and independent graders still found consequential defects. [Chain economics](wiki/engineering/chain-economics.md) carries the evidence and its limits.

Smaller models: the chain is plain instructions, so any capable model can follow it. Expect the challenge rounds to catch less per round; compensate with the angles that need the least cleverness (the sequence of steps, hostile inputs, config syntax) rather than more rounds.
