---
title: "Provide services and own subscriptions"
summary: "Keep Effect requirements explicit while giving each Fx run a clear Layer, Scope, and shutdown boundary."
section: "Fx"
kind: "guide"
order: 1.9
---

An Fx can require a service and acquire a resource during observation. Providing the service
satisfies its dependency; the subscription's scope owns what it acquires. This guide shows where
to provide producer and observer services, and how stopping the observer releases the resource.

Begin with [dynamic producers](/explore/fx-dynamic-producers) and [Consuming Fx](/explore/consuming-fx).

## Give the monitor an explicit acquisition and shutdown path

A quote source needs `MarketFeed`; its consumer needs `PriceAudit`. Keep those requirements
separate so the application can provide each implementation:

```ts
import { Context, Effect, Fiber, Layer } from "effect";
import { Fx } from "@typed/fx";

interface Quote {
  readonly symbol: string;
  readonly cents: number;
}

class MarketFeed extends Context.Service<
  MarketFeed,
  {
    readonly open: Effect.Effect<{
      readonly quotes: Fx.Fx<Quote>;
      readonly close: Effect.Effect<void>;
    }>;
  }
>()("app/MarketFeed") {}

class PriceAudit extends Context.Service<
  PriceAudit,
  { readonly write: (quote: Quote) => Effect.Effect<void> }
>()("app/PriceAudit") {}

const quotes: Fx.Fx<Quote, never, MarketFeed> = Fx.genScoped(function* () {
  const feed = yield* MarketFeed;
  const socket = yield* Effect.acquireRelease(feed.open, (socket) => socket.close);

  return socket.quotes;
});

// A periodic source stands in for a live connection.
const MarketFeedLive = Layer.succeed(MarketFeed, {
  open: Effect.succeed({
    quotes: Fx.periodic("1 second").pipe(Fx.map(() => ({ symbol: "TYPED", cents: 12_345 }))),
    close: Effect.log("market socket closed"),
  }),
});

const PriceAuditLive = Layer.succeed(PriceAudit, {
  write: (quote: Quote) => Effect.log(`${quote.symbol}: ${quote.cents}`),
});

const observeQuotes = Fx.observe(
  quotes.pipe(Fx.provide(MarketFeedLive)),
  Effect.fn(function* (quote: Quote) {
    const audit = yield* PriceAudit;

    yield* audit.write(quote);
  }),
).pipe(Effect.provide(PriceAuditLive));

// The host owns this root Fiber and interrupts it during shutdown.
const monitorFiber = Effect.runFork(observeQuotes);
const stopMarketMonitor = () => Effect.runPromise(Fiber.interrupt(monitorFiber));
```

Running `observeQuotes` provides `MarketFeed`, opens its handle, and observes quotes. The downstream
callback separately requires `PriceAudit`; its Layer supplies the destination. The service channels
remain visible until those providers are installed. `stopMarketMonitor` interrupts the root Fiber,
which closes the source scope and runs `socket.close`.

A service instance is not necessarily its resource. One `MarketFeed` service can open multiple
connections; providing it does not automatically share the Fx. Conversely, an already-open resource
may have an application owner that outlives this particular monitor.

`genScoped` keeps acquisition alive through observation and waits for cleanup before completing.
[Dynamic producers](/explore/fx-dynamic-producers#keep-acquisition-alive-through-the-selected-producer)
explains that scope placement.

## Choose whether the provider builds or reuses the service

```fx-marble
title: provide acquires a Layer before forwarding the source values and releases it afterward
covers: provide
input source: . . ^ a b | .
operator: provide(MarketFeedLive)
inner service Layer: ^ build ready . . release |
output values: . . . a b . |
```

[`provide`](/reference/symbols/QHR5cGVkL2Z4L0Z4I3Byb3ZpZGU) builds the Layer for this subscription,
then releases that Layer's Scope when the run ends. The Layer's own errors and dependencies remain
part of the resulting type contract. Supplying a Layer is acquisition, not merely a cast removing `R`.

`provideContext` and `provideService` reuse existing instances; the caller keeps ownership of them.
They do not acquire or finalize those instances. `provideServiceEffect` runs a construction Effect
before the source starts; if it requires Scope, that requirement remains for the caller.

## Trace a second observer before choosing sharing

A chart and a status badge observing ordinary `quotes` each open a connection. Removing the chart
releases only its connection; the badge keeps running. If both should use one connection, construct
one `Subject.multicast(quotes)` wrapper and expose it to both. Two independently constructed wrappers
still represent two sharing populations. The first subscriber starts the shared source, the last
leaving interrupts it, and a later subscriber starts a fresh execution.

Sharing decides the source population; Scope decides its owner. Do not fork an observer into a scope
that immediately returns and assume the connection remains live. Keep the scope open for the actual
feature lifetime, or use the existing application scope.

## Check the shutdown promise

Count acquisitions and releases: observing ordinary `quotes` twice should open two handles.
Interrupt one observer and expect only its handle to close; interrupt the other and expect the
second to close. Include a source that stays silent, so cleanup cannot accidentally depend on
receiving a value.

For related boundaries, use [keyed collections](/explore/keyed-template-collections) to retain work
across collection updates, [Sink services](/explore/sink-writing-effects) to expose an output
capability, and the [operator atlas](/explore/fx-operator-atlas) to look up lifecycle hooks, tracing,
and Layer-owned background runners.
