# The wiki

Distilled knowledge, one page per topic. The sessions log records what happened; these pages record what we know. Wrap-up's distill step grows them: when a session teaches something durable, the lesson moves into the page it belongs to (or a new page), and every page gets a line here, because this index is the map. That's enforced, not hoped: the check fails on any page this index doesn't list and on any reference that points at nothing.

Each line says when to reach for the page.

## Engineering fundamentals

Ideas about building software that have aged well across fifty years, for design reviews and "is this right-sized?" arguments.

- [Overview](engineering/overview.md): the three principles and when to load the deep pages.
- [Essential vs accidental complexity](engineering/essential-vs-accidental.md): is this complexity in the problem, or in my approach? Reach for it when a design feels heavier than the problem.
- [Hide what's likely to change](engineering/information-hiding.md): how to split code into modules, and the wrong-abstraction trap. Reach for it before extracting shared code or designing an interface.
- [Theory and documentation](engineering/theory-and-documentation.md): why the code alone can't carry a project's reasoning, and what to write down instead. Reach for it when deciding what a plan or record should say.

## Design fundamentals

The design canon distilled, for interface work and hierarchy, grouping, labels, and defaults arguments.

- [Overview](design/overview.md): the five clusters and when to load each page.
- [Perception and form](design/perception-and-form.md): how eyes group, order, and weigh what they see. Reach for it when a layout feels off and you need the reason.
- [UX principles](design/ux-principles.md): Norman's doors, Krug's don't-make-me-think, the Laws of UX. Reach for it when arguing about defaults, labels, or flows.
- [Typography and grids](design/typography-and-grids.md): type that reads well and grids that hold. Reach for it when setting text or structuring a page.
- [Color](design/color.md): judgment about color relationships, not color math. Reach for it when colors fight.
- [Systems and craft](design/systems-and-craft.md): patterns, design systems, and what "good design" has meant to the people who defined it. Reach for it when building components meant to be reused.

## Motion fundamentals

Taste and theory for interface motion, adapted with credit from MIT-licensed work by Emil Kowalski and Meng To.

- [Overview](motion/overview.md): the should-it-animate question and when to load each page.
- [Easing and timing](motion/easing-and-timing.md): curves, durations, and springs. Reach for it when choosing how a transition should feel.
- [Interaction feel](motion/interaction-feel.md): interruptibility, gestures, and responsiveness. Reach for it when motion needs to follow a user's hand.
- [Performance](motion/performance.md): what the browser pays for animation and how to keep it cheap. Reach for it before animating anything that repaints.
- [Vocabulary](motion/vocabulary.md): the reverse lookup from "I want it to feel like X" to the technique. Reach for it when you know the feel but not the name.
