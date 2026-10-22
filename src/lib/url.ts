/**
 * Prefixes a root-relative path ("/about", "/icon.svg") with the
 * configured `base` from astro.config.mjs. Needed because the site can
 * be served from a sub-path (e.g. GitHub Pages' project URL,
 * `<user>.github.io/inking-storeys-tech/`) where a bare "/about" would
 * point outside the site. With base "/" this returns the path unchanged.
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}${path}`;
}
