# Build the theory; documentation reconstructs it

The third of the three principles. Two primary sources (Naur 1985, Parnas & Clements 1986) plus two inline anchors on the disposition that makes the work possible (Knuth 1974, Dijkstra 1972).

## The principle in one paragraph

Programming is not the production of code. Programming is the construction of a mental theory of how the problem at hand is solved by program execution; the code is a lossy projection of that theory. When the programmers who hold the theory leave (or, for an agent without continuous memory, when the session ends), the theory dies even though the code survives, and the code becomes legacy because nobody can reconstruct the original theory just by reading it. Naur 1985 makes this argument from observations of real teams; the conclusion is that the real design output isn't code but theory, and documentation exists to reconstruct the theory for the next person who arrives without it. Parnas & Clements 1986 give the operational answer: real design is never rational (clients don't know what they want, requirements shift, humans err), so we "fake" rationality in the documentation: present the design as if derived cleanly from requirements, and record the alternatives considered AND rejected, because the future maintainer needs the rational path even though the original path was messier. Knuth's premature-optimization warning and Dijkstra's humility both follow from the same observation: heads have hard limits, and design discipline is the price of working within them.

## The sources

### Naur 1985, programming as theory building

Peter Naur, "Programming as Theory Building." Microprocessing and Microprogramming, Vol. 15 No. 5, 1985, pp. 253-261. Originally an invited keynote at Euromicro 84, Copenhagen.

- Primary: https://pages.cs.wisc.edu/~remzi/Naur.pdf
- Wayback snapshot: https://web.archive.org/web/20260526182056/https://pages.cs.wisc.edu/~remzi/Naur.pdf

Naur draws on Gilbert Ryle's notion of theory (intelligent activity guided by understanding, distinct from rule-following) and argues that programming is fundamentally theory construction, not text production. The programmer builds, in their head, a theory of how the problem maps onto execution. The program text encodes some of that theory and loses most of it: how the program would respond to unusual inputs, how it would need to change for plausible new requirements, how its structure relates to the real-world domain it models.

His central observation: when a team is augmented by new programmers, the newcomers cannot acquire the theory just by reading the code and the documentation; they need contact with the people who hold it. When the original team disperses entirely, the theory dies. The text remains and still executes, but modification becomes a guessing game. Key quote: "For a new programmer to come to possess an existing theory of a program it is insufficient that he or she has the opportunity to become familiar with the program text and other documentation. What is required is that the new programmer has the opportunity to work in close contact with the programmers who already possess the theory."

For an agent without continuous memory across sessions, Naur's argument lands twice as hard. Every session, the agent is structurally the new programmer without the theory. The theory has to be reconstructable from the artifacts the prior session left behind, which is exactly what a sessions log, plan files, and a wiki are for: not documenting the code, reconstructing the theory.

### Parnas & Clements 1986, fake the rational design process

David L. Parnas and Paul C. Clements, "A Rational Design Process: How and Why to Fake It." IEEE Transactions on Software Engineering, Vol. SE-12 No. 2, February 1986, pp. 251-257.

- Primary: https://users.ece.utexas.edu/~perry/education/SE-Intro/fakeit.pdf
- Wayback snapshot: https://web.archive.org/web/20260526182119/https://users.ece.utexas.edu/~perry/education/SE-Intro/fakeit.pdf

Their list of reasons real design is never rational: clients don't know exactly what they want and can't articulate it; design-relevant facts only emerge during implementation; humans can't hold the full design in mind, so concerns get separated late and errors happen before that; external changes invalidate prior decisions; human error is unavoidable; designers carry preconceptions from prior projects; and economic pressure to reuse code means the design isn't optimal for any single project.

The conclusion: no process will let us derive software rationally from requirements, but we can fake it. Produce documentation that presents the design as if it had been derived rationally. Doing so pays during development (keeps the work closer to the rational path) and during maintenance (gives the future maintainer a coherent design instead of recovery-by-archaeology).

The specific practice worth stealing verbatim: "We make a policy of recording all of the design alternatives that we considered and rejected. For each, we explain why it was considered and why it was finally rejected. Months, weeks, or even hours later, when we wonder why we did what we did, we can find out. Years from now, the maintainer will have many of the same questions and will find his answers in our documents." This is why the chain's plan files split into a narrative half and a working half, and why the narrative half records the road not taken.

### Inline anchor: Knuth 1974, premature optimization in full context

Donald E. Knuth, "Structured Programming with go to Statements." ACM Computing Surveys, Vol. 6 No. 4, December 1974, pp. 261-301.

- Open-access PDF: https://cowboyprogramming.com/files/p261-knuth.pdf

The most-cited quote in software engineering, almost always with the rest of the paragraph cut off:

> "There is no doubt that the grail of efficiency leads to abuse. Programmers waste enormous amounts of time thinking about, or worrying about, the speed of noncritical parts of their programs, and these attempts at efficiency actually have a strong negative impact when debugging and maintenance are considered. We should forget about small efficiencies, say about 97% of the time: premature optimization is the root of all evil. Yet we should not pass up our opportunities in that critical 3%. A good programmer will not be lulled into complacency by such reasoning, he will be wise to look carefully at the critical code; but only after that code has been identified."

Knuth belongs to this principle because optimization without theory is acting without the rational design recorded: optimize on a guess about where time goes and you usually optimize the wrong thing, make the code harder to read, and raise the maintenance bill. "Premature" is an epistemic word here, not a scheduling word; the fix is to profile first and then spend on the identified 3%. Not a license to ignore performance; a discipline for spending effort where it pays.

### Inline anchor: Dijkstra 1972, the humble disposition

Edsger W. Dijkstra, "The Humble Programmer." 1972 ACM Turing Award lecture, published in Communications of the ACM, Vol. 15 No. 10, October 1972.

- Primary: https://www.cs.utexas.edu/~EWD/ewd03xx/EWD340.PDF
- Wayback snapshot: https://web.archive.org/web/20260526182234/https://www.cs.utexas.edu/~EWD/ewd03xx/EWD340.PDF

Dijkstra's argument: programming is hard because human cognitive limits are the binding constraint. The task is constructing, from a few primitives, systems whose complexity exceeds what any head can hold in detail; the honest response is humility about that limit and design discipline as its price. The disposition is anti-cleverness: the clever one-liner costs more in future debugging than it saved in writing, and the arrogant design that "handles every case" usually doesn't, because the designer couldn't think of all the cases.

Two practices follow. When you see an opportunity for a clever change in code you don't fully understand, the humble move is to learn the theory first. When you see complexity you can't explain, the humble move is to assume it exists for a reason you haven't grasped yet, not to refactor it away. Both defend against the trap Naur names: assuming the theory is recoverable from the text alone.

## What this means in practice

### Naur test: theory or just text?

Landing on unfamiliar code, the question isn't "can I read this?" but "do I understand the theory of why it's this shape?" If you can't articulate why, any modification is a guess. Read the records first: the wiki page for the domain, the session entries that touched this code, the plan that shipped it. That's what they're for.

### Parnas & Clements test: are the rejected roads recorded?

Drafting a plan or a substantive change description, record the alternatives considered and rejected, with the reasoning. The future reader is better served by the road not taken than by a clean but mysterious record of only the road taken.

### Knuth and Dijkstra test: clever or humble?

Tempted by a one-liner that elegantly handles three cases? Ask whether a future reader without your context follows it in thirty seconds. If not, write the longer version that's obviously correct. Cleverness without recorded justification is accidental complexity wearing a costume.

## See also

- [Essential vs accidental complexity](essential-vs-accidental.md): the first principle.
- [Hide what's likely to change](information-hiding.md): the second.
- [The index](../INDEX.md) for the rest of the library.
