# Motion fundamentals

How interface motion should feel, when it should exist, and what it costs. Without this shelf, agents pick ease-in for entrances, animate keyboard actions, and start popovers from nothing; all three read as broken to a trained eye, and none of them trip a lint.

## Attribution

The taste rules and concrete values here are extracted and adapted from [emilkowalski/skills](https://github.com/emilkowalski/skills) (MIT, copyright Emil Kowalski), the skills companion to his animations.dev course, distilled from his years building UI at Vercel and Linear and shipping Sonner and Vaul. The Apple material he distilled comes from Apple's WWDC design talks (chiefly Designing Fluid Interfaces, 2018). The offscreen-pause and leak-hardening patterns adapt [MengTo/Skills](https://github.com/MengTo/Skills) optimize-web-animations (MIT, copyright Meng To). Values are quoted faithfully; adaptation is in selection and arrangement for general interface work.

## The decision framework (run it in this order)

1. **Should this animate at all?** Frequency decides. Something seen 100+ times a day (keyboard shortcuts, command palette): never animate. Tens of times a day (hover, list navigation): remove or drastically reduce. Occasional (modals, drawers, toasts): standard animation. Rare or first-time (onboarding, celebration): delight is allowed. Never animate keyboard-initiated actions; repetition turns any animation into lag.
2. **What is it for?** Valid purposes: spatial consistency, state indication, explanation, feedback, preventing a jarring change. "It looks cool" on a frequently-seen element is not a purpose.
3. **What easing?** Entering or exiting: ease-out. Moving or morphing on screen: ease-in-out. Hover or color: ease. Constant motion (marquee, spinner): linear. Default: ease-out. Never ease-in on UI; it delays movement at the exact moment the user is watching. Built-in CSS curves are weak; use strong custom ones ([easing and timing](easing-and-timing.md)).
4. **How fast?** Press feedback 100-160ms. Tooltips 125-200ms. Dropdowns 150-250ms. Modals and drawers 200-500ms. UI stays under 300ms; a 180ms dropdown feels more responsive than a 400ms one, and perceived speed counts as much as real speed.

## The ten rules that catch most bad motion

1. Never start an entrance from `scale(0)`; use `scale(0.9-0.97)` plus `opacity: 0`. Nothing real appears from nothing.
2. Popovers scale from their trigger (`transform-origin` at the trigger), not from center. Modals are the exemption; they stay centered.
3. Pressable things press: `scale(0.97)` on `:active`, transform transition around 160ms ease-out.
4. Never `transition: all`; name the properties.
5. Animate only `transform` and `opacity` in anything hot; width, height, top, left, padding, and margin force layout every frame.
6. Rapidly re-triggered UI uses transitions, not keyframes: transitions retarget mid-flight, keyframes restart from zero.
7. Exit faster than enter. Slow where the user decides, fast where the system responds.
8. Stagger group entrances 30-80ms apart, and never block input while decoration plays.
9. Reduced motion means gentler, not zero: keep opacity and color changes that aid comprehension, drop movement. Gate hover motion behind `@media (hover: hover) and (pointer: fine)`.
10. Anything gesture-driven must be interruptible from its current on-screen value, carrying the user's velocity ([interaction feel](interaction-feel.md)).

## The pages

- [Easing and timing](easing-and-timing.md): the easing decision order, strong curves with exact values, the duration table, springs in Apple's vocabulary, asymmetric timing, stagger, cohesion.
- [Interaction feel](interaction-feel.md): interruptibility, velocity handoff, momentum projection with Apple's exact function, rubber-banding, drag hygiene, origin awareness, entrances without JavaScript.
- [Performance](performance.md): the property rule, the variable-on-parent trap, CSS versus JavaScript under load, pausing offscreen work, leak hardening.
- [Vocabulary](vocabulary.md): the reverse lookup from a vague description to the precise term.

## Boundaries and facts worth carrying

- **Interface chrome, not domain pacing.** The under-300ms rule and the interruptibility rule govern chrome (menus, toasts, panels). Deliberate pacing inside a product's own domain (a countdown, a hold-to-confirm, a game's cast time) is a design value these rules never argue against; judge those against the product's goals.
- **Only an animation NAME change restarts a CSS animation** (per the CSS spec). Re-applying the same name silently does nothing, which bites any element pool that reuses nodes; route restarts through a name swap or the Web Animations API.
- **Browser quirk worth knowing:** some WebKit versions drop `var()` inside the inline `animation` shorthand; prefer literal values in inline animation shorthands.
- **A paused CSS animation does zero per-frame work**, measured empirically (identical layout cost to `animation: none`), so pausing offscreen animations is a real win, not a superstition.
- **Convenience APIs and fast APIs are often different APIs** (Kowalski, from a dashboard tab-animation incident at Vercel): a library's shorthand props can run on the main thread while the full property string rides the GPU. Check which one you're holding.
