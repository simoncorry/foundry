# Engineering fundamentals

Three principles about building software that have aged well across fifty years, synthesized from the classical papers and a handful of modern voices, every claim cited to its primary source. They exist here because the chain's review rounds need operational vocabulary: "is this right-sized?" is a taste argument until you have Brooks, Parnas, and Naur to argue it with.

## The three principles

1. **Essential vs accidental complexity.** Essential complexity is inherent in the problem (real data to sync, real math, real failure handling). Accidental complexity is everything added on top: wrapper layers around one-off cases, defensive validation on inputs already guaranteed upstream, generic machinery for a single caller. The trap is dressing accidental complexity in essential-sounding language. The test: is this complexity in the problem, or in my approach? Deep page: [essential vs accidental complexity](essential-vs-accidental.md).

2. **Hide what's likely to change.** The natural-feeling decomposition (split by the order things happen) is the worst one, because it couples every piece to the shared data shape. Decompose by what's likely to change and let one module hide each changeable decision. Prefer deep modules (small interface, lots hidden) over shallow ones. And when you're tempted to add a parameter to shared code so different callers can opt in or out, the abstraction is wrong; inline it back and let the real shape emerge. Deep page: [hide what's likely to change](information-hiding.md).

3. **Build the theory; documentation reconstructs it.** Programming is constructing a mental theory of how the problem maps to execution; the code is a lossy projection of that theory. When the theory-holder leaves (or the session ends), the theory dies unless the records can rebuild it. So plans and notes record alternatives considered AND rejected, not just the chosen path. Deep page: [theory and documentation](theory-and-documentation.md).

## When to reach for these pages

- Sketching a new system or comparing two approaches: all three.
- A design feels heavier than the problem it solves: the first page.
- About to extract shared code, split a long function, or design an interface: the second page.
- Deciding what a plan, record, or comment should say: the third page.
- A challenge round needs to argue over-engineering with named sources instead of taste: the first two.

## The three-question self-audit

Before building anything with new abstractions or new files, answer these in one line each:

1. **Essential elements.** Which parts of this design are unavoidable complexity inherent to the problem? Those are non-negotiable.
2. **Accidental bloat.** Did I introduce wrapper patterns, premature optimization, or unneeded abstractions? The usual suspects: a factory around a one-off case, multi-handler dispatch for a single use, two checks answering the same question the same way, comments that repeat the code.
3. **Alignment.** Can the design cite at least one of the three principles and its source? If it can't be aligned to any of them, that's a strong signal it's the wrong shape.

## Quick heuristics that derive from the principles

- **You aren't gonna need it.** Build what has a concrete user story today; anticipation is how accidents accrue.
- **Rule of three.** Wait for a pattern to occur three times before extracting a shared abstraction; two occurrences may be coincidence.
- **Pull complexity downward.** Let a module's implementation absorb complexity so its callers don't have to.
