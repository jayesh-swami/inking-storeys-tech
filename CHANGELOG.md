# Changelog

All notable changes to this project are logged here, in the style of
[Keep a Changelog](https://keepachangelog.com/). Entries are grouped by
date rather than release version, since this project doesn't ship
versioned releases yet.

## Why this file exists

A share of the work on this codebase has been done with an AI
coding assistant. That's a great way to build quickly, but it 
leaves no trace in the usualplaces: there's no ticket, no design doc, 
and often no PR description,since changes land straight from conversation 
to commit. A year from now — for a human maintainer or another AI 
session — `git log` will show *what* changed line by line, but not 
*why* a particular approach was chosen over the alternatives, or 
what was tried and reverted.

This file is the fix: every meaningful change gets a short entry here
explaining what changed and why, written at the time the decision was
made. Routine edits (typo fixes, copy tweaks) don't need an entry —
this is for anything a future reader would otherwise have to
reverse-engineer from the diff.

**Convention for new entries:**
- Add a new `## YYYY-MM-DD` section for each day work happens (or append
  to today's if one already exists).
- Group changes under `### Added`, `### Changed`, `### Fixed`,
  `### Removed`, or `### Performance` as they apply.
- State the *reason*, not just the change — "removed GSAP" is a diff;
  "removed GSAP because it was 90% of shipped JS for one fade effect"
  is a changelog entry.
- If a change reverses or significantly reworks an earlier entry,
  say so explicitly rather than leaving the old entry looking current.

See also [`AGENTS.md`](./AGENTS.md) for repo-specific instructions
aimed at AI coding assistants working in this repo.

---

## 2026-08-01

### Added

- Initial Astro 7 + Tailwind CSS v4 project scaffold, with the
  "Terracotta Minimalism" design system (Cormorant Garamond / Montserrat
  / DM Sans, terracotta/charcoal/alabaster palette) wired up as Tailwind
  `@theme` tokens in `src/styles/global.css`.
- Content Layer collections (`src/content.config.ts`) for `projects`,
  `testimonials`, and `faqs`, with sample entries using placeholder
  Unsplash photography (see `src/content/`).
- Global layout: full-screen preloader, fixed nav with a full-screen
  curtain menu, footer — plus GSAP + ScrollTrigger + Lenis for smooth
  scroll, scroll-linked reveals, and parallax (later removed — see
  below).
- Homepage sections: Hero carousel, Featured Projects grid, About,
  Design Process accordion, Testimonials slider, FAQ accordion.
- Switched all content imagery to Astro's `astro:assets` `<Image>` /
  `getImage()` pipeline (remote Unsplash sources, resized + re-encoded
  to WebP at build time) after diagnosing that unoptimized multi-MB
  source images — not the animation code — were the real cause of
  reported scroll jank.
- Extended the site's parallax "window" effect (images drifting at a
  different rate than the page scroll) from the Hero/About images to
  the Featured Projects grid, and increased its intensity
  (`PARALLAX_MAX_OFFSET` 80px → 110px, per-image speed multipliers
  raised).

### Changed

- **Navbar**, several iterations, converging on: a single wordmark/menu
  button that morphs to a hamburger icon on hover below the `lg`
  breakpoint; full inline nav links shown directly (no hamburger) at
  `lg`+ viewport widths, matching the reference site big.dk; an
  always-on blurred background (initially scroll-triggered, later
  changed to always visible per feedback); reduced vertical padding.
- **Scroll & motion**, simplified from a GSAP ScrollTrigger-heavy setup
  to a small set of restrained effects after feedback that the
  original animation set felt busy: dropped per-item staggered
  reveal animations on grids/accordions, kept a single quick fade-up
  on section headers.
- **Mouse-wheel feel**: Lenis was originally configured with
  `duration`-based (fixed-curve) easing, which restarts its animation
  on every discrete wheel notch and reads as "clunky" on a mouse
  (vs. trackpad/touch, which bypass Lenis smoothing entirely). Fixed
  by switching to `lerp`-based (continuous exponential) smoothing.

### Performance

- **Removed GSAP + ScrollTrigger entirely.** After the animation
  simplification above, GSAP was doing almost nothing (drive Lenis'
  `raf` loop, run one fade-in effect) but still accounted for ~131KB
  gzipped — about 90% of the site's total shipped JS. Replaced with
  native `requestAnimationFrame` (for the scroll driver) and
  `IntersectionObserver` (for reveals). Total JS dropped from ~148KB
  raw / 55KB gzip to ~35KB raw / 10.6KB gzip.
- **Removed Lenis entirely.** Replaced with a ~1.2KB hand-rolled
  exponential-decay wheel-scroll smoother (`src/scripts/motion.ts`) —
  mouse/trackpad only via native `wheel` events, touch scrolling left
  completely untouched. The site now ships with zero third-party
  scroll/animation runtime dependencies; nearly all custom JS is small
  enough to be inlined directly into the HTML by Astro's bundler.
- **Preloader rebuilt without GSAP**, using CSS `@keyframes` animations
  instead of a JS animation timeline, with a `setTimeout` safety net.
  This also fixed a real reliability gap: the old version had no
  fallback if the GSAP import ever failed, which would have left the
  site permanently stuck behind an opaque splash screen.
- **Hero carousel now defers loading slide 2/3 images** (`getImage()` +
  a `data-src` attribute, promoted to `src` by `carousel.ts` one slide
  ahead of the active one) instead of eagerly loading all three on
  every visit regardless of whether the visitor ever scrolls that far.

### Fixed

- Menu-open icon color: the hamburger/close icon and the dark curtain
  overlay were briefly the same color, making the close icon invisible
  while the menu was open.
- A grid-collapse bug introduced while wiring parallax into the
  Featured Projects cards: moving the `<img>` into an absolutely
  positioned parallax frame took it out of normal flow, and it turned
  out the grid's row height was accidentally depending on that
  in-flow `<img>`'s `width`/`height` attributes as a fallback for an
  otherwise-indefinite `height: 100%`. Fixed by giving the grid an
  explicit `md:auto-rows-[300px]` instead of relying on that fallback.

### Removed

- Dead code: an unused `--animate-fade-up` theme animation in
  `global.css` that nothing referenced.
- Duplicated markup: hand-copied social icon links (Nav curtain menu
  vs. Footer, which had drifted — Nav was missing the Facebook icon
  Footer had) consolidated into `SocialLinks.astro`; duplicated
  "eyebrow + heading" section-title markup (Featured Projects, Process,
  FAQ) consolidated into `SectionHeading.astro`.

### Fixed (production-readiness audit)

- **Mobile curtain menu had no focus management.** Opening it didn't
  move keyboard focus inside, Tab could escape into the (visually
  hidden, off-screen) page behind it, and closing it didn't return
  focus to the button that opened it — none of which match the
  standard WAI-ARIA dialog pattern for a full-screen overlay menu.
  Fixed in `Nav.astro`: added `role="dialog"`/`aria-modal`, an `inert`
  toggle so closed-state links aren't in the tab order at all, a Tab/
  Shift+Tab focus trap while open, Escape-to-close, and focus restored
  to the toggle button on close. Also fixed a latent bug this touched:
  the `document`-level `keydown`/`astro:before-swap` listeners were
  being re-registered (never removed) on every client-side navigation,
  stacking duplicates — moved them to register once at module scope
  instead of inside the per-navigation `setupMenu()`.
- **No SEO/social metadata anywhere.** `Layout.astro` only ever set
  `<title>`/`<meta description>`. Added canonical URL, OpenGraph, and
  Twitter Card tags (via a new optional `image` prop, left unset by
  pages that don't have a dedicated share image rather than pointing
  at a placeholder), plus `@astrojs/sitemap` and `public/robots.txt`.
  Needs `astro.config.mjs`'s `site` field (currently a placeholder)
  set to the real domain before launch — see the README's Deployment
  section.
- **`README.md` was a single line.** Replaced with real setup
  instructions, project structure, content-editing notes, and a
  deployment checklist.
