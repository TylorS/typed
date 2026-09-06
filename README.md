# Typed

> **Beta:** This repository and all packages are in **beta**.

**Typed** is an Effect-native toolkit for reactive state, HTML templates, routing, and accessible UI.
Use the pieces you need, with explicit dependencies and scoped lifetimes.

Start with the [documentation](https://tylors.github.io/typed/),
[Quick Start](https://tylors.github.io/typed/explore/quick-start/), or
[package reference](https://tylors.github.io/typed/reference/).
Typed builds on [Effect](https://effect.website/).

This is the Effect 4 line, developed in [typed-smol](https://github.com/TylorS/typed-smol)
and merged back into Typed with both repositories' Git histories preserved.
The [Effect 3 source](https://github.com/TylorS/typed/tree/3b44be752873fb43497539783e47ffc642411182)
remains available in the original history.

## Packages

The core toolkit is [`@typed/fx`](packages/fx/README.md) for reactive state,
[`@typed/template`](packages/template/README.md) for HTML and DOM rendering,
[`@typed/router`](packages/router/README.md) for routes, and
[`@typed/ui`](packages/ui/README.md) for accessible components.

Use the integration that fits your application:

- [`@typed/react`](apps/website/content/recipes/react.md), [`@typed/svelte`](apps/website/content/recipes/svelte.md), and [`@typed/vue`](apps/website/content/recipes/vue.md) render components in either direction with SSR and hydration, native reactive state, Effect services, and shared routing.
- [`@typed/template/WebComponent`](apps/website/content/recipes/web-component.md) defines native custom elements with Typed views, server rendering, and hydration.
- [`@typed/astro`](packages/astro/README.md) renders and hydrates Typed islands in Astro pages.

## Documentation website

`apps/website` is an Astro static site for GitHub Pages. Guides, integration recipes, the Quick
Start, and TodoMVC tutorial live in Markdown. The API reference is generated from public package
exports and source documentation. Interactive examples, search, and theme controls use Typed
islands through the new `@typed/astro` workspace package.

```sh
pnpm --filter typed-website docs:generate
pnpm --filter typed-website test:docs
pnpm --filter typed-website typecheck
pnpm --filter typed-website test:production
pnpm --filter typed-website dev
```

See [website development](apps/website/README.md) and the
[@typed/astro integration](packages/astro/README.md) for commands and rendering contracts.
