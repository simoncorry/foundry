# Systems and craft

How design work stays coherent past one screen and one week. Sources: Christopher Alexander (A Pattern Language; Notes on the Synthesis of Form), Brad Frost (Atomic Design, read in the author-published online edition), Alla Kholmatova (Design Systems), Dieter Rams (the ten principles, widely published), Paul Rand (Thoughts on Design), Frank Chimero (The Shape of Design, read in the author-published online edition), John Maeda (The Laws of Simplicity).

## Fit and patterns (Alexander)

Notes on the Synthesis of Form defines design as achieving fit between a form and its context; a design is wrong exactly where it misfits the forces acting on it. A Pattern Language then packages proven fits as patterns: a named, recurring problem in a context plus the core of its solution, connected to the patterns above and below it. Two consequences for interface work:

- Patterns are problem-solution pairs IN CONTEXT, not visual samples. Copying a pattern without its context is how plausible-looking wrong UI happens (the software world relearned this with design patterns and then with component libraries).
- The language matters more than any pattern: patterns compose. A settings screen is a composition of smaller known fits (grouped controls, progressive disclosure, safe defaults), and naming them lets a team, or an agent, reason about them.

Software engineering borrowed Alexander twice (design patterns, then pattern languages for architecture); he's the rare author the engineering shelf and this one both cite.

## Atomic design (Frost)

The mental model for component systems: atoms (buttons, inputs, labels) compose into molecules (a search field), molecules into organisms (a header), organisms into templates (the page's structure), and templates into pages (real content in place). The load-bearing ideas: the same atoms appear everywhere, so fixing an atom fixes the system; templates versus pages separates structure from content, which is exactly where real-content stress-testing happens; and the hierarchy is a mental model, not a strict file layout.

## Design systems as shared language (Kholmatova)

A design system is the shared language of a product team, made tangible: functional patterns (what things do: a card, a picker) and perceptual patterns (how things feel: color voice, type voice, motion voice) plus the principles that arbitrate between them. Rules that transfer directly:

- A pattern earns systemization by recurring; systemize on the second or third real use, not the first guess (the design-side cousin of the engineering shelf's rule of three).
- Strict versus loose is a dial, not a virtue: strict systems buy consistency and pay in adaptation speed; loose ones reverse the trade. Choose per pattern, deliberately.
- The system serves the product's personality; perceptual patterns are where the voice lives, and motion values belong to that voice ([the motion overview](../motion/overview.md) carries the cohesion rule).

## Rams' ten principles

Good design: is innovative; makes a product useful; is aesthetic; makes a product understandable; is unobtrusive; is honest; is long-lasting; is thorough down to the last detail; is environmentally friendly; involves as little design as possible. Three carry daily weight in interface reviews: understandable (the product explains itself, Norman and Krug's territory), honest (no promising what the product can't do, no dark patterns dressed as convenience), and as-little-design-as-possible (Maeda's territory below, and the design cousin of the engineering shelf's essential-versus-accidental lens).

## Simplicity as a system (Maeda)

The Laws of Simplicity's usable core: reduce (the simplest way to simplify is thoughtful removal), organize (grouping makes many things read as few), and time (waiting feels like complexity; speed feels like simplicity, which is why response thresholds and motion durations are simplicity tools). Maeda's balance law keeps it honest: simplicity and complexity need each other; strip everything and the surface reads as empty, not simple. And Tesler's Law ([UX principles](ux-principles.md)) polices the whole exercise: complexity removed from the screen went somewhere; say where.

## Why before how (Rand, Chimero)

Rand's Thoughts on Design argues form and content are one problem: beauty that doesn't serve the content is decoration, and content presented without form goes unread. His working test for any graphic move: does it serve the idea? Chimero's The Shape of Design adds the working posture: start from why (what should this do to the person seeing it), let the how emerge through improvisation against constraints, and treat design as a conversation with the material rather than the execution of a fixed picture. That posture is why mockups drift from shipped products, and why the fix is designing in the real medium early.

## Craft posture

The compounding of unseen details: users rarely name a well-set label, a correct tabular figure, or a popover that grows from its trigger, but the aggregate is the feel of quality (Kowalski's framing, citing Paul Graham's image of quality as a chorus of tiny details, each too quiet to hear alone). Two operational habits fall out: review with fresh eyes the next day, because craft failures are invisible while making them; and fix the atom, not the instance, because in a system every craft fix multiplies.
