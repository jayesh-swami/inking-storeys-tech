# Changelog

Notable changes, in [Keep a Changelog](https://keepachangelog.com/)
style, grouped by date. Most of this codebase is built in AI-assisted
sessions with no ticket/PR trail, so this file captures *why* a change
was made, not just what — `git log` already shows the diff.

**Convention:** new `## YYYY-MM-DD` section per day (append if one
exists); group under `### Added`/`### Changed`/`### Fixed`/`### Removed`;
state the reason in a sentence or two, not a debugging narrative; note
explicitly when a change reverts/reworks an earlier entry.

See also [`AGENTS.md`](./AGENTS.md) for AI-assistant instructions.

---

## 2026-08-01

### Added

- Initial Astro 7 + Tailwind v4 scaffold: design tokens, content
  collections, global layout, homepage sections — originally with GSAP
  + ScrollTrigger + Lenis (removed, see Performance).
- Content imagery moved to `astro:assets` (WebP at build time) after
  diagnosing unoptimized source images, not animation code, as the
  cause of scroll jank.

### Changed

- Navbar converged to: wordmark/hamburger below `lg`, full inline links
  at `lg`+, always-on blurred background.
- Scroll/motion simplified after feedback the original animation set
  felt busy. Lenis switched from restart-y `duration` easing to
  continuous `lerp` smoothing for a less clunky mouse-wheel feel.

### Performance

- Removed GSAP+ScrollTrigger (~90% of shipped JS, doing almost nothing
  after simplification) for native `requestAnimationFrame`/
  `IntersectionObserver`. Removed Lenis for a ~1.2KB hand-rolled
  smoother. JS: ~148KB raw/55KB gzip → ~35KB/10.6KB.
- Preloader rebuilt without GSAP (CSS `@keyframes` + `setTimeout`
  safety net) — old version could strand visitors behind an opaque
  splash if the GSAP import failed.
- Hero carousel defers loading slides 2/3.

### Fixed

- Hamburger/close icon was invisible against the curtain overlay (same
  color).
- Parallax broke Featured Projects' grid row-height (was depending on
  an image's in-flow size); fixed with explicit `auto-rows`.

### Removed

- Dead theme animation; duplicated social-links and section-heading
  markup consolidated into shared components.

### Fixed (production-readiness audit)

- Mobile curtain menu had no focus trap/`inert`/Escape handling (WAI-
  ARIA dialog pattern). Also fixed duplicate-listener leak from
  re-registering on every client-side nav.
- No SEO/social metadata — added canonical/OG/Twitter tags, sitemap,
  robots.txt. `astro.config.mjs`'s `site` still needs the real domain.
- `README.md` was one line — replaced with real docs.

## 2026-08-06

### Added

- Real brand assets in `public/` from a supplied kit — kept only what
  code actually uses (favicon, apple-touch-icon, logo, og-image);
  dropped unused colorways/PWA sizes since `public/` ships as-is.
- Preloader rebuilt with a real handwriting animation ("inking" draws
  stroke-by-stroke, "storeys" pops in letter by letter, icon draws
  first). The brand kit's SVGs were flattened with no per-letter/stroke
  data, so the studio's Illustrator file was converted via
  `pdftocairo -svg`, which preserved separate glyphs/strokes. Assembled
  into `wordmark-animated.svg`, duplicated inline in `Preloader.astro`
  since the per-stroke CSS animation needs to target individual paths
  (impossible through an `<img>`). Strokes draw via `stroke-dasharray`/
  `dashoffset`, lengths measured at runtime via `getTotalLength()`. The
  Illustrator file's icon was a raster scan, not vector, so the already-
  vectorized `icon.svg` is reused for its draw-on instead.
- Identified the supplied `Fonts/` against the extracted letterforms
  (not needed by the build, useful for future edits): "inking" is
  **Halimun** (exact match); "storeys"/tagline closest to **Avenir LT
  Std 45 Book** (family match, not confirmed exact). Kept those two;
  dropped the non-matching Avenir Condensed weight and `Harmattan/`.
- Preloader's exit is now a shared-element transition: the icon flies
  from its splash position to its real position in `Nav.astro`
  (measured via `getBoundingClientRect`, since that varies by
  viewport), while the backdrop dissolves separately — reads as the
  logo relocating into the navbar rather than fading away.

### Changed

- Nav/Footer text wordmarks swapped for the brand's actual script
  wordmark, later upgraded to the crisper Illustrator-sourced version.
- Nav header background switched from translucent alabaster to
  charcoal (matching footer/curtain menu); nav text flipped light-on-
  dark to match.
- Nav and Footer logos sized up several times over the session (final:
  Nav icon+wordmark `h-11`/`md:h-14`, Footer icon+wordmark side-by-side
  at `h-20`/`md:h-24`, dropping Footer's stacked tagline layout).
- Nav icon made bigger and bolder via a `feMorphology dilate` filter
  (no `font-weight` available on a filled shape) in a dedicated
  `icon-nav.svg`, scoped to the navbar only — Footer/favicon/Preloader
  keep the regular weight, so there's a brief weight "pop" when the
  preloader's flown icon is swapped for the bold nav one.

### Fixed

- "inking" strokes were disappearing right after being drawn: `stroke`
  was declared only at the `100%` keyframe, and CSS holds a
  single-keyframe property's value for the *whole* animation — so
  `stroke: none` applied from `0%`. Fixed by declaring it at every stop.
- The icon's positioning `transform` attribute would've been discarded
  (not combined with) by the CSS fly-animation transform. Fixed by
  moving that positioning to a nested inner group.
- Whole preloader was invisible in production builds: the absolutely-
  positioned backdrop was painting over the non-positioned SVG mark
  regardless of DOM order (positioned elements always paint above
  static ones). Fixed with `relative` on the SVG. Only caught by
  running the real build in a headless browser, not by reading the
  compiled output.
- Removing Nav's wordmark left the preloader's flying wordmark with
  nowhere to land; it now fades out instead of hanging in place.

### Reverted

- "inking" was lightened everywhere via `feMorphology erode` — undone
  per follow-up request, back to original weight.
- Nav's wordmark image removed per request — icon-only now.

### Changed

- Dark surfaces (Nav header/curtain menu, Footer, Preloader backdrop,
  Hero, Testimonials, and photo-darkening overlays on Hero/Featured
  Projects) switched from charcoal to terracotta; their accent color
  (`terracotta-light`, plus all logo files rendered on them - `icon.svg`,
  `icon-nav.svg`, `wordmark-animated.svg`) switched to white so they
  still read against the new red background. Body text and the main
  light-background terracotta accent (eyebrows, links) are unchanged -
  scoped that way on request, since white text/links would be invisible
  on the site's light alabaster background.
