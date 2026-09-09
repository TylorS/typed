---
title: Application developers
summary: Build a working order editor, share its state between views, and choose the next lesson from the feature you need to ship.
section: Learning paths
kind: guide
order: 0.1
---

Build one useful feature first: a customer changes an order quantity and sees the subtotal update.
We will give the editor and summary the same model, mount them, and test their shared rule.
Use the [Quick Start project setup](/explore/quick-start#install), then add these files under `src/`.

## Give the feature a model

This order contains tea at $12 per box, with a minimum quantity of one. The quantity is writable;
the subtotal follows from it. Put those rules in `LineItem.ts`:

```ts file="LineItem.ts"
import { Effect } from "effect";
import { RefSubject } from "@typed/fx";

export const makeLineItem = Effect.fn("makeLineItem")(function* () {
  // Allocate per order; a module-level ref would share edits across mounted orders.
  const quantity = yield* RefSubject.make(1);

  return {
    quantity: RefSubject.map(quantity, (value) => value),
    // Derive the total so no quantity command can forget to update it.
    subtotal: RefSubject.map(quantity, (value) => value * 1200),
    add: RefSubject.increment(quantity),
    remove: RefSubject.update(quantity, (value) => Math.max(1, value - 1)),
  };
});

export type LineItem = Effect.Success<ReturnType<typeof makeLineItem>>;
```

`RefSubject.make` allocates state when this Effect runs. Each execution gets its own quantity. The returned
Computed values allow reads and observation; `add` and `remove` provide the writes. Even a caller
outside the UI cannot remove the last box through these commands.

The subtotal is in cents. Formatting belongs to the view; a second writable total would introduce
a second value that every quantity change must remember to update.

## Let two views use that model

The editor changes quantity. The summary only displays the price. Neither allocates state, so each
is an ordinary function returning `html`:

```ts file="View.ts"
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import type { LineItem } from "./LineItem.js";

export const QuantityEditor = (item: LineItem) => html`<section aria-label="Tea quantity">
  <h2>Tea — $12 per box</h2>
  <button type="button"
    ?disabled=${RefSubject.map(item.quantity, (value) => value === 1)}
    onclick=${item.remove}>Remove one</button>
  <output aria-live="polite">Quantity: ${item.quantity}</output>
  <button type="button" onclick=${item.add}>Add one</button>
</section>`;

export const OrderSummary = (item: LineItem) => html`<aside aria-label="Order summary">
  <h2>Order summary</h2>
  <p>Subtotal: $${RefSubject.map(item.subtotal, (cents) => (cents / 100).toFixed(2))}</p>
</aside>`;
```

Passing `item.quantity` connects the output to later values. Reading `yield* item.quantity` in an
Effect would instead give you the current number: useful for a calculation or command, but a
snapshot when inserted into a template. Start with this distinction when state changes but the
screen stays still.

The click binding runs its Effect on activation. A native button supplies keyboard activation and
focus behavior; `?disabled` toggles the native boolean attribute's presence. The model still enforces
that rule independently. Add your existing CSS, Tailwind, or DaisyUI classes to these hosts. For
more involved interaction, use [Typed UI](/explore/ui) and keep your design system.

## Mount one shared instance

Keep the starter's `<div id="app"></div>` and module entry. Replace `main.ts` with:

```ts file="main.ts"
import { Effect, Layer } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render, component } from "@typed/template";
import { makeLineItem } from "./LineItem.js";
import { OrderSummary, QuantityEditor } from "./View.js";

const Order = component(function* () {
  // Both children borrow this instance instead of constructing separate models.
  const item = yield* makeLineItem();
  return html`<main>
    <h1>Your order</h1>
    ${QuantityEditor(item)}
    ${OrderSummary(item)}
  </main>`;
});

const host = document.querySelector<HTMLElement>("#app");
if (host === null) throw new Error("Missing #app host");

await render(Order, host).pipe(
  // Keep the render Scope alive for later state changes and button events.
  Fx.drainLayer,
  Layer.provide(DomRenderTemplate),
  Layer.launch,
  Effect.runPromise,
);
```

Run `npm run dev`. You should see quantity **1**, subtotal **$12.00**, and a disabled **Remove one**.
Click **Add one**: quantity becomes **2**, subtotal becomes **$24.00**, and removal becomes available.
Remove once to return to the initial state.

`component` is useful here because the view performs Effect setup before returning its template.
`QuantityEditor` and `OrderSummary` only arrange supplied values and need no wrapper. `Effect.fn`
constructs the model; `component` connects that setup to rendering. Both use normal TypeScript
functions and inferred types.

The entrypoint starts the runtime once and keeps the render Scope alive. Creating the model inside
each child would create two unrelated orders. Sharing it here gives both views one owner, without
introducing a global store or a service registry.

## Test the rule the buttons use

Install `vitest` as a development dependency if your project has no test runner, then save this as
`LineItem.test.ts` and run `npx vitest run`:

```ts file="LineItem.test.ts"
import { Effect } from "effect";
import { expect, it } from "vitest";
import { makeLineItem } from "./LineItem.js";

it("keeps a minimum quantity and an independent total for each order", () =>
  Effect.gen(function* () {
    const item = yield* makeLineItem();
    const otherOrder = yield* makeLineItem();

    yield* item.remove;
    expect(yield* item.quantity).toBe(1);
    yield* item.add;
    expect(yield* item.quantity).toBe(2);
    expect(yield* item.subtotal).toBe(2400);
    expect(yield* otherOrder.subtotal).toBe(1200);
  }).pipe(Effect.scoped, Effect.runPromise),
);
```

This imports the same model as the mounted page. It proves the minimum, derivation, and independent
instances without a Document. A browser test has a different job: activate the actual buttons and
check their disabled state and visible result. [Testing Typed systems](/explore/testing-typed-systems)
shows how to test interaction, retained DOM identity, request ordering, and cleanup.

<span id="choose-where-the-next-piece-of-state-belongs"></span>

The editor now shares one model between two views. If the draft must survive removing either view, keep its owner above them; [shared state contracts](/explore/shared-state-contracts) covers injected models.

## Continue with the feature in front of you

[Build TodoMVC](/explore/tutorial) to add keyed editing, URL filters and persistence. For a specific control instead, use the [UI task chooser](/explore/ui). The editor above is complete; its API reference and tests remain useful without reading another tour.
