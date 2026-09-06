# Typed

> **Beta:** This repository and all packages are in **beta**.

**Effect native · Platform first**

## Cooperative by _design_

Build reactive applications, accessible interfaces, and your own libraries. Keep the types. Keep the platform. Make it yours.

[**Start building**](https://tylors.github.io/typed-smol/explore/quick-start/) · [**Why cooperative?**](https://tylors.github.io/typed-smol/explore/cooperative-by-design/) · [Documentation](https://tylors.github.io/typed-smol/) · [API reference](https://tylors.github.io/typed-smol/reference/)

TypeScript + [Effect](https://effect.website/) · Open source · Adopt one piece at a time

## Why Typed

**01 — State is yours.** Keep your model independent of the view. Test the behavior without mounting an interface.

**02 — The DOM is shared.** Compose real nodes, native events, and existing tools. Give each part a clear owner.

**03 — Work has a lifetime.** Use Effect to describe errors, dependencies, and cleanup. Carry those contracts directly into the UI.

## Build with it. Build on it.

The same small contracts connect an application to its infrastructure—and a library to its users.

**For application developers —** Start with a running view. Add forms, requests, navigation, and tests as the product grows. Bring the same model to your existing stack or build an application from the ground up. [Follow the application path →](https://tylors.github.io/typed-smol/explore/application-developers/)

**For library developers —** Compose push streams, renderer-independent state, and typed templates. Preserve error and service channels. Build a component library, renderer, or framework. [Follow the library path →](https://tylors.github.io/typed-smol/explore/library-developers/)

## One value. Every place it belongs.

A `RefSubject` is current state and a stream of changes. Derive the total, interpolate both values, and give the button an Effect. The renderer connects the updates and owns their subscriptions.

```ts
import { Fx, RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { Button } from "@typed/ui/Button";

export const Quantity = Fx.gen(function* () {
  const quantity = yield* RefSubject.make(1);
  const total = RefSubject.map(quantity, n => n * 24);

  return html`<section>
    <output>${quantity} items · $${total}</output>
    ${Button({
      content: "Add an item",
      onclick: RefSubject.increment(quantity),
    })}
  </section>`;
});
```

[Understand the example →](https://tylors.github.io/typed-smol/explore/render-your-first-template/)

## Use the pieces you need

No all-or-nothing migration. Start with reactive state, a single island, or a shared component.

### [`@typed/fx`](packages/fx/README.md) — Reactive programs

Values over time, derived state, concurrency, and scoped subscriptions.

### [`@typed/template`](packages/template/README.md) — HTML with a lifetime

Typed template literals, local DOM updates, server rendering, and hydration.

### [`@typed/ui`](packages/ui/README.md) — Accessible building blocks

Compose controls, forms, collections, and overlays around native browser behavior.

### [`@typed/router`](packages/router/README.md) — URLs as typed inputs

Parse paths and queries, select views, and connect routing to your application.

### [`@typed/guard`](packages/guard/README.md) — Decisions with typed inputs

Validate inputs, compose matching rules, and preserve errors and dependencies.

### [`@typed/async-data`](packages/async-data/README.md) — Honest request state

Represent loading, refreshing, success, failure, and optimistic data explicitly.

[Every package, module, and public export →](https://tylors.github.io/typed-smol/reference/)

## Integrate with your stack

Bring Typed to the renderer you already use:

- [`@typed/react`](apps/website/content/recipes/react.md), [`@typed/svelte`](apps/website/content/recipes/svelte.md), and [`@typed/vue`](apps/website/content/recipes/vue.md) — render components in either direction with SSR and hydration, native reactive state, Effect services, and shared routing.
- [`@typed/template/WebComponent`](apps/website/content/recipes/web-component.md) — native custom elements with Typed views, server rendering, and hydration.
- [`@typed/astro`](packages/astro/README.md) — Typed islands in Astro pages.

[See how Typed fits your stack →](https://tylors.github.io/typed-smol/integrate/)

## Keep useful work useful

Separate business rules from presentation. Reuse accessible interaction patterns. Adopt new tools without rewriting the model. Those are engineering choices that leave more room to work on the product.

## Documentation website

[`apps/website`](apps/website/README.md) is an Astro static site for GitHub Pages. Guides, integration recipes, the Quick Start, and TodoMVC tutorial live in Markdown. The API reference is generated from public package exports and source documentation.

```sh
pnpm --filter typed-website docs:generate
pnpm --filter typed-website test:docs
pnpm --filter typed-website typecheck
pnpm --filter typed-website test:production
pnpm --filter typed-website dev
```

See [website development](apps/website/README.md) and the [@typed/astro integration](packages/astro/README.md) for commands and rendering contracts.
