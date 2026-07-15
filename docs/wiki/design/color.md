# Color (the judgment half)

Deliberately thin: this page carries design judgment about color relationships, not color-space math. For the math (perceptually uniform spaces like OKLab and OKLCH, and why hue rotation in the wrong space drifts), start from Björn Ottosson's published work at https://bottosson.github.io/posts/oklab/. Sources here: Josef Albers (Interaction of Color), Sean Adams (The Designer's Dictionary of Color).

## Albers' one big lesson

Color is the most relative element in design: the same value reads differently against every neighbor. Interaction of Color is a book of exercises proving that a color is never experienced alone, so color decisions can only be judged in context, never in a palette swatch. Practical consequences:

- Evaluate color in the real layout, at real sizes, against real neighbors. A value that looks right in the palette file can fail on the surface it lands on.
- Small areas need more saturation and contrast than large areas to read as the same intensity; a hue that's calm as a background is invisible as a 2px border.
- Adjacent colors push each other (simultaneous contrast): a gray on green reads warm, the same gray on orange reads cool. When a neutral looks tinted, its neighbor did it.

## Functional color roles

Color in working interfaces is a system of jobs before it is a mood:

- **Semantic roles stay reserved.** Danger-red, success-green, warning-yellow, link-and-action accents: once assigned, those meanings can't moonlight as decoration, or the decoration reads as state. A red decorative flourish next to a destructive button is a false alarm.
- **Hierarchy by restraint.** One accent doing real work beats five sharing it (the Von Restorff logic again). Most of a working surface should be quiet neutrals, so the accent has something to be louder than.
- **Redundancy for accessibility.** Color never carries meaning alone; pair it with a shape, icon, weight, or label, both for color-blind users and for every muted-screen situation. Contrast for text follows the published thresholds (the WCAG ratios); check them against the actual rendered pair, not the token names.
- **Meaning is cultural and contextual** (Adams): color associations shift across cultures and domains, so name the intended meaning in the system rather than assuming the hue carries it universally.
