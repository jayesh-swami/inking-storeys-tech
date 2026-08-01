/**
 * Astro Content Layer collections for this site's structured content.
 *
 * These are the data source for everything content-driven on the
 * homepage (Featured Projects, Testimonials, FAQ) and will back the
 * upcoming /projects listing and project detail pages. Each collection
 * is a folder of files under src/content/<name>/ - see that directory
 * for real examples of each shape.
 *
 * Uses the modern Content Layer `glob()` loader (Astro 5+) rather than
 * the older implicit-collection convention, so entries are typed and
 * validated against the zod schemas below at both dev-time and build
 * time - a malformed frontmatter field fails the build instead of
 * silently rendering wrong.
 */
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/** A single hero/gallery media item - an image today, but the `type` field leaves room for video without a schema migration. */
const mediaSchema = z.object({
  type: z.enum(["image", "video"]),
  url: z.string(),
  alt: z.string(),
});

/**
 * A single portfolio project (architecture or interiors). Powers the
 * homepage's Featured Projects grid today (filtered by
 * `is_featured_on_home`) and will power the full /projects listing and
 * per-project detail pages.
 */
const projects = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    /** URL slug, e.g. "residence-in-the-hills" -> /projects/residence-in-the-hills. Kept as an explicit field (rather than derived from the filename) so it can differ from the source file's name if ever needed. */
    slug: z.string(),
    /** The two macro filter categories the eventual /projects page's discipline toggle will split on. */
    discipline: z.enum(["Architecture", "Interior"]),
    /** The typology filter pills on /projects. */
    typology: z.enum(["Residential", "Commercial", "Office", "Cafe"]),
    location: z.string(),
    /** Short one-line description used on cards; the full write-up lives in the MDX body. */
    excerpt: z.string(),
    /** The large image/video shown on the project's card and detail-page header. */
    hero_media: mediaSchema,
    /** Additional images for the project detail page's gallery, in display order. */
    gallery: z.array(
      z.object({
        url: z.string(),
        alt: z.string(),
        caption: z.string().optional(),
      }),
    ),
    completion_date: z.coerce.date(),
    /** Whether this project appears in the homepage's Featured Projects grid (see FeaturedProjects.astro, which also caps the count at 4 and sorts by completion_date). */
    is_featured_on_home: z.boolean().default(false),
  }),
});

/** A client quote for the homepage Testimonials slider. */
const testimonials = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/testimonials" }),
  schema: z.object({
    quote: z.string(),
    author: z.string(),
    role: z.string().optional(),
    /** Manual display order (ascending) - lets testimonials be reordered without renaming files. */
    order: z.number().default(0),
  }),
});

/** A single Q&A entry for the homepage FAQ accordion. The answer is the markdown body, not a frontmatter field. */
const faqs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/faqs" }),
  schema: z.object({
    question: z.string(),
    /** Manual display order (ascending) - lets FAQs be reordered without renaming files. */
    order: z.number().default(0),
  }),
});

export const collections = { projects, testimonials, faqs };
