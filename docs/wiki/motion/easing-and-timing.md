# Easing, duration, springs

Source: extracted from emilkowalski/skills (MIT), chiefly the review-animations STANDARDS catalog and the design-engineering skill; Apple spring vocabulary from his apple-design skill, itself distilled from Apple's WWDC talks. Values quoted faithfully.

## Easing decision order

- Entering or exiting the screen: **ease-out**. Starts fast, so the user sees movement the instant they act.
- Moving or morphing while already on screen: **ease-in-out**.
- Hover or color change: **ease**.
- Constant motion (marquee, progress, spinner): **linear**.
- Unsure: **ease-out**.

Never `ease-in` on UI. It back-loads the movement, so the interface feels sluggish at the exact moment the user is watching hardest. Kowalski's framing: ease-out at 200ms feels faster than ease-in at 200ms; same duration, different perception.

## Strong curves (built-ins are too weak)

The browser's named easings lack punch. Strong custom curves, from the STANDARDS catalog:

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);        /* strong ease-out for UI */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);    /* strong ease-in-out for on-screen movement */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);     /* iOS-like drawer curve, via Ionic */
```

Don't hand-roll curves from scratch; easing.dev and easings.co carry stronger variants of every standard shape.

## Duration table

| Element | Duration |
| --- | --- |
| Button press feedback | 100-160ms |
| Tooltips, small popovers | 125-200ms |
| Dropdowns, selects | 150-250ms |
| Modals, drawers | 200-500ms |
| Marketing, explanatory | Can run longer |

UI animation stays under 300ms. Speed is also perception engineering: a faster-spinning spinner makes the same load feel shorter, and tooltips that open instantly after the first one (skip the delay, skip the animation) make a whole toolbar feel quicker.

## Asymmetric timing

Slow where the user is deciding, fast where the system responds. The hold-to-delete pattern is the canonical example: the press fills over 2 seconds linear (deliberate), the release snaps back in 200ms ease-out. More generally, exits should usually run faster than entrances.

## Springs

Springs settle on physics instead of a fixed clock, which buys two things: natural feel, and velocity that survives interruption (a keyframe restarts from zero; a spring carries the element's current speed into the new target). Use them for drag with momentum, elements that should feel alive, gestures the user may reverse mid-flight, and decorative mouse-tracking. Skip them for a functional data display; decoration on information the user needs to read quickly hurts more than it helps.

Two vocabularies:

```js
// Apple-style, easier to reason about (recommended)
{ type: "spring", duration: 0.5, bounce: 0.2 }

// Traditional physics, more control
{ type: "spring", mass: 1, stiffness: 100, damping: 10 }
```

Apple's designer-facing pair, from Designing Fluid Interfaces: **damping ratio** (1.0 settles with no overshoot; below 1.0 bounces, lower is bouncier) and **response** (how quickly the value heads for the target; not a duration, since a spring has none). Their shipped values:

| Interaction | Damping | Response |
| --- | --- | --- |
| Move or reposition | 1.0 | 0.4 |
| Rotation | 0.8 | 0.4 |
| Drawer or sheet | 0.8 | 0.3 |

A sound default: critically damped (damping 1.0, bounce 0) everywhere, adding bounce (around 0.8 damping, bounce 0.1-0.3) only when the gesture itself carried momentum. Overshoot on a menu that faded in feels wrong; overshoot on a card you flicked feels right.

## Stagger

Group entrances land 30-80ms apart; longer reads as slow. Stagger is decoration, so input is never blocked while it plays.

## Cohesion

Match motion to the component's personality. A playful surface can bounce; a working dashboard should be crisp and fast. Kowalski's toast library deliberately runs slightly slower than typical UI and uses `ease` instead of `ease-out` to feel elegant; the values were chosen to match the design and even the name. Motion values are a voice, not just physics.
