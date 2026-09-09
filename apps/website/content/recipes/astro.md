---
slug: astro
title: Typed templates in Astro
summary: Let Astro own pages and Markdown while Typed renders and hydrates reactive islands with explicit lifetimes.
---

See [streaming SSR across framework boundaries](/explore/streaming-framework-integrations) for which component bodies stream and which are buffered.

A product page needs an order quantity control while its descriptions and product details remain static HTML. The server supplies the initial quantity; the island owns only its interactive subtotal and button. Keep checkout authorization and final pricing on the server. Choose `client:load` when the button is visible at page entry; use `client:visible` for a below-the-fold example where deferring JavaScript is part of the page design.

Astro owns the page and its Markdown. Typed owns the order island, its reactive state, and its local event handlers. The following implementation starts with server HTML and activates one island in the browser.

## Install the integration

Install the published beta package with the matching Typed beta dependencies:

```sh
pnpm add @typed/astro@beta @typed/fx@beta @typed/template@beta @typed/ui@beta astro@^7.3.1 effect@4.0.0-rc.112
```

The `beta` dist-tag keeps the integration and its Typed dependencies on the same release family. Astro 7 and Effect v4 are supported by the current integration.

Register the integration in `astro.config.ts`:

```ts
import { defineConfig } from "astro/config";
import typed from "@typed/astro";

export default defineConfig({
  integrations: [typed()],
});
```

## Build the quantity and subtotal together

`component` marks a generator-backed Template component so Astro recognizes it without calling unrelated framework components. The generator acquires state with `yield*` and returns any renderable. A parameterized generator produces a component function; a zero-argument generator produces a lazy component value.

```ts
import { component } from "@typed/astro/Component";
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { Button } from "@typed/ui/Button";

export default component(function* ({ initial = 1 }: { readonly initial?: number }) {
  const quantity = yield* RefSubject.make(initial);
  const total = RefSubject.map(quantity, (value) => value * 24);

  return html`<section>
    <h2>Your order</h2>
    <output>${quantity} items · $${total}</output>
    ${Button({
      content: "Add an item",
      onclick: RefSubject.increment(quantity),
    })}
  </section>`;
});
```

Save that component as `src/components/Quantity.ts`, then import it into an Astro page:

```astro
---
import Quantity from "../components/Quantity";
---
<h1>Review your order</h1>
<Quantity initial={2} client:load />
```

Astro passes serializable props to the browser. The component recreates its state from those props. If the server computes a different initial value, pass that value explicitly or use [RefSubject hydration](/explore/refsubject-template-hydration) with the template's state ref.

## Match island loading to when the order control is needed

| Directive                           | When to use it                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| No client directive                 | Render HTML only; no event handlers run in the browser.                              |
| `client:load`                       | Controls people may use immediately.                                                 |
| `client:idle`                       | Secondary controls that can wait until the browser is idle.                          |
| `client:visible`                    | Examples and widgets lower down the page.                                            |
| `client:media="(min-width: 60rem)"` | An island needed only for a matching media query.                                    |
| `client:only="@typed/astro"`        | A component that requires the browser during setup and should skip server rendering. |

With server rendering, the Typed renderer writes hydration markers. The browser renderer uses those markers to adopt matching nodes and attach live state and listeners. The [Astro directives documentation](https://docs.astro.build/en/reference/directives-reference/) defines the loading policies.

## Tie order state and services to one island

The integration supplies the rendering service and an Effect Scope. The generator can return a string, element template, array, or live renderable; Astro normalizes that result to render events under one hydration boundary. Provide application services inside the generator or in an argument-aware component pipeline. Each island has its own running lifetime; one island does not silently acquire another's services.

Closing an island interrupts its Typed work. Re-rendering an existing island closes its old lifetime before starting the replacement. State created inside the callback is recreated on replacement; put deliberately shared state behind an explicitly shared service.

Initial render failures reject rendering. A failure after hydration emits a `typed:error` event on the island. Connect reporting at that boundary when your application needs it.

## Keep Astro-provided content opaque inside a Typed layout

The second callback argument contains named slots as renderable values:

```ts
import { component, type Slots } from "@typed/astro/Component";
import { html } from "@typed/template";

export default component(function* (_props: {}, slots: Slots) {
  return html`<article>
    <header>${slots.heading}</header>
    <div>${slots.default}</div>
  </article>`;
});
```

Astro owns the slot content. Treat it as opaque output and insert each slot once. The integration preserves existing slot nodes during hydration, including nested islands. It does not turn component props into trusted HTML.

## Style the native markup

Use Astro's [Tailwind integration](https://docs.astro.build/en/guides/styling/#tailwind) and [DaisyUI setup](https://daisyui.com/docs/install/astro/) normally. Ensure Tailwind scans the TypeScript files containing your templates. UI hosts accept classes, so the same button behavior can use a project's own visual language.

The [Astro package reference](/reference/packages/%40typed%2Fastro) lists the full integration surface. For the underlying rendering contract, continue with [server rendering and hydration](/explore/server-rendering-and-hydration).

## Prove one click means one update after navigation

Test the generated page with JavaScript disabled to inspect its HTML-only state. Then enable JavaScript, click once, and verify one increment rather than duplicate listeners. Navigate away and back through your actual Astro navigation setup to verify island cleanup. Check the console and the island's `typed:error` event separately: an exception before hydration and a failure in an already-running stream occur at different boundaries.

For a mismatch, compare server and client props, randomness, timestamps, locale formatting, and conditional browser-only markup before changing hydration behavior. A browser-only API belongs in an explicitly client-only component or a browser lifecycle boundary; importing a module that reads `document` during server evaluation still fails before a client directive can help. Use [Astro islands](https://docs.astro.build/en/concepts/islands/) for the page-level model and [Typed components](/explore/building-ui-components) for generator lifetime and service inference.
