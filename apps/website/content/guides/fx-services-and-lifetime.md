---
title: "Provide services and own subscriptions"
summary: "Keep Effect requirements explicit while giving each Fx run a clear Layer, Scope, and shutdown boundary."
section: "Fx"
kind: "guide"
order: 1.9
---

A price monitor runs while a workspace is open. Its feed opens a connection; its observer writes to
an audit destination. When the workspace closes, both pending work and the connection must stop.
The service requirements and the resource lifetime answer different questions: what must be supplied,
and how long the acquired resource remains usable.

Begin with [Building Fx](/explore/building-fx) and [Consuming Fx](/explore/consuming-fx). This lesson
follows one monitor from acquisition through delivery and shutdown, then considers what changes
when two consumers need the same feed.

## Give the monitor an explicit acquisition and shutdown path

The fake feed below uses Effect's clock to stand in for a live connection. The `MarketFeed` contract
can supply a real callback-backed feed without changing who owns it:

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

const MarketFeedLive = Layer.succeed(MarketFeed, {
  open: Effect.succeed({
    quotes: Fx.periodic("1 second").pipe(Fx.map(() => ({ symbol: "TYPED", cents: 12_345 }))),
    close: Effect.log("market socket closed"),
  }),
});

const PriceAuditLive = Layer.succeed(PriceAudit, {
  write: Effect.fn(function* (quote: Quote) {
    yield* Effect.log(`${quote.symbol}: ${quote.cents}`);
  }),
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

## Keep setup and delivery inside the same resource scope

```fx-marble
title: genScoped keeps a resource alive through its subscription and releases it afterward
covers: genScoped
input setup: ^ open ready . . |
operator: genScoped(function*)
inner resource scope: . ^ socket . . close |
inner selected Fx: . . ^ a b | .
output values: . . . a b . |
```

`genScoped` owns one child Scope per observation. The resource opens before the selected source
begins and releases after it exits. The output completion waits for cleanup. Acquisition failure
starts no selected producer; interruption of a silent source still releases its handle.

If setup ran in a scope that closed before returning the feed, the first quote would arrive through
a closed connection. Enclose the returned Fx as well as acquisition. [Dynamic producers](/explore/fx-dynamic-producers)
works through that placement using `Fx.fn`, `gen`, `unwrap`, and their scoped forms.

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

```fx-marble
title: existing services stay available while provideContext and provideService forward values
covers: provideContext, provideService
input source: ^ a b |
operator: provideContext(context) / provideService(Config, value)
inner existing service: ready ready ready ready
output values: . a b |
```

`provideContext` and `provideService` reuse existing instances. The flat service lane means the
caller already owns them; these operators neither acquire nor finalize those instances.

```fx-marble
title: provideServiceEffect runs one service Effect before forwarding the source values
covers: provideServiceEffect
input source: . . ^ a b |
operator: provideServiceEffect(Config, makeConfig)
inner service effect: ^ acquire ready . . |
output values: . . . a b |
```

`provideServiceEffect` runs its service Effect once before starting the source. If that Effect needs
Scope, the returned Fx retains the caller-owned Scope requirement. Prefer a named Layer when several
services share acquisition or their lifecycle should be reused as one application capability.

## Trace a second observer before choosing sharing

A chart and a status badge observing ordinary `quotes` each open a connection. Removing the chart
releases only its connection; the badge keeps running. If both should use one connection, construct
one `Subject.multicast(quotes)` wrapper and expose it to both. Two independently constructed wrappers
still represent two sharing populations. The first subscriber starts the shared source, the last
leaving interrupts it, and a later subscriber starts a fresh execution.

Sharing decides the source population; Scope decides its owner. Do not fork an observer into a scope
that immediately returns and assume the connection remains live. Keep the scope open for the actual
feature lifetime, or use the existing application scope.

## Keep independently keyed work alive across collection updates

A watchlist adds and removes symbols while preserving existing rows. `keyed` gives each new key a
RefSubject and child Scope:

```fx-marble
title: keyed reuses b, closes removed a, and creates c under separate child scopes
covers: keyed
input collections: ^ [a,b] . [b,c] |
operator: keyed({ getKey, onValue })
inner key a scope: . ^ a close |
inner key b scope: . ^ b b |
inner key c scope: . . . ^ c |
output ready rows: . . [a,b] . [b,c] |
```

`b` reuses its existing child when `[a,b]` becomes `[b,c]`; `a` closes; `c` starts. Stable identity
preserves the child's work through moves and updates. The parent Scope owns remaining children, so
that requirement remains on the returned Fx. A changing key restarts work even if the displayed row
looks similar—identity is a lifecycle decision.

## Attach the exit work to the boundary it describes

```fx-marble
title: ensuring and onExit forward values, then run terminal lifecycle work
covers: ensuring, onExit
input source: ^ a b | .
operator: ensuring(close) / onExit(recordExit)
inner lifecycle: . . . finalize |
output values: . a b . |
```

`ensuring` runs after every terminal outcome. `onExit` also sees the Exit so the callback can classify
completion, failure, or interruption. The source values are unchanged; final completion waits for the
lifecycle Effect. Use these for unconditional resource/reporting work at the source boundary.

```fx-marble
title: onInterrupt forwards prior values and runs cancellation cleanup only for interruption
covers: onInterrupt
input source: ^ a . x .
operator: onInterrupt(abort)
inner interruption lifecycle: . . . abort |
output values: . a . . x
```

`onInterrupt` is cancellation-only. It can observe a reported interruption or interruption of the
observing Fiber, so keep cleanup idempotent when both paths can reach the same action.

```fx-marble
title: onError forwards the original failure before starting failure-only cleanup
covers: onError
input source: ^ a . !offline . .
operator: onError(logCause)
inner error lifecycle: . . . . log |
output values: . a . !offline . .
```

`onError` forwards the original Cause first and runs its callback only if downstream failure delivery
succeeds. If the Sink interrupts while receiving the Cause, that hook may not run. Its callback has
no typed failure channel, but a callback defect can still affect the run. It is not a substitute for
an unconditional finalizer or for supervising the owning Effect's final outcome.

## Observe setup, delivery, and background failure separately

```fx-marble
title: withSpan adds trace lifetimes around an otherwise unchanged subscription
covers: withSpan
input source: ^ a b |
operator: withSpan("market monitor")
inner trace span: ^ . . |
inner delivery spans: . success(a) success(b) |
output values: . a b |
```

`withSpan` surrounds the subscription and creates child spans around downstream deliveries. A slow
setup, slow observer, and slow finalizer are different delays; the diagram places each within its
own lifetime instead of attributing all of them to the network.

For application infrastructure, `Fx.observeLayer` and `Fx.drainLayer` attach background subscriptions to
the Layer scope. Layer acquisition does not await the background Fiber's eventual exit. Decide how
source and observer failures are recovered or reported before installing that infrastructure.

Verify the monitor with acquisition/release counts: two ordinary observers should acquire twice;
two subscribers to one shared wrapper should acquire once while demand remains. Remove them one at
a time, then reenter the feature and expect a fresh acquisition. Exercise normal completion, failure,
and interruption while silent. Those checks verify the ownership promise that a value-only assertion
cannot. Continue with [Subject sharing](/explore/subject-event-publications) or
[Sink services](/explore/sink-writing-effects) for the public capability exposed to other features.
