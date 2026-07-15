# Typography and grids

Sources: Robert Bringhurst (The Elements of Typographic Style), Ellen Lupton (Thinking with Type), Josef Müller-Brockmann (Grid Systems in Graphic Design), Armin Hofmann (Graphic Design Manual), Karl Gerstner (Designing Programmes), plus Apple's published size-specific type guidance.

## Bringhurst's discipline

The book's one-line creed, quoted because it's the field's north star: "Typography exists to honor content." Everything else is application:

- **Measure**: comfortable lines run roughly 45 to 75 characters, with the mid-60s as the classic ideal. Longer lines lose the reader at the return; shorter ones chop rhythm. In interface work this decides column and dialog widths more often than any aesthetic preference.
- **Leading (line spacing)**: body text needs air (roughly 1.4 to 1.6 times the size in interface work); large display text needs it removed (1.0 to 1.2), because leading that's right for body reads as gaping at display sizes.
- **Hierarchy through restraint**: one or two families, a deliberate scale of sizes, and weight doing the emphasis work. Every additional face or arbitrary size is a tax on coherence. Choose faces for the job and the medium, not for novelty.
- **Details are the craft**: real quotation marks, dashes handled per house style, tabular figures where numbers align in columns (timers, prices, stats), small caps and ligatures where the face provides them. Readers never name these; they feel their absence as cheapness.

## Type as interface (Lupton)

Thinking with Type's practical frame: type is what interfaces are mostly made of, so typographic decisions ARE layout decisions. Working rules: establish a type scale and stick to it (arbitrary sizes read as bugs); pair size with weight and color as one hierarchy system rather than three independent dials; and set text as text, not as pictures of text, for accessibility and reflow.

## Size-specific settings (Apple's published guidance)

- Tracking (letter-spacing) is size-specific, never one value for all sizes: large display text wants slightly negative tracking, body sits near zero, small labels want a touch positive for legibility.
- Leading tracks size inversely (tight for headings, loose for body), and hierarchy is built from weight, size, and leading as a set.
- Respect the user's text-size setting: space in relative units so a larger font scales the layout instead of breaking it.

## Grid systems (Müller-Brockmann)

The grid is an ordering system: it turns a hundred per-screen alignment decisions into one decision made once. Grid Systems in Graphic Design's argument, translated to product work:

- Columns, gutters, and a baseline rhythm constrain placement so that consistency is the default and deviation is a choice. The constraint is the point; a grid you override casually is decoration.
- The grid expresses structure honestly: related content shares columns, hierarchy shows in span, and the same content type lands in the same place on every screen (which is also Jakob's Law and the similarity law doing layout work).
- Objectivity over expression for working tools: Müller-Brockmann's Swiss posture is that clarity is a form of respect for the reader. Dashboards, settings screens, and status surfaces are Swiss jobs; splash screens can be expressive.

Gerstner's Designing Programmes is the bridge to modern practice: design the rule system, not the artifact, and let instances fall out of the program. Every design-token file and component library is this idea shipped ([systems and craft](systems-and-craft.md) continues it).

## Hofmann's form discipline

The Graphic Design Manual's exercises teach one transferable judgment: strip a composition to point, line, and plane, and make it work in black and white first. If the layout's structure doesn't hold without color and ornament, color and ornament are hiding a structural failure. Cheap practical test for any panel: grayscale it; hierarchy should survive.

## Working tie-in

Tabular figures for anything that ticks (timers, currency, counters) is both a Bringhurst detail and a motion rule ([the motion vocabulary](../motion/vocabulary.md): number tickers need fixed-width digits so nothing jitters). If your project keeps a token file for spacing and type, this page supplies the reasoning and that file supplies the values; raw values outside the scale need a structural excuse.
