# Perception and form

Why layouts read the way they do before a single word is processed. Sources: Rudolf Arnheim (Art and Visual Perception; Visual Thinking), Donis A. Dondis (A Primer of Visual Literacy), Wucius Wong (Principles of Form and Design), Christian Leborg (Visual Grammar). The gestalt entries that lawsofux.com carries (proximity, similarity, common region, uniform connectedness, Prägnanz) were checked against it; figure-ground, closure, and continuity come from the gestalt literature via Arnheim and Dondis.

## The gestalt laws (perception groups things whether you meant it or not)

- **Proximity**: things near each other read as related. The most abused law in interfaces: a control placed nearer the wrong section joins the wrong family, no matter what its label says. Spacing IS meaning.
- **Similarity**: things that look alike read as the same kind. Consistent styling is a promise; if two elements look the same, they must behave the same (half of every design system's job).
- **Common region**: a visible boundary groups whatever it encloses. Cards, panels, and wells are this law made of pixels; a border can overrule proximity.
- **Uniform connectedness**: a line or shared fill connecting elements beats both proximity and similarity. Connectors are the strongest grouping signal available.
- **Prägnanz (simplicity)**: ambiguous forms get read as the simplest possible interpretation, because that costs the least effort. Complex layouts don't get studied; they get simplified in the reader's head, possibly wrongly.
- **Figure-ground**: perception splits every scene into subject and background. Modals, scrims, and focus states are figure-ground engineering; a surface that fights to be the subject while another surface is active reads as noise.
- **Closure and continuity**: perception completes interrupted shapes and follows implied lines. Truncation with a visible continuation cue works because of this; content cut with no cue reads as complete and gets missed.

## Visual weight and balance (Arnheim)

Every element exerts perceptual force proportional to its size, darkness, saturation, isolation, and position (weight increases toward edges and the top). A composition reads as balanced when those forces resolve; imbalance is a signal, so use it on purpose or not at all. Practical test: squint until the words vanish. The heaviest blobs are your actual hierarchy; if they aren't the important things, the layout is lying about priorities.

Arnheim's larger point (Visual Thinking): perception IS cognition. People don't decode layouts after seeing them; the seeing is the understanding. That's why hierarchy problems can't be patched with copy.

## The basic grammar (Dondis, Wong, Leborg)

The elements: point, line, shape, direction, tone, color, texture, scale, dimension, motion (Dondis). The relations: position, direction, space, gravity; repetition, rhythm, gradation, radiation, contrast, anomaly (Wong; Leborg's object-and-structure framing matches). Two working rules fall out:

- **Contrast is the engine of hierarchy.** Big versus small, dark versus light, dense versus airy. One axis of strong contrast beats three axes of timid contrast; timid contrast reads as sloppiness rather than emphasis (Dondis calls low-contrast ambiguity the weakest visual statement).
- **Anomaly spends attention.** A single deviation in a repeated field is magnetic (the same fact Von Restorff measures). Budget: one anomaly per view does work; several cancel each other and read as errors.

## Composition rules that survive contact with interfaces

- Alignment is grouping at a distance: elements on a shared axis read as a set even when far apart. Ragged alignment breaks sets invisibly; a grid (see [typography and grids](typography-and-grids.md)) is alignment made systematic.
- Whitespace is an active element, not leftover room. It performs proximity, establishes figure-ground, and prices importance (generous space around an element raises its weight). Cramped equals cheap; the fix for a crowded panel is rarely smaller text and usually fewer things (Tesler's Law decides where the removed complexity goes).
- Optical beats mathematical. Centering, sizing, and spacing that measure equal often look wrong (circles and triangles need overshoot; heavy elements need extra clearance). Trust the eye over the ruler at the final pass; every classical typography source assumes optical correction.
- Reading gravity: in left-to-right locales, scanning starts top-left and falls diagonally; the bottom-right is where flows resolve (why primary actions sit there in dialogs) and the top-left is where identity lives. Layouts that fight reading gravity pay for it in scan time.
