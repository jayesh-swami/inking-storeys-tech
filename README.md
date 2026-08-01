# Inking Storeys

Marketing site for Inking Storeys, an architecture and interior design
atelier. Built with [Astro](https://astro.build) and
[Tailwind CSS v4](https://tailwindcss.com), statically generated with
no client-side framework runtime.

## Tech stack

- **Astro 7** (static output) - see `astro.config.mjs`
- **Tailwind CSS v4**, configured entirely in CSS (`src/styles/global.css`'s
  `@theme` block) - there's no `tailwind.config.js` in this project
- **Content Layer collections** (`src/content.config.ts`) for projects,
  testimonials, and FAQs - see `src/content/`
- **Zero JS framework** - no React/Vue/Svelte. All interactivity is
  hand-written vanilla TypeScript in `src/scripts/`, kept deliberately
  dependency-free (see [`CHANGELOG.md`](./CHANGELOG.md) for why GSAP and
  Lenis were both tried and then removed)
- **`@fontsource`** for self-hosted fonts (Cormorant Garamond, Montserrat,
  DM Sans) - no external font requests
- **`@astrojs/mdx`** for project write-ups, **`@astrojs/sitemap`** for
  the generated sitemap

## Getting started

Requires Node 22.12+ (see `package.json`'s `engines` field).

```sh
npm install
npm run dev       # starts the dev server at http://localhost:4321
```

Other commands:

| Command           | Action                                       |
| ----------------- | --------------------------------------------- |
| `npm run build`   | Type-checks and builds the production site to `./dist/` |
| `npm run preview` | Serves the built `./dist/` output locally, to sanity-check a production build before deploying |
| `npx astro check` | Type-checks the project without building (also runs as part of `npm run build`) |

## Project structure

```
src/
├── content.config.ts     # Content Layer collection schemas (projects, testimonials, faqs)
├── content/
│   ├── projects/*.mdx     # One file per portfolio project
│   ├── testimonials/*.md  # Homepage testimonial quotes
│   └── faqs/*.md          # Homepage FAQ entries (question in frontmatter, answer in the body)
├── layouts/
│   └── Layout.astro       # Base HTML shell: <head>/SEO meta, global chrome, global scripts
├── components/
│   ├── home/               # Homepage-section components (Hero, FeaturedProjects, About, ...)
│   ├── icons/               # Hand-written SVG icons Lucide doesn't ship (brand/social marks)
│   ├── Nav.astro, Footer.astro, Preloader.astro   # Site-wide chrome
│   └── SectionHeading.astro, SocialLinks.astro    # Small shared components
├── pages/
│   └── index.astro         # Route entry points - one file per URL
├── scripts/
│   ├── motion.ts            # Smooth wheel-scroll, scroll-linked parallax, scroll-triggered reveals
│   └── carousel.ts          # Generic slideshow controller (drives the Hero and Testimonials sliders)
└── styles/
    └── global.css           # Tailwind entry point, design tokens, small hand-written CSS rules
```

`src/scripts/motion.ts` in particular is heavily commented if you're
trying to understand the smooth-scroll or parallax implementation - both
were deliberately built without an animation library, and the comments
there explain the "why," not just the "what."

## Content

Adding a project, testimonial, or FAQ is a matter of adding a new file
under `src/content/<collection>/` matching the shape of an existing one
in that folder - the frontmatter schema for each collection is defined
in `src/content.config.ts` and validated at build time, so a malformed
or missing field fails the build with a clear error rather than
rendering wrong silently.

Project images are currently sourced directly from Unsplash by URL
(see any file under `src/content/projects/`) as placeholder photography
- swap these for real project photos by replacing the `hero_media`/
`gallery` URLs; Astro's image pipeline (`astro:assets`) resizes and
re-encodes whatever URL is given at build time, so no extra
configuration is needed as long as the source domain stays in
`astro.config.mjs`'s `image.domains` (or is added, for a new source).

## Deployment

This is a fully static site (`output: 'static'`, Astro's default) -
`npm run build` produces a `dist/` directory of plain HTML/CSS/JS/image
files that can be deployed to any static host (Netlify, Vercel,
Cloudflare Pages, GitHub Pages, etc) with no server runtime required.

Before the first production deploy:

1. Set the real production domain in `astro.config.mjs`'s `site` field
   (currently a placeholder) - this feeds the sitemap, canonical URLs,
   and OpenGraph/Twitter meta tags in `Layout.astro`.
2. Update `public/robots.txt`'s `Sitemap:` line to match.
3. Add a default social-share image and wire it into `Layout.astro`'s
   `image` prop default (see the comment on that prop) - there isn't
   one yet, so pages that don't pass `image` explicitly currently omit
   `og:image`/`twitter:image` entirely rather than pointing at a
   placeholder.

## Working with AI on this codebase

Most of this codebase's history so far has been built in AI-assisted
sessions (Claude Code). [`AGENTS.md`](./AGENTS.md) has repo-specific
instructions for AI coding assistants working here, and
[`CHANGELOG.md`](./CHANGELOG.md) is the record of what's been built and
*why* - read the latter before assuming an unusual-looking piece of code
is an oversight rather than a deliberate, already-considered decision.
