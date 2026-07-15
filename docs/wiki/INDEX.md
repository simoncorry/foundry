# The wiki

Distilled knowledge, one page per topic. The sessions log records what happened; these pages record what we know. Wrap-up's distill step grows them: when a session teaches something durable, the lesson moves into the page it belongs to (or a new page), and every page gets a line here, because this index is the map. That's enforced, not hoped: the check fails on any page this index doesn't list and on any reference that points at nothing.

Each line says when to reach for the page.

## Engineering fundamentals

Ideas about building software that have aged well across fifty years, for design reviews and "is this right-sized?" arguments.

- [Overview](engineering/overview.md): the three principles and when to load the deep pages.
- [Essential vs accidental complexity](engineering/essential-vs-accidental.md): is this complexity in the problem, or in my approach? Reach for it when a design feels heavier than the problem.
- [Hide what's likely to change](engineering/information-hiding.md): how to split code into modules, and the wrong-abstraction trap. Reach for it before extracting shared code or designing an interface.
- [Theory and documentation](engineering/theory-and-documentation.md): why the code alone can't carry a project's reasoning, and what to write down instead. Reach for it when deciding what a plan or record should say.
