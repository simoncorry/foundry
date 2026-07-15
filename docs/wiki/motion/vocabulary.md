# Motion vocabulary (reverse lookup)

Condensed from emilkowalski/skills animation-vocabulary (MIT). Purpose: turn a vague description ("the bouncy thing when a popover opens") into the precise term, so requests and reviews use the same words. When two terms compete, name the best match and contrast the close alternate.

## Entrances and exits

- **Fade / Slide / Scale in**: appear via opacity, off-screen movement, or growth from smaller size (usually paired with fade).
- **Pop in**: appears with slight overshoot, bounces into place.
- **Reveal**: uncovered gradually, usually an animated clip-path or mask.

## Sequencing and timing

- **Keyframes**: fixed points the browser interpolates between. **Tween / interpolation**: the generated in-between frames.
- **Stagger**: items animate one after another with a small delay, a cascade.
- **Orchestration**: multiple animations timed to read as one motion.
- **Fill mode**: whether the element keeps the first or last frame's styles outside the animation window.
- **Stepped animation**: discrete jumps, like a countdown.

## Movement and transforms

- **Translate / scale / rotate / skew**: move, resize, spin, slant.
- **Transform origin**: the anchor a scale or rotation grows from.
- **Origin-aware animation**: an element animates out of its trigger, like a popover growing from the button that opened it.
- **3D tilt / flip, perspective**: rotation in depth, and how exaggerated the depth reads.

## Transitions between states

- **Crossfade**: one fades out while the other fades in, in place.
- **Morph**: one shape smoothly becomes another (the Dynamic Island move).
- **Shared element transition**: an element travels and transforms from one position into another, thumbnail-to-card.
- **Layout animation**: size or position changes animate instead of snapping.
- **Direction-aware transition**: forward slides one way, back slides the other, so navigation has a sense of direction.
- **Accordion / collapse**: height expands and collapses smoothly.

## Scroll

- **Scroll reveal**: elements enter as they reach the viewport. **Scroll-driven**: progress tied directly to scroll position.
- **Parallax**: layers moving at different speeds for depth.
- **View transition**: the browser morphs between two states or pages, connecting shared elements.

## Feedback and interaction

- **Press feedback**: subtle scale-down on press. **Ripple**: circle expanding from the tap point.
- **Hold to confirm**: progress fills while held.
- **Drag to reorder / swipe to dismiss**: items shift to make room; drag off-screen to close.
- **Rubber-banding**: resistance and snap-back past a boundary (the iOS overscroll feel).
- **Shake / wiggle**: quick jitter signaling rejection.

## Easing and springs

- **Ease-out / ease-in / ease-in-out / linear**: fast-then-slow, slow-then-fast (avoid on UI), slow-fast-slow, constant.
- **Asymmetric easing**: accelerates and decelerates at different rates, feels more alive.
- **Spring, stiffness, damping, mass, bounce**: physics-driven motion and its dials.
- **Perceptual duration**: when a spring feels finished, though it keeps micro-settling.
- **Interruptible animation**: can be redirected mid-flight instead of finishing first.
- **Velocity / momentum**: speed and direction carried into the next animation.

## Ambient motion

- **Marquee / loop / alternate (yoyo)**: continuous scroll; repeats; plays forward then reverses.
- **Pulse / float / idle animation**: gentle repeating attention cue; weightless drift; subtle motion while waiting.

## Polish

- **Skeleton / shimmer**: loading placeholder with a moving sheen.
- **Number ticker** and **tabular numbers**: rolling digits, and the fixed-width digits that stop them jittering.
- **Line drawing**: an SVG path tracing itself in.
- **Text morph / typewriter**: per-character change animation; typed-out text.
- **Blur, clip-path, mask**: soften or hide-and-reveal; mask is clip-path with soft edges.

## Performance words

- **Jank / dropped frame**: visible stutter; a missed frame deadline.
- **Compositing**: the GPU moving or fading a layer without layout or paint.
- **will-change**: a hint to promote an element to its own layer before it animates.
- **Layout thrashing**: animating layout properties so the browser recalculates every frame.

## Principles worth naming in reviews

- **Purposeful animation**: motion serves orientation, feedback, or relationships, not decoration.
- **Anticipation / follow-through / squash and stretch**: the classic animation trio for weight and life.
- **Perceived performance**: the right motion makes an interface feel faster at identical speed.
- **Frequency of use**: the more often a user sees it, the shorter and subtler it should be.
- **Spatial consistency**: elements keep identity and position across states, so nobody loses track of where things went.
- **Reduced motion**: honoring the user's setting with gentler, non-vestibular equivalents.
