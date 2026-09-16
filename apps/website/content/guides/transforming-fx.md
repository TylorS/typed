---
title: "Transforming Fx"
summary: "Turn pushed values into useful domain data without hiding failures, services, or timing."
section: "Fx"
kind: "guide"
order: 1.2
---

<span id="normalize-before-comparing-repeated-input"></span>

A catalog feed contains records the page cannot display directly: inactive products, raw cents, and
prices that need formatting. The source already decides when records arrive. This lesson
turns each record into useful page data without changing who owns the source.

Start with [Building Fx](/explore/building-fx). We make decisions from one input alone, then introduce
an Effectful callback. Repeated input and clocks have their own [time lesson](/explore/fx-time-and-rate).

## Admit a product and build its display value

```ts
import { Effect } from "effect";
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
  Fx.filter((product) => product.active),
  Fx.map(({ id, name, priceInCents }) => ({
    id,
    title: name,
    price: `$${(priceInCents / 100).toFixed(2)}`,
  })),
);

const result = await Effect.runPromise(Fx.collectAll(cards));

// [{ id: "desk", title: "Standing desk", price: "$499.00" }]
```

The active desk becomes a card; the inactive lamp produces no output. `filter` keeps admitted
values unchanged, and `map` transforms each admitted value. Put admission first so rejected products
do not need formatting.

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

## Transform only when a value is available

Use `filterMap` when the transformation itself returns an Option. For example, a lookup can produce
a label or omit an unknown ID:

```ts
import { Effect, Option } from "effect";
import { Fx } from "@typed/fx";

const names = new Map([["desk", "Standing desk"], ["lamp", "Desk lamp"]]);

const labels = Fx.fromIterable(["desk", "missing", "lamp"]).pipe(
  Fx.filterMap((id) => Option.fromNullishOr(names.get(id))),
);

const result = await Effect.runPromise(Fx.collectAll(labels));

// ["Standing desk", "Desk lamp"]
```

```fx-marble
title: filterMap omits None and emits each Some in order
covers: filterMap
input: 1 2 3 4 |
operator: filterMap(toOption)
output: . 20 . 40 |
```

The empty slots are omissions, not delayed work. `compact` handles a source that already emits
Options. See the [operator atlas](/explore/fx-operator-atlas) for constant mapping with `as` and
translating both success and failure with `mapBoth`.

## Make failure explicit with an Effect callback

Pure callbacks should not hide requests or expected parsing errors. `mapEffect` runs a callback
whose failure and service requirements become part of the resulting Fx:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const parsePrice = (text: string): Effect.Effect<number, "InvalidPrice"> => {
  const price = Number(text);

  return text.trim() !== "" && Number.isFinite(price)
    ? Effect.succeed(price)
    : Effect.fail("InvalidPrice" as const);
};

const prices: Fx.Fx<number, "InvalidPrice"> = Fx.fromIterable(["499.00", "89.00"]).pipe(
  Fx.mapEffect(parsePrice),
);

const result = await Effect.runPromise(Fx.collectAll(prices));

// [499, 89]
```

Replacing `"89.00"` with `"unknown"` fails collection with `InvalidPrice`. The earlier emission is
not retracted, but `collectAll` cannot return a successful array after failure. If the callback
requires a service, that requirement is retained too; [services and lifetime](/explore/fx-services-and-lifetime)
shows how to provide it.

```fx-marble
title: mapEffect emits one successful result for each input
covers: mapEffect
input: 1 . 2 . 3 |
operator: mapEffect(loadLabel)
output: label-1 . label-2 . label-3 |
```

```fx-marble
title: tap observes each value before forwarding it
covers: tap
input: 1 . 2 . 3 |
operator: tap(record)
output: 1 . 2 . 3 |
```

These rows assume sequential delivery. `tap` runs an Effect while keeping the original value.
The corresponding admission operators are `filterEffect` (keep for `true`) and `filterMapEffect`
(emit each `Some`). A failed predicate is not `false`: it enters the failure
channel. [Recovery](/explore/fx-errors-and-recovery) decides whether that stops the feature.

Effectful transformation inherits producer concurrency. If two callback deliveries overlap, the
second lookup may finish first. No queue is added here. Choose an explicit
[higher-order policy](/explore/fx-higher-order-and-concurrency) when the requirement is “finish every
conversion in order” or “discard obsolete work.”

Operator order is product behavior: normalize before an equality check, and place an observation
before or after admission according to what it should count. Continue with
[stateful transforms](/explore/fx-stateful-transforms) for local history, [time and rate](/explore/fx-time-and-rate)
for debounced search, or [Composing Fx](/explore/composing-fx) to combine independent inputs.
