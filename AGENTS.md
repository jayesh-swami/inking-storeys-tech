## Changelog

This repo keeps a [`CHANGELOG.md`](./CHANGELOG.md) as the record of *why*
things are the way they are — most of the codebase's history is AI-assisted
conversational sessions, which leave no ticket or design doc behind
otherwise.

**When you make a meaningful change** (not a typo fix or copy tweak —
think: added a feature, removed a dependency, changed an architectural
approach, fixed a non-obvious bug, reverted something you tried
earlier), add an entry to `CHANGELOG.md` under today's date before
finishing the task. State the reason for the change, not just what
changed — the diff already shows *what*. Read the top of that file for
the full convention before adding an entry the first time.

Before starting non-trivial work, skim the most recent entries so you
don't re-litigate a decision that was already made deliberately (e.g.
this project has no animation library on purpose — GSAP and Lenis were
both removed after measuring their actual cost, not by oversight).

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
