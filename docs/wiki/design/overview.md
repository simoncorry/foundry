# Design fundamentals

The design canon distilled into working vocabulary, so a review can argue about a settings panel the way it argues about code shape: from named, citable principles instead of vibes. When a review says "the hierarchy is wrong," these pages are what let it say why, in whose terms, and what to do instead.

Sourcing, honest by construction: synthesized from the canon curated at [designbooks.org](https://designbooks.org). Concepts are cited by author and book so a reader can go to the shelf; nothing is pasted from a copyrighted work. Yablonski's [lawsofux.com](https://lawsofux.com) was checked directly at authoring time; Frost's Atomic Design and Chimero's The Shape of Design are cited against their author-published online editions; Rams' ten principles are widely published by the Vitsœ archive.

## The spine (run these checks in order on any surface)

1. **Who is this for and what are they trying to do?** Goal-directed design starts from the person's goal, not the feature list (Cooper, About Face). If you can't say the goal, stop designing and go find out (Hall, Just Enough Research).
2. **Does it explain itself?** A first-time viewer should not have to think about what things are or how they work (Krug, Don't Make Me Think). Affordances show what's possible, signifiers show where to act, feedback confirms it happened, and the mapping between control and effect should be obvious enough to need no label (Norman, The Design of Everyday Things).
3. **Is the hierarchy real?** The most important thing should be the most visually obvious, established through size, weight, spacing, and contrast, not decoration. If everything is emphasized, nothing is (Hofmann; Müller-Brockmann).
4. **Does grouping match meaning?** Things near each other read as related; things that look alike read as the same kind. Perception laws do this whether you intend them or not, so use them deliberately (the gestalt laws in [perception and form](perception-and-form.md)).
5. **Is it consistent with what people already know?** Users spend most of their time in other software; matching their existing model beats novelty (Jakob's Law). Break a familiar pattern only when you can prove the replacement is better.
6. **What did you remove?** Simplicity is subtraction plus organization, not minimal decoration (Maeda, The Laws of Simplicity; Rams' less-but-better ethos). But complexity is conserved: whatever you hide has to go somewhere, so decide who carries it, the interface or the user (Tesler's Law).
7. **Does it hold up in use, not in a mockup?** Test against the goal with real behavior; satisficing means people click the first plausible thing, not the best thing (Krug). Peak-end says the last moment of a flow colors the memory of all of it.

## The pages

- [UX principles](ux-principles.md): Norman's core vocabulary, Krug's usability rules, the Laws of UX, research basics, error design. The constant-use page.
- [Perception and form](perception-and-form.md): gestalt laws, visual weight, figure-ground, contrast, the grammar of visual elements. The other constant-use page.
- [Typography and grids](typography-and-grids.md): Bringhurst's discipline, type as interface, grid systems. When shaping a surface.
- [Systems and craft](systems-and-craft.md): patterns and fit, atomic design, design systems as shared language, Rams, why-before-how. When building things meant to be reused.
- [Color](color.md): Albers' relativity and functional color roles. When color is the question.

## Two standing postures

- **Taste routes to the human.** The chain encodes this: frame-it's Taste checkpoints exist because "I'll know it when I see it" belongs to a person. These pages narrow the taste surface by settling everything principle-decidable first, so the human's eye is spent on genuine taste calls, not on fixable hierarchy mistakes.
- **Field lessons worth carrying anywhere:** feedback never gates (a density or quiet-mode setting may thin decoration but must never remove the response to a user's action; silence after an action reads as broken, not calm). When one setting overrides another, name the coupling in the control itself; a setting that goes dead invisibly reads as a bug. And presets beat sliders for first contact, but only with the detail controls still visibly reachable; staged choice needs an honest escape hatch.
