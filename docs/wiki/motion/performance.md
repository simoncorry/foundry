# Motion performance

Sources: emilkowalski/skills performance rules (MIT) and MengTo/Skills optimize-web-animations (MIT), both credited in [the overview](overview.md). A lint can block the known-bad patterns; this page carries the reasoning and the parts a lint can't see.

## The property rule

Animate `transform` and `opacity` only, in anything that runs hot. They skip layout and paint and ride the GPU. Animating `width`, `height`, `top`, `left`, `padding`, or `margin` re-runs the full pipeline every frame. This is the single highest-leverage motion-performance rule and the root of half the others.

Related trap: percentages in `translate()` are relative to the element's own size, so `translateY(100%)` moves any element by exactly its own height. Prefer them over hardcoded pixels; they adapt to content.

## The CSS-variable-on-parent trap

Driving a child's transform by updating a CSS variable on the parent recalculates style for every child. In a container with many items that's an expensive per-frame bill. Set `transform` directly on the moving element:

```js
element.style.setProperty('--swipe-amount', `${d}px`); // recalc on all children
element.style.transform = `translateY(${d}px)`;        // this element only
```

## CSS beats JavaScript under load

CSS animations run off the main thread. Animation driven through `requestAnimationFrame` (the browser's per-frame callback) shares the main thread with loading, scripting, and painting, and drops frames exactly when the page is busiest. Kowalski's worked example: Vercel's dashboard tab animation dropped frames during page loads until it moved from a JavaScript layout animation to CSS. The division of labor: CSS for predetermined motion, JavaScript for dynamic and interruptible motion.

Library caveat that generalizes: a motion library's shorthand props can be main-thread animations while the full `transform` string is hardware-accelerated. Convenience APIs and fast APIs are often different APIs; check which one you're holding.

The Web Animations API is the middle path when you need JavaScript control with CSS performance, no library:

```js
element.animate(
  [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }],
  { duration: 1000, fill: 'forwards', easing: 'cubic-bezier(0.77, 0, 0.175, 1)' }
);
```

## Pause what nobody can see

Offscreen animations burn CPU for zero pixels. The MengTo pattern: an IntersectionObserver (the browser's tell-me-when-this-scrolls-into-view hook, threshold around 0.01) toggles a class, and a targeted rule pauses the animation:

```css
section.is-offscreen .expensive-animation {
  animation-play-state: paused !important;
}
```

Details that bite: pseudo-element shimmer (`::before`/`::after`) needs its own pause selectors; `animation-play-state` cannot pause a JavaScript render loop, so canvas and WebGL work gates its own frame callback (cancel offscreen, resume on re-entry); and physics loops cap their frame delta after a pause so the first resumed frame doesn't run one giant oversized step. The payoff is real and measurable: a paused CSS animation does zero per-frame work, identical to `animation: none`.

## Leak hardening (long sessions slow down for reasons motion code causes)

From the MengTo checklist, the cleanup rules for any component that animates: clear every timeout and interval the effect created; cancel the frame callback before unmount and before restarting a loop; disconnect every observer (Intersection, Resize, Mutation); remove window and document listeners with the same handler reference; dispose WebGL textures, materials, geometries, and renderers; stop media streams; and guard async loaders with a disposed flag so a resource that resolves after unmount gets released instead of retained. A page that "slows the computer down over time" is usually one of these, not the visible animation.

## Measure before and after

The verification posture both sources share: profile the real page before editing, and prove the fix with the same profile after (offscreen running count to zero, visible motion still resumes, counts stable across route cycles). Screenshots are not performance evidence; the browser's performance panel is.
