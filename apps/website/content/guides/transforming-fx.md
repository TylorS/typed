---
title: "Transforming Fx"
summary: "Turn pushed values into useful domain data without hiding failures, services, or timing."
section: "Fx"
kind: "guide"
order: 1.2
---

A catalog feed contains records the page cannot display directly: inactive products, raw cents, and
prices that need a currency service. The source already decides when records arrive. This lesson
turns each record into useful page data without changing who owns the source.

Start with [Building Fx](/explore/building-fx). We first make decisions from one input alone, then
introduce a service, and finally add just enough history and time for repeated user input.

## Admit a product and build its display value

```ts
import { Effect, Option } from "effect";
import { Fx } from "@typed/fx";

interface Product {
  readonly id: string;
  readonly name: string;
  readonly priceInCents: number;
  readonly active: boolean;
}

const products = Fx.fromIterable<Product>([
  { id: "desk", name: "Standing desk", priceInCents: 49900, active: true },
  { id: "lamp", name: "Desk lamp", priceInCents: 8900, active: false },
]);

const cards = products.pipe(
  Fx.filterMap((product) => (product.active ? Option.some(product) : Option.none())),
  Fx.map(({ id, name, priceInCents }) => ({
    id,
    title: name,
    price: `$${(priceInCents / 100).toFixed(2)}`,
  })),
);

const result = await Effect.runPromise(Fx.collectAll(cards));
// [{ id: "desk", title: "Standing desk", price: "$499.00" }]
```

The active desk becomes a card; the inactive lamp produces no output. `filterMap` combines admission
and transformation through `Option`: `Some` emits, `None` omits. Use `filter` when the original value
should remain unchanged and `map` when every input always has one output. `as` replaces each value
with a constant; `compact` unwraps a producer that already emits Options.

```fx-marble
title: map and as emit once for every input
covers: map, as
input: a . b . c |
operator: map(f) / as(value)
output map: f(a) . f(b) . f(c) |
output as: value . value . value |
```

Read vertically: the `map` output depends on its input; `as` has the same value in every occupied
slot. Neither removes events.

```fx-marble
title: filter keeps admitted values in their input slots
covers: filter
input: 1 2 3 4 |
operator: filter(isEven)
output: . 2 . 4 |
```

```fx-marble
title: filterMap omits None and emits each Some in order
covers: filterMap
input: 1 2 3 4 |
operator: filterMap(toOption)
output: . 20 . 40 |
```

```fx-marble
title: compact drops None and unwraps Some
covers: compact
input: Some(a) None Some(b) |
operator: compact
output: a . b |
```

The empty output slots are omissions, not work delayed until later. In the catalog pipeline, the
lamp is rejected before formatting. Swapping a filter with expensive formatting changes which work
runs even when the displayed cards happen to match.

`mapBoth` additionally translates the expected failure channel while mapping successful records.
It does not recover the source or restart its work:

```fx-marble
title: mapBoth keeps one success output while also mapping typed failures
covers: mapBoth
input: ok !offline
operator: mapBoth({ onSuccess, onFailure })
output: OK !OfflineError
```

Here `ok` becomes `OK`, and a later `offline` failure becomes `OfflineError`. A thrown decoder error
inside `map` is a defect, not a typed parse result. Move expected failure into Effect rather than
using a pure callback as an untracked request or exception boundary.

## Introduce the currency service where it is needed

Converting prices requires a rate and can fail when a currency is unsupported. The Effect callback
makes those requirements visible on the output Fx:

```ts
import { Context, Data, Effect } from "effect";
import { Fx } from "@typed/fx";

class MissingRate extends Data.TaggedError("MissingRate")<{
  readonly currency: string;
}> {}

class ExchangeRates extends Context.Service<
  ExchangeRates,
  {
    readonly fromUsd: (currency: string) => Effect.Effect<number, MissingRate>;
  }
>()("docs/ExchangeRates") {}

interface Price {
  readonly usd: number;
  readonly currency: string;
}

const prices = Fx.fromIterable<Price>([
  { usd: 499, currency: "EUR" },
  { usd: 89, currency: "GBP" },
]);

const convertPrice = Effect.fn("convertPrice")(function* (price: Price) {
  const rates = yield* ExchangeRates;
  const rate = yield* rates.fromUsd(price.currency);
  return price.usd * rate;
});

const converted: Fx.Fx<number, MissingRate, ExchangeRates> = prices.pipe(
  Fx.mapEffect(convertPrice),
);

const runnable = converted.pipe(
  Fx.provideService(ExchangeRates, {
    fromUsd: (currency) =>
      currency === "EUR"
        ? Effect.succeed(0.92)
        : currency === "GBP"
          ? Effect.succeed(0.79)
          : Effect.fail(new MissingRate({ currency })),
  }),
);

const result = await Effect.runPromise(Fx.collectAll(runnable));
// [459.08, 70.31]
```

[`mapEffect`](/reference/symbols/QHR5cGVkL2Z4L0Z4I21hcEVmZmVjdA) combines the source and callback
error/service channels. `converted` therefore requires `ExchangeRates` and can report `MissingRate`.
Providing the service chooses the application's rates; it does not silently catch missing ones.

```fx-marble
title: mapEffect emits one successful result for each input
covers: mapEffect
input: 1 . 2 . 3 |
operator: mapEffect(loadLabel)
output: label-1 . label-2 . label-3 |
```

```fx-marble
title: filterEffect keeps values whose Effectful predicate succeeds
covers: filterEffect
input: 1 2 3 4 |
operator: filterEffect(isEven)
output: . 2 . 4 |
```

```fx-marble
title: filterMapEffect emits only successful Some results
covers: filterMapEffect
input: 1 2 3 4 |
operator: filterMapEffect(parse)
output: . 10 . 40 |
```

```fx-marble
title: tap observes each value before forwarding it
covers: tap
input: 1 . 2 . 3 |
operator: tap(record)
output: 1 . 2 . 3 |
```

These rows assume sequential delivery. `mapEffect` forwards the callback's result; `filterEffect`
forwards the original value only for `true`; `filterMapEffect` forwards only `Some`; `tap` forwards
the original after its observation Effect. A failed predicate is not `false`: it enters the failure
channel. [Recovery](/explore/fx-errors-and-recovery) decides whether that stops the feature.

Effectful transformation inherits producer concurrency. If two callback deliveries overlap, the
second lookup may finish first. No queue is added here. Choose an explicit
[higher-order policy](/explore/fx-higher-order-and-concurrency) when the requirement is “finish every
conversion in order” or “discard obsolete work.”

## Normalize before comparing repeated input

A search field demonstrates why operator order is product behavior:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const queries = Fx.fromIterable([" t", "ty", "typed", "typed "]).pipe(
  Fx.map((query) => query.trim()),
  Fx.filter((query) => query.length >= 2),
  Fx.skipRepeats,
  Fx.debounce("10 millis"),
);

const result = await Effect.runPromise(Effect.scoped(Fx.collectAll(queries)));
// ["typed"]
```

Trim first so `"typed"` and `"typed "` become the same query. Reject short queries before they reach
the request boundary. `skipRepeats` remembers the last emitted value for this run; debounce then
waits for quiet. Reversing normalization and comparison can launch a duplicate request for a
whitespace-only edit. Reversing `tap` and the filter similarly changes whether a metric counts raw
keystrokes or accepted queries.

A second observation gets fresh comparison state and a fresh timer. This pipeline has not created
shared writable state. Continue with [stateful transforms](/explore/fx-stateful-transforms) for
accumulators and transitions, [time and rate](/explore/fx-time-and-rate) for clock tests, or
[Composing Fx](/explore/composing-fx) to combine the normalized query with a category filter.
