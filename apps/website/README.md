# Typed documentation

An Astro static site, published by the existing GitHub Pages workflow at
`https://tylors.github.io/typed/`. The build output is `dist/site`.

```sh
pnpm install --frozen-lockfile
pnpm --filter typed-website dev
```

`dev` builds workspace dependencies, documentation, and Storybook before starting Astro.
Open the printed address under `/typed/`. Use `SITE_BASE=/` for a root-hosted local build.

## Authoring

- `content/guides`: explanations and focused application/library guides.
- `content/learn`: the short Quick Start and its separate counter, SSR, and hydration lessons.
- `content/tutorial`: cumulative TodoMVC chapters with client-only examples.
- `content/recipes`: host and framework integrations.
- `content/glossary`: shared terminology.
- Package source JSDoc and exports: generated API reference, signatures, and examples.

The site uses Astro content collections and Shiki. The Markdown plugin links known Typed
identifiers, renders accessible Fx diagrams, and applies the deployment base to local links.
Generated files are build artifacts; edit the source content or package documentation instead.
Run `pnpm --filter typed-website format:astro` after editing Astro templates; the workspace's
Oxfmt command handles the TypeScript, CSS, JSON, and Markdown files.

Keep teaching templates deliberately indented, with complete opening and closing tags.
The workspace formatter preserves embedded HTML in the runnable examples and code fences
in authored Markdown, so formatting does not split inline tags or change significant text spacing.
Source excerpts remove only their shared outer indentation; their internal nesting and the
complete downloadable files remain tied to the runnable source.

Use short code comments to explain decisions at the point of use: who owns state, why a value
is derived, what a stable key preserves, or when work is cancelled. Keep surrounding prose for
the larger idea and avoid comments that merely repeat the next statement.

`src/site` contains layouts, routes, static document/search endpoints, and Typed islands.
`src/docs` contains extraction and content validation. `src/tutorial` contains shared executable
examples and the build-time curriculum reader. Tailwind and DaisyUI themes in the repository's
`styles/matrix.css` share the Matrix Green palette between the website and Storybook.

Write client behavior with Typed: keep state in `RefSubject`, compose work with `Fx`, and
render reactive content with `html` and UI primitives. Browser event sources own their
listeners through the running Effect scope. Keep native focus, scrolling, measurements,
and browser observation at explicit boundaries; do not use DOM attributes as application state.
Keep mounted views and their state for the document lifetime, including cached-page returns.
Pause playback and suspend browser observation on `pagehide`; reacquire active work on
`pageshow` without remounting the views. The inline theme script only selects the first paint;
the Typed theme component owns subsequent changes.

`/explore/storybook/` embeds the maintained UI stories. `build:storybook` writes its standalone
assets into `public/storybook`; Astro includes them in the static output under the deployment base.

The site emits HTML, direct Markdown, a search index, a documentation manifest, a sitemap,
`llms.txt`, and `llms-full.txt`. All are static files served by GitHub Pages.

## Validation

```sh
pnpm --filter typed-website docs:generate
pnpm --filter typed-website test:docs
pnpm --filter typed-website typecheck
pnpm --filter typed-website exec playwright install chromium
pnpm --filter typed-website test:production
pnpm --filter @typed/astro test
pnpm --filter @typed/astro test:integration
```

`test:docs` checks source coverage, authored examples, cumulative tutorial snapshots, Markdown,
and search behavior. `test:production` regenerates and builds the site, then checks every local
HTML link and renders every documentation page in dark desktop and light mobile layouts.
Focused Chromium checks cover hydration, counter interactions, search, animated marbles,
Storybook controls and theme synchronization. `test:static` runs those output checks against
an existing build.

The extractor and Astro checker use TypeScript 6's compiler API. Library builds retain the
workspace TypeScript version; the website's compiler dependencies are intentionally local.

## GitHub Pages

`.github/workflows/deploy-pages.yml` runs on pushes to `development` or manual dispatch.
It installs with the frozen lockfile, generates and validates
the documentation, builds with `SITE_BASE=/typed/`, checks the static output, and uploads
`dist/site` including discovery files. Astro's `site`, `base`, and trailing-slash settings live
in `astro.config.ts`. No application server is needed. The repository's Pages publishing
source must be set to **GitHub Actions**.
