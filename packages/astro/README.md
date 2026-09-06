# @typed/astro

Render Typed templates on the server and hydrate them as Astro islands. Astro owns pages, routing, asset delivery, and hydration scheduling. Typed owns each island's rendering, reactive state, and Scope.

```ts
// astro.config.ts
import { defineConfig } from "astro/config";
import typed from "@typed/astro";

export default defineConfig({ integrations: [typed()] });
```

Export a component from an ordinary TypeScript module:

```ts
// Counter.ts
import { component } from "@typed/astro/Component";
import * as RefSubject from "@typed/fx/RefSubject";
import { html } from "@typed/template";

export default component(function* (props: { initial: number }) {
  const count = yield* RefSubject.make(props.initial);
  return html`<button @click=${RefSubject.update(count, (n) => n + 1)}>Count: ${count}</button>`;
});
```

```astro
---
import Counter from "./Counter";
---
<Counter initial={1} client:load />
```

`component` uses the same generator and argument-forwarding conventions as `@typed/ui/Component`. A generator with no parameters produces a lazy Fx value; a generator with parameters produces a function. Return any Renderable, including strings, arrays, Effects, and templates. Optional pipeline functions receive the Fx and the original arguments, preserving errors and required services. Astro normalizes the generator return inside a template boundary, so its Fx emits `RenderEvent` values and requires `Scope | RenderTemplate` in addition to the generator and returned value’s services. This installs hydration context before nested templates run. Pipeline callbacks receive this normalized Fx; keep the final result renderable. A zero-argument pipeline that returns a primitive instead of an object throws because it cannot carry an island brand. The explicit Astro brand identifies candidates without running them; it does not validate that a final pipeline result is renderable.

The integration supplies `RenderTemplate` and `Scope`. Provide additional application services with an Fx pipeline before exporting an island. State acquired inside the generator is recreated separately for each request and browser island, including zero-argument component values.

Without a client directive, Astro emits server-rendered HTML and sends no Typed island JavaScript. `client:load`, `client:idle`, `client:visible`, and `client:media` hydrate Typed's server markers and retain matching DOM nodes. `client:only="@typed/astro"` skips SSR and replaces the fallback when mounting. Pass serializable props as required by Astro; initialize server and browser state consistently. Explicit `RefSubject.hydrate` remains available for adopting live DOM property state such as pre-hydration input edits; the integration does not serialize arbitrary Effect state.

Each SSR call closes its Scope after collecting HTML. Each browser island retains its Scope until Astro dispatches `astro:unmount`. A repeated Astro render with new props closes the previous Scope and runs the component again, resetting generator-local state. Failed initial renders reject Astro's hydration promise. Subsequent rendering failures dispatch `typed:error` on the island with the Effect Cause in `event.detail`.

## Slots

The second argument contains default and named Astro slots as optional Typed renderables:

```ts
import { component, type Slots } from "@typed/astro/Component";
import { html } from "@typed/template";

export default component(function* (_props: {}, slots: Slots) {
  return html`<article>
    ${slots.heading}
    <main>${slots.default}</main>
  </article>`;
});
```

Astro supplies pre-rendered slot HTML. The integration uses `astro-slot` elements for hydrated components and `astro-static-slot` markers for static components, which Astro strips before passing their content to an ancestor. It adopts the existing live slot elements on hydration, preserving child DOM identity and listeners. Ordinary component props still pass through Typed's contextual escaping. Slot renderables are opaque, borrowed content: insert each once; Astro and nested islands retain responsibility for their contents. Do not pass unsanitized external HTML as an Astro raw-HTML slot.

## Validation

```sh
pnpm --filter @typed/astro build
pnpm --filter @typed/astro test
pnpm --filter @typed/astro test:integration
```

The browser suite checks matching-node hydration, reactive updates, isolated state, repeated renders, slot ownership, and unmount cleanup. The production Astro fixture checks SSR and all five built-in hydration directives in Chromium.

The integration follows Astro's [Renderer API](https://docs.astro.build/en/reference/renderer-reference/) and [Integration API](https://docs.astro.build/en/reference/integrations-reference/).
