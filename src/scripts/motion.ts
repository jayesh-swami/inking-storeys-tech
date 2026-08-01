/**
 * Global scroll behavior for the site: smooth mouse-wheel scrolling,
 * a scroll-linked parallax effect for tagged images, and a one-time
 * fade-up reveal for tagged sections.
 *
 * Deliberately dependency-free. This project originally used GSAP +
 * ScrollTrigger + Lenis for all of this; both were removed after
 * measuring that they accounted for ~90% of the site's shipped JS
 * while doing work that native `requestAnimationFrame` and
 * `IntersectionObserver` do just as well for our needs. See
 * CHANGELOG.md for the full reasoning if you're wondering whether to
 * reach for a library here — the answer, so far, has been no.
 *
 * All three features (smooth scroll, parallax, reveals) are
 * independent and re-initialized together on every Astro page
 * navigation via the `astro:page-load` / `astro:before-swap`
 * lifecycle (Astro's View Transitions router swaps the DOM without a
 * full reload, so anything holding element references or listeners
 * has to be torn down and rebuilt per navigation).
 */

// ---------------------------------------------------------------------------
// Smooth mouse-wheel scrolling
//
// This intentionally only touches `wheel` events, i.e. a physical mouse
// wheel or a laptop trackpad. Touchscreen scrolling never fires `wheel`
// events in browsers, so it's untouched and stays perfectly native — which
// is what we want, since smoothing native touch scrolling tends to make it
// feel laggy rather than better.
//
// The technique: every `wheel` event nudges a `targetY` value (where we
// "want" to be scrolled to). A requestAnimationFrame loop chases `targetY`
// with `currentY` using exponential decay (lerp): each frame, `currentY`
// closes 10% of the remaining distance to `targetY`. This is the same
// technique libraries like Lenis use under the hood, and it's what gives
// the "weighted", decelerating feel to the scroll instead of stepping
// instantly to each wheel notch's target.
//
// Why lerp instead of a fixed-duration animation (e.g. "ease to the new
// target over 400ms")? A fixed-duration tween restarts its curve on every
// wheel event, which on a notched mouse wheel (as opposed to a smooth
// trackpad swipe) produces a visible stutter as each notch re-triggers the
// animation from scratch. Lerp has no fixed duration to restart — it just
// keeps chasing whatever the current target is, so rapid, discrete wheel
// notches blend into one continuous motion instead of a slideshow of
// mini-animations. This was a deliberate fix after user feedback that wheel
// scrolling felt "clunky" compared to touch under the old duration-based
// approach.
// ---------------------------------------------------------------------------

/** Fraction of the remaining distance closed per animation frame (0-1). Lower = heavier/slower catch-up, higher = snappier. */
const LERP = 0.1;

/** Approximate pixel height of one "line" for wheel events reported in line units (see normalizeDelta). */
const LINE_HEIGHT = 16;

/** Once current and target are within this many pixels, snap to target and stop animating rather than chasing forever. */
const STOP_THRESHOLD = 0.5;

/** Where we're smoothly scrolling toward. */
let targetY = 0;
/** Where we currently are (the smoothed position we actually apply via scrollTo). */
let currentY = 0;
let rafId: number | undefined;
/** Whether the chase loop is currently running, so we don't start a second one. */
let animating = false;

function maxScroll() {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

/**
 * Wheel events report `deltaY` in different units depending on the input
 * device and browser (`event.deltaMode`), and treating them all as raw
 * pixels makes line-based devices (some mice/Firefox) scroll far too
 * little. This normalizes everything to an equivalent pixel delta.
 */
function normalizeDelta(event: WheelEvent) {
  switch (event.deltaMode) {
    case 1: // DOM_DELTA_LINE - e.g. some mice/Firefox report whole "lines" scrolled
      return event.deltaY * LINE_HEIGHT;
    case 2: // DOM_DELTA_PAGE - rare, but spec-legal (e.g. Page Down semantics)
      return event.deltaY * window.innerHeight;
    default: // DOM_DELTA_PIXEL - the common case (Chrome, trackpads)
      return event.deltaY;
  }
}

/**
 * The rAF loop that chases `targetY` with `currentY`. Self-terminates once
 * it converges (see STOP_THRESHOLD) instead of running an idle loop
 * forever — a new wheel event in `onWheel` restarts it. This is actually
 * more efficient than most smooth-scroll libraries' default behavior,
 * which typically keep a rAF loop running continuously regardless of
 * whether anything is animating.
 */
function tick() {
  const diff = targetY - currentY;
  if (Math.abs(diff) < STOP_THRESHOLD) {
    currentY = targetY;
    window.scrollTo(0, currentY);
    animating = false;
    return;
  }
  currentY += diff * LERP;
  window.scrollTo(0, currentY);
  rafId = requestAnimationFrame(tick);
}

function onWheel(event: WheelEvent) {
  // Let pinch-zoom (ctrl+wheel) and scrollable widgets opt out of the
  // smoothing and fall through to native, unsmoothed behaviour.
  if (event.ctrlKey) return;
  if ((event.target as HTMLElement)?.closest("[data-native-scroll]")) return;

  event.preventDefault();

  if (!animating) {
    // The chase loop isn't running, which means the page may have moved
    // some other way since the last tick (keyboard scrolling, dragging
    // the scrollbar, clicking an anchor link, etc). Resync both values to
    // the real scroll position before applying this event's delta, or
    // we'd animate from a stale `targetY` and the page would jump.
    currentY = window.scrollY;
    targetY = window.scrollY;
  }

  targetY = Math.min(maxScroll(), Math.max(0, targetY + normalizeDelta(event)));

  if (!animating) {
    animating = true;
    rafId = requestAnimationFrame(tick);
  }
}

function initSmoothScroll() {
  // Respect the OS setting instead of forcing motion on people who asked
  // not to have it; native wheel scrolling is a fine fallback either way.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  targetY = window.scrollY;
  currentY = window.scrollY;
  window.addEventListener("wheel", onWheel, { passive: false });
}

function destroySmoothScroll() {
  window.removeEventListener("wheel", onWheel);
  if (rafId !== undefined) cancelAnimationFrame(rafId);
  animating = false;
}

// ---------------------------------------------------------------------------
// Parallax "window" effect
//
// Applies to any element with a `data-parallax-speed="<0-1>"` attribute
// (see Hero.astro, About.astro, FeaturedProjects.astro). The element drifts
// vertically as it passes through the viewport, at a rate proportional to
// `speed`, giving the illusion of looking at the image through a window
// rather than the image being flush with the page.
//
// Markup contract this depends on: the parallax element's *direct parent*
// must be an `overflow-hidden` "frame" sized larger than the visible
// window (the sites use a `-m-32 overflow-hidden` wrapper) — otherwise
// translating the image would expose empty space at its edges as it
// drifts. The frame's own bounding box (not the image's) is what we
// measure against the viewport, so the frame effectively defines the
// "window" the image is being viewed through.
//
// Performance-wise, only elements currently intersecting the viewport
// (plus a rootMargin buffer) are tracked in `activeParallax` and get their
// transform recalculated — elements far off-screen do no work at all. All
// active elements are recalculated together in a single scroll-driven,
// rAF-batched pass rather than one listener per element.
// ---------------------------------------------------------------------------

let parallaxObserver: IntersectionObserver | undefined;
/** Elements currently intersecting the viewport (± rootMargin) - only these get their transform recalculated each frame. */
const activeParallax = new Set<HTMLElement>();
let parallaxScheduled = false;

// Capped in pixels (not proportional to element size) so a single fixed
// wrapper buffer (see the `-m-32` parallax frames) is always enough to
// cover the translation, regardless of how tall the image is. A large
// hero image and a small grid thumbnail both max out at this same pixel
// offset; only `speed` (per-element) changes how quickly they get there.
const PARALLAX_MAX_OFFSET = 110;

/**
 * Recomputes and applies the parallax transform for every currently
 * visible parallax element. Called at most once per animation frame (see
 * scheduleParallaxUpdate) no matter how many scroll/resize events fire in
 * between.
 */
function updateParallax() {
  parallaxScheduled = false;
  const viewportCenter = window.innerHeight / 2;

  activeParallax.forEach((el) => {
    const frame = el.parentElement;
    if (!frame) return;

    const speed = parseFloat(el.dataset.parallaxSpeed ?? "0.5");
    const rect = frame.getBoundingClientRect();
    const frameCenter = rect.top + rect.height / 2;

    // -1 when the frame's center is a full viewport-height below center,
    // +1 when it's a full viewport-height above, 0 when perfectly
    // centered. Clamped so elements much taller than the viewport (e.g.
    // the full-screen hero) don't produce runaway offsets while they're
    // still mostly on screen.
    const progress = Math.max(-1, Math.min(1, (viewportCenter - frameCenter) / viewportCenter));
    const offset = progress * PARALLAX_MAX_OFFSET * speed;

    el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
  });
}

/** Coalesces any number of scroll/resize/observer callbacks within a frame into a single updateParallax() call. */
function scheduleParallaxUpdate() {
  if (parallaxScheduled) return;
  parallaxScheduled = true;
  requestAnimationFrame(updateParallax);
}

function initParallax() {
  parallaxObserver?.disconnect();
  activeParallax.clear();

  // Respect the OS setting: leave parallax images static instead of
  // forcing motion on people who asked not to have it.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  parallaxObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          activeParallax.add(el);
        } else {
          // Reset the transform when an element leaves the tracked range so
          // it doesn't stay visually offset if it re-enters some other way
          // (e.g. a resize) before we recompute it.
          activeParallax.delete(el);
          el.style.transform = "";
        }
      }
      scheduleParallaxUpdate();
    },
    // Start tracking slightly before an element enters the viewport and
    // keep tracking slightly after it leaves, so its parallax offset is
    // already correct on the frame it becomes visible rather than
    // popping in with a stale transform.
    { rootMargin: "20% 0px 20% 0px" },
  );

  document.querySelectorAll<HTMLElement>("[data-parallax-speed]").forEach((el) => {
    parallaxObserver?.observe(el);
  });

  window.addEventListener("scroll", scheduleParallaxUpdate, { passive: true });
  window.addEventListener("resize", scheduleParallaxUpdate);
}

function destroyParallax() {
  parallaxObserver?.disconnect();
  activeParallax.clear();
  window.removeEventListener("scroll", scheduleParallaxUpdate);
  window.removeEventListener("resize", scheduleParallaxUpdate);
}

// ---------------------------------------------------------------------------
// Scroll-triggered reveal
//
// Any element with a `data-reveal` attribute fades/slides in the first time
// it scrolls into view (styling lives in global.css: `[data-reveal]` /
// `.is-revealed`). This is a one-shot effect — once an element has
// revealed, we stop observing it, so scrolling back up and down again
// doesn't re-trigger it.
// ---------------------------------------------------------------------------

let revealObserver: IntersectionObserver | undefined;

function initReveals() {
  revealObserver?.disconnect();
  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-revealed");
        // One-shot: once revealed, stop watching this element entirely.
        revealObserver?.unobserve(entry.target);
      }
    },
    // Trigger a little before the element's top fully clears the bottom
    // of the viewport, so the reveal feels anticipatory rather than late.
    { threshold: 0, rootMargin: "0px 0px -15% 0px" },
  );

  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
    revealObserver?.observe(el);
  });
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

function setup() {
  destroySmoothScroll();
  initSmoothScroll();
  initReveals();
  initParallax();
}

document.addEventListener("astro:page-load", setup);
document.addEventListener("astro:before-swap", () => {
  destroySmoothScroll();
  destroyParallax();
});
