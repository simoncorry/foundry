# Hide what's likely to change

The second of the three principles. The argument synthesizes five primary sources from 1972 to 2020, plus one inline anchor.

## The principle in one paragraph

The most natural-feeling way to decompose a system is also the worst: chop it by the order things happen (input, then transform, then output). Parnas 1972 showed that this flowchart-based decomposition couples every module to the shared data format, so any change to the format ripples through everything. The better criterion: list the design decisions most likely to change, and let one module hide each. Ousterhout 2018 operationalizes Parnas: prefer **deep modules** (small interface hiding a lot of implementation) over **shallow modules** (interface as wide as what the module does). McIlroy's 1978 Unix philosophy is the practical instantiation at the program level: each program does one thing well. Metz 2016 names the failure mode when this goes wrong: the wrong abstraction. Abramov 2020 tells the regret story in JavaScript. Tef 2016 gives the operational mantra: write code that's easy to delete, not easy to extend. All of them make a single argument: decompose by what changes, not by what runs first, and make the change-axis the module boundary.

## The sources

### Parnas 1972, the foundational decomposition criterion

David L. Parnas, "On the Criteria To Be Used in Decomposing Systems into Modules." Communications of the ACM, Vol. 15 No. 12, December 1972, pp. 1053-1058.

- Primary: https://dl.acm.org/doi/10.1145/361598.361623
- Open-access transcription: http://sunnyday.mit.edu/16.355/parnas-criteria.html
- Wayback snapshot: https://web.archive.org/web/20260526181455/http://sunnyday.mit.edu/16.355/parnas-criteria.html

Parnas's keyword-index example is the load-bearing illustration. Two ways to decompose a system that produces a keyword-in-context index:

- **Modularization 1 (flowchart-based):** an input module reads lines, a shift module computes rotations, an alphabetizer sorts, an output module prints, a master control sequences them. Each module knows the shared data format. If the format changes (lines on disk instead of in memory, characters packed differently, shifts computed lazily), all modules change.

- **Modularization 2 (information-hiding):** a line-storage module hides how lines are stored, behind small accessor functions. A shifter hides whether rotations are precomputed or computed on demand. An alphabetizer hides whether sorting is eager or lazy. Each module hides a design decision likely to change; the others call its interface and never learn the implementation.

Parnas's load-bearing quote: "We propose instead that one begins with a list of difficult design decisions or design decisions which are likely to change. Each module is then designed to hide such a decision from the others. Since, in most cases, design decisions transcend time of execution, modules will not correspond to steps in the processing."

His five decomposition patterns, extracted from the paper's worked examples: a data structure and its accessors live in one module; a routine and its calling convention live together; control-block formats hide inside a control-block module; character codes and orderings hide in a module; processing order hides where practical.

### Ousterhout 2018, deep modules as the operational test

John K. Ousterhout, *A Philosophy of Software Design*. Yaknyam Press, first edition 2018, second edition 2021.

- Book page: https://web.stanford.edu/~ouster/cgi-bin/book.php

Ousterhout defines complexity precisely: anything related to the structure of a software system that makes it hard to understand and modify. The book's central operational concept is deep versus shallow modules:

- A **deep module** has a simple interface hiding a lot of implementation. The canonical example is the Unix file interface: five functions (open, read, write, seek, close) hide hundreds of thousands of lines of file-system, driver, permission, and caching code, and the interface has stayed stable for decades while implementations changed underneath.

- A **shallow module** has an interface roughly as wide as what it does: a function whose signature plus call-site ceremony is as complex as the one line of work it performs. Net effect on system complexity: zero, or negative.

Ousterhout's design rule: pull complexity downward. The module's implementation should absorb complexity so the module's users don't have to. The opposite (pushing complexity outward to every caller) creates shallow modules at scale, which is what the small-functions-everywhere school of Clean Code produces; his second edition added explicit subsections disagreeing with Robert Martin's Clean Code on method length and comments. See [essential vs accidental complexity](essential-vs-accidental.md) for Muratori's complementary critique on the performance side; together they're a two-front argument, design quality and runtime cost.

### McIlroy 1978, do one thing well

M. D. McIlroy, E. N. Pinson, B. A. Tague, "Unix Time-Sharing System: Foreword." The Bell System Technical Journal, Vol. 57 No. 6 Part 2, July-August 1978, pp. 1902-1903.

- Primary archive: https://archive.org/details/bstj57-6-1899

McIlroy headed the Bell Labs research center that produced Unix and invented the pipe. The four maxims, verbatim:

> 1. Make each program do one thing well. To do a new job, build afresh rather than complicate old programs by adding new "features".
> 2. Expect the output of every program to become the input to another, as yet unknown, program. Don't clutter output with extraneous information. Avoid stringently columnar or binary input formats. Don't insist on interactive input.
> 3. Design and build software, even operating systems, to be tried early, ideally within weeks. Don't hesitate to throw away the clumsy parts and rebuild them.
> 4. Use tools in preference to unskilled help to lighten a programming task, even if you have to detour to build the tools and expect to throw some of them out after you've finished using them.

The first maxim is the spiritual ancestor of "you aren't gonna need it," of Brooks's grow-software-organically, and of every anti-bloat argument since; the build-afresh line predates Brooks by eight years. Provenance note: the Bell System Technical Journal was editorially reviewed inside Bell Labs, foundational and authoritative, though not externally peer-reviewed in the academic sense.

### Metz 2016, the wrong abstraction

Sandi Metz, "The Wrong Abstraction." sandimetz.com, 20 January 2016. Derived from her RailsConf 2014 talk "All the little things."

- Primary: https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction
- Wayback snapshot: https://web.archive.org/web/20260526181644/https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction

Metz's load-bearing claim: duplication is far cheaper than the wrong abstraction. When an abstraction was extracted from too few examples, or from examples whose underlying shape wasn't actually shared, callers start passing parameters and adding conditional paths through the shared code. The abstraction becomes a cage; modifying it for any one caller risks the others; the team piles on conditionals to protect its sunk cost.

Her recovery technique, from the post:

> "If you find yourself in this situation, resist being driven by sunk costs. When dealing with the wrong abstraction, the fastest way forward is back. Do the following:
> 1. Re-introduce duplication by inlining the abstracted code back into every caller.
> 2. Within each caller, use the parameters being passed to determine the subset of the inlined code that this specific caller executes.
> 3. Delete the bits that aren't needed for this particular caller.
> This removes both the abstraction and the conditionals, and reduces each caller to only the code it needs."

And her diagnostic for spotting one in the wild: "If you find yourself passing parameters and adding conditional paths through shared code, the abstraction is incorrect."

### Abramov 2020, the JavaScript regret story

Dan Abramov, "Goodbye, Clean Code." overreacted.io, 11 January 2020.

- Primary: https://overreacted.io/goodbye-clean-code/
- Wayback snapshot: https://web.archive.org/web/20260526181826/https://overreacted.io/goodbye-clean-code/

Abramov (React core team) writes a confession: he refactored a colleague's "messy" but adaptable resize code (separate methods per shape, some duplication) into a clean unified decomposition of directions and shapes. Cleaner, less duplication. Then requirements changed; different handles on different shapes needed special behavior; the clean abstraction would have to become several times more convoluted to accommodate it, while the original messy version would have stayed easy to change. His operational lesson: "I thought a lot about how the code looked... but not about how it evolved with a team of squishy humans."

For plain-JavaScript codebases this maps Metz onto the exact language: the temptation to unify similar-looking functions is strong, the cost of getting it wrong is high, and the recovery is the same inline-and-re-observe technique.

### Inline anchor: Tef 2016, write code that's easy to delete

Thomas Figg, "Write code that is easy to delete, not easy to extend." programmingisterrible.com, 13 February 2016.

- Primary: https://programmingisterrible.com/post/139222674273/write-code-that-is-easy-to-delete-not-easy-to
- Wayback snapshot: https://web.archive.org/web/20260526181957/https://programmingisterrible.com/post/139222674273/write-code-that-is-easy-to-delete-not-easy-to

The operational complement to Metz: she tells you when to undo a wrong abstraction; Tef tells you how to design for that undo from the start. Key technique: "repeat yourself to avoid creating dependencies, but don't repeat yourself to manage them." Build simple-to-use interfaces out of simpler-to-implement but clumsier parts; isolate the hard-to-write and likely-to-change parts. His load-bearing line: "Good code isn't about getting it right the first time. Good code is just legacy code that doesn't get in the way."

## What this means in practice

### Parnas test for long functions

When a function is long and you feel the urge to split it, the question isn't "where are the natural step boundaries?" It's "what design decision in here is likely to change, and can I hide just that?" If nothing's likely to change, leave it long. Splitting on step boundaries couples all the resulting pieces to the shared data shape, so the next shape change ripples through every piece. A long function in a hot loop is often correct exactly as it is.

### Metz and Abramov test for shared code

About to add a parameter to a shared function so different callers can opt in or out? The abstraction is wrong. Inline it back into the callers, let them duplicate briefly, and watch what the real shape wants to be. This is the most common over-engineering pattern in dynamic-language codebases because nothing at compile time catches it.

### Ousterhout test for new modules

About to add a new file, class, or closure? Check the depth ratio. If the proposed module's interface would be roughly as wide as its implementation, you're adding a shallow module: complexity added, none subtracted. Either deepen it (more implementation behind a smaller interface) or skip it and inline.

## See also

- [Essential vs accidental complexity](essential-vs-accidental.md): the framing this principle mechanizes.
- [Theory and documentation](theory-and-documentation.md): what to write down about the decisions you chose to hide.
- [The index](../INDEX.md) for the rest of the library.
