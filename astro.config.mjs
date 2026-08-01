// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // TODO: replace with the real production domain before launch. This
  // is required for @astrojs/sitemap (below) to generate absolute URLs,
  // and Layout.astro uses it to build canonical/OpenGraph URLs too - a
  // placeholder here means both currently emit the wrong domain.
  site: 'https://www.inkingstoreys.com',

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
