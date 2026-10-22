// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Hosted on GitHub Pages as a project site, not a custom domain:
  // https://jayesh-swami.github.io/inking-storeys-tech/ (deployed by
  // .github/workflows/deploy.yml). `site` feeds @astrojs/sitemap and
  // the canonical/OpenGraph URLs in Layout.astro. `base` must match
  // the GitHub repo name, since that's the sub-path Pages serves
  // from - and every root-relative link in src/ has to go through
  // withBase() (src/lib/url.ts) or it'll point outside the site.
  site: 'https://jayesh-swami.github.io',
  base: '/inking-storeys-tech',

  vite: {
    // Tailwind v4 is a Vite plugin rather than an Astro integration -
    // config lives entirely in CSS (`@theme` in src/styles/global.css`),
    // there's no tailwind.config.js in this project.
    plugins: [tailwindcss()]
  },

  integrations: [
    // Enables .mdx content files (used by the `projects` collection so
    // project write-ups can embed JSX-like components in the body, not
    // just plain markdown).
    mdx(),
    // Generates /sitemap-index.xml + /sitemap-0.xml at build time from
    // the site's static routes. public/robots.txt points search
    // engines at it.
    sitemap(),
  ],

  image: {
    // Project imagery is sourced directly from Unsplash by URL rather
    // than downloaded into the repo (see src/content/projects/*.mdx).
    // Astro's <Image>/getImage() only optimizes (resize + re-encode to
    // WebP at build time) remote sources whose domain is explicitly
    // allow-listed here - without this, Image would refuse to process
    // the Unsplash URLs and they'd be served at their original,
    // multi-megabyte size. This was the actual root cause of an early
    // "scroll feels janky" report - not the animation code.
    domains: ['images.unsplash.com']
  }
});
