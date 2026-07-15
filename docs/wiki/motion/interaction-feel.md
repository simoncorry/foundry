# Interaction feel

Sources: emilkowalski/skills (MIT): the apple-design skill (distilled from Apple's WWDC talks, chiefly Designing Fluid Interfaces, 2018), the design-engineering skill's component principles, and the STANDARDS catalog's gesture rules. Attribution in [the overview](overview.md).

## The through-line

Apple's one-sentence theory of fluid interfaces: motion starts from the current on-screen value, inherits the user's velocity, projects momentum forward, and can be grabbed and reversed at any instant. Everything below is a working part of that sentence.

## Response: kill latency

Feedback fires on pointer-down, never on release; waiting for the click event reads as dead. During a drag, the UI tracks the pointer 1:1 the whole way, not just an animation at the end. Audit anything sitting on the input path (debounces, artificial delays, transition waits); each one is a regression in directness.

Press feedback is the cheapest correct motion in the catalog: `transform: scale(0.97)` on `:active`, transition around 160ms ease-out, subtle range 0.95-0.98, and `scale()` scaling the label and icon with it is the point, not a bug.

## Interruptibility (the single most important principle)

Every animation a user can touch must be grabbable and reversible mid-flight. A closing drawer the user grabs follows the finger; it never finishes closing first. The mechanics:

- Animate from the presentation value (what's on screen right now), never from the logical target; starting from the target causes a visible jump.
- CSS transitions retarget mid-flight; keyframes restart from zero. Rapidly re-triggered UI (toasts stacking, toggles) uses transitions.
- Springs interrupt best of all because they carry velocity through a retarget; keyframes hard-cut it, which reads as hitting a brick wall.
- Decompose 2D motion into independent X and Y springs; one spring on the diagonal desyncs when the two axes carry different velocities.

## Velocity handoff and momentum projection

When a gesture ends, the animation continues at the finger's exact speed, or there's a visible seam between dragging and animating. Hand the release velocity to the spring as its initial velocity.

Don't snap to the nearest boundary from the release point; project where the gesture was going and snap to the target nearest that. Apple's projection function, from the Designing Fluid Interfaces sample code (exponential decay, not the physics-textbook form):

```js
// decelerationRate 0.998 for normal scroll feel; 0.99 for snappier
function project(initialVelocity /* px per second */, decelerationRate = 0.998) {
  return (initialVelocity / 1000) * decelerationRate / (1 - decelerationRate);
}
const target = nearestSnapPoint(currentPosition + project(releaseVelocity));
```

Momentum dismissal follows the same idea: don't demand the user cross a distance threshold; compute velocity as distance over elapsed time and dismiss on a flick (threshold around 0.11 in Kowalski's toast library).

## Boundaries: rubber-band, never hard-stop

Dragging past a natural edge moves less the further you go; real things slow before they stop, and a hard stop reads as frozen. A working resistance curve:

```js
function rubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
```

Drag hygiene that separates fine from fluid: capture the pointer once dragging starts so tracking survives leaving the element's bounds; respect the grab offset (snapping the element's center to the finger breaks the illusion); ignore extra touch points after a drag begins; require about 10px of movement before committing to a direction.

## Origin awareness and spatial consistency

Things emerge from what caused them. Popovers, menus, and tooltips scale from their trigger (`transform-origin` at the trigger), never from center; modals are the one exemption because nothing anchors them. Enter and exit run along the same path: a panel that slides in from the right leaves to the right. And hint in the direction of travel: the in-between frames should telegraph where the motion is going, not blindly interpolate.

## Entrances without JavaScript

`@starting-style` animates entry in pure CSS:

```css
.toast {
  opacity: 1; transform: translateY(0);
  transition: opacity 400ms ease, transform 400ms ease;
  @starting-style { opacity: 0; transform: translateY(100%); }
}
```

The legacy fallback is the mounted-flag pattern (set a data attribute after first render). Never enter from `scale(0)`; start at `scale(0.9-0.97)` with opacity 0.

## Two polish tools

- **Blur masking:** when a crossfade shows two overlapping states no matter how the timing is tuned, a subtle `filter: blur(2px)` during the transition blends them into one perceived transformation. Keep blur well under 20px; heavy blur is expensive, especially in Safari.
- **Clip-path:** `inset(top right bottom left)` eats into the element from each side, hardware-accelerated. It powers reveals, hold-to-confirm overlays, comparison sliders, and the duplicated-and-clipped tab list whose active-color transition no per-property timing can match.

## Multimodal feedback

When motion pairs with sound or vibration (Apple's audio-haptics rules): the cause must be obvious, the senses must land on the same frame (latency between them destroys the effect), and feedback is reserved for moments that earn it. Over-feedback trains people to ignore all of it.
