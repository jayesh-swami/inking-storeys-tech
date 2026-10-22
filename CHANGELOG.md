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

- Initial Astro 7 + Tailwind v4 scaffold (originally with GSAP +
  ScrollTrigger + Lenis, removed — see Performance).
- Content images moved to `astro:assets`/WebP — unoptimized source
  images, not animation code, were the actual cause of scroll jank.

### Changed

- Navbar converged to: wordmark/hamburger below `lg`, full inline
  links at `lg`+, always-on blurred background.
- Scroll/motion simplified (original set felt busy); Lenis switched to
  continuous `lerp` smoothing.

### Performance

- Replaced GSAP+ScrollTrigger with native rAF/IntersectionObserver,
  and Lenis with a ~1.2KB hand-rolled smoother. JS ~148KB → ~35KB raw.
- Preloader rebuilt without GSAP (pure CSS + `setTimeout` safety net)
  — a failed GSAP import could previously strand visitors on an opaque
  splash.
- Hero carousel defers loading slides 2/3.

### Fixed

- Hamburger/close icon was invisible against the curtain overlay.
- Parallax broke Featured Projects' grid row-height; fixed with
  explicit `auto-rows`.

### Removed

- Dead theme animation; consolidated duplicated social-links and
  section-heading markup into shared components.

### Fixed (production-readiness audit)

- Mobile menu had no focus trap/`inert`/Escape handling; also fixed a
  duplicate-listener leak on client-side nav.
- Added SEO/social meta, sitemap, robots.txt.
- Replaced one-line `README.md` with real docs.

## 2026-08-06

### Added

- Real brand assets in `public/` from the supplied kit.
- Preloader rebuilt with a real handwriting animation ("inking" draws
  stroke-by-stroke, "storeys" pops in letter by letter, icon draws
  first) — traced from the studio's Illustrator file (`pdftocairo`),
  since the kit's SVGs were flattened with no per-stroke data.
- Identified brand fonts from the supplied kit: "inking" = Halimun;
  "storeys"/tagline ≈ Avenir LT Std 45 Book.
- Preloader exit is a shared-element transition: icon flies to its
  real position in `Nav.astro`, backdrop dissolves separately.

### Changed

- Nav/Footer wordmarks swapped to the brand's real script wordmark.
- Nav header background: alabaster → charcoal (matches footer/curtain
  menu); text flipped light-on-dark.
- Nav/Footer logos sized up; Nav icon bolded via `feMorphology dilate`
  (scoped to nav only).

### Fixed

- "inking" strokes were disappearing right after drawing — `stroke`
  needs declaring at every keyframe, not just the end one.
- Icon's positioning `transform` was getting discarded by the
  fly-animation transform; moved to a nested group.
- Preloader was invisible in production builds — an absolutely-
  positioned backdrop painted over the static SVG regardless of DOM
  order; fixed with `relative`.
- Flying wordmark had nowhere to land once Nav dropped its own
  wordmark; fades out instead.

### Reverted

- "inking" lightening (`feMorphology erode`) undone.
- Nav wordmark removed — icon-only now.

### Changed

- Dark surfaces switched charcoal → terracotta; their accent/logo
  color switched to white to stay legible. Light-background terracotta
  accents unchanged.

## 2026-08-14

### Changed

- Base terracotta iterated across the session: `#c84b31` → `#c97e5d`
  → `#a36a56` (final). Added a full `--color-terracotta-{50..950}`
  tonal scale, computed offline in Oklab from the base via mix-ratio
  blending toward white/black (not fixed lightness stops, which
  happened to land 500 and 600 almost on top of each other for one
  candidate base).
- Site header iterated: translucent+blur → solid terracotta-700 →
  final state of terracotta-600 at 92% opacity, no blur.
- Preloader icon/"inking" stroke widths thinned considerably.
- Preloader icon draw-on reworked multiple times:
  - Ring now scales open from a dot instead of stroke-drawing.
  - Body was originally a dual-direction dash-reveal on the ribbon's
    *outline* (a closed loop, split at its one seam) — replaced
    entirely after reference footage showed two genuinely separate
    strokes. Extracted the ribbon's actual *centerline* offline
    (Voronoi/medial-axis + graph-diameter method), split it at its
    bottom point, refit as bezier curves (`#icon-body-hook`/`-outer`)
    — two independent strokes meeting at the bottom. The original
    ribbon outline is kept as `#icon-body-fill`, fading in once both
    strokes finish.
  - Added "pen tip" dots riding each stroke via CSS Motion Path
    (`offset-path`/`offset-distance`).
  - Root-caused two real cross-browser bugs along the way, both
    invisible in Chromium but breaking the animation entirely in
    Firefox (confirmed with Playwright against both engines, not
    assumed): `stroke-dashoffset` keyframes built from `calc()`/`var()`
    don't interpolate smoothly (fixed via a dedicated `--draw-t`
    custom property animated through literal values only); Firefox
    requires `dasharray`/`dashoffset` `calc()`s to resolve to an
    explicit `<length>` (bare numbers silently compute to `none`/`0px`).
  - Icon draw-on duration: 0.85s → 4.0s (only that stage, not the
    whole preloader); total preloader runtime now ~7.95s.

### Added

- First real project: Chechani's Residence (Jaipur, ongoing), added
  as `is_featured_on_home`. Photos co-located under
  `src/content/projects/` and wired through content.config.ts's
  `image()` helper for build-time optimization.
- `status: "Completed" | "Ongoing"` added to the project schema;
  `completion_date` now optional (required only when Completed).
  Ongoing projects sort first on the homepage grid and show an
  "· Ongoing" tag.

### Removed

- All 6 placeholder Unsplash project entries — Chechani's Residence is
  the only one now.
- Hero carousel's 3 fictional-project slides, replaced with 3 of
  Chechani's own photos (imported locally for build-time optimization).

### Fixed

- Hero and Featured Projects card images were over-cropping real
  project photos — a fixed aspect ratio was forced at build time
  regardless of actual display shape, compounding with runtime
  `object-cover` cropping. Fixed by requesting natural aspect ratios
  and letting `object-cover` do the only crop; also eased the Hero
  parallax overscan/speed and switched its overlay tint from reddish
  terracotta to black.

### Changed

- Preloader's inline SVG path data (icon, "storeys" glyphs, "inking"
  strokes) moved out of `Preloader.astro` into `src/components/
  preloader/{icon-paths,glyphs,inking-strokes}.ts`, per request. Also
  fixed a real duplication along the way: the icon body's `d` strings
  used to appear twice verbatim (once as a `<path d>`, again inside a
  CSS `offset-path: path("...")` for the matching pen-tip dot) - now
  the CSS side reads the same constant via `define:vars`. That
  surfaced its own gotcha: `define:vars` writes a string value's raw
  text as-is, without adding CSS quotes, so `path(var(--x))` silently
  computed to `none` until the value was wrapped in
  `JSON.stringify()` first - confirmed with Playwright against both
  Chromium and Firefox before and after the fix, not assumed.

## 2026-10-02

### Added

- GitHub Actions workflow (`.github/workflows/deploy.yml`) deploying
  the static build to GitHub Pages on push to `main`. Hosted as a
  project site at `jayesh-swami.github.io/inking-storeys/` by choice,
  not a custom domain — replaces the placeholder
  `www.inkingstoreys.com` in `site`, `robots.txt`, and the README.

### Changed

- `base: '/inking-storeys'` set in `astro.config.mjs`, and every
  hard-coded root-relative link/`public/` asset path in `src/` now goes
  through a new `withBase()` helper (`src/lib/url.ts`). Without it, Nav/
  Footer links, icons, favicons, and the OG image all pointed at the
  github.io domain root, outside the site. Astro prefixes bundled
  assets itself; only hand-written paths needed this.

## 2026-10-22

### Fixed

- `base` changed from `/inking-storeys` to `/inking-storeys-tech` (plus
  the URL in `robots.txt`, the README, and the config comment). The
  GitHub repo is named `inking-storeys-tech`, so Pages serves from that
  sub-path; the old `base` would have 404'd every asset and link.
  Reworks the 2026-10-02 `base` entry.
- Note for future deploy failures: an "Invalid YAML front matter in
  *.astro" error comes from GitHub's built-in Jekyll build, not this
  workflow — it means Settings → Pages → Source is still "Deploy from a
  branch" instead of "GitHub Actions".
