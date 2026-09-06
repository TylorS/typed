---
title: "Building Fx values"
summary: "Start with the smallest constructor that matches your producer, then add typed failure, services, and cleanup where they actually exist."
section: "Fx"
kind: "guide"
order: 1.1
---

A status panel can show a computed label, request the server's status once, or remain subscribed to
changes. Those are different sources even when each emits a string. Pick a constructor that tells
the truth about when work starts, how many values may arrive, and how the work stops.

Read [Fx: work arrives](/explore/fx-push-reactivity) first. Here, every example builds a source and
leaves its execution with an Effect consumer; construction alone starts nothing.

## Capture a value or compute it when observed

[`Fx.succeed`](/reference/symbols/QHR5cGVkL2Z4L0Z4I3N1Y2NlZWQ) emits an existing value once.
`Fx.sync` computes a value once per subscription. A status panel's fixed label can use `succeed`;
a “requested at” timestamp should use `sync` if it means the time observation actually started.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const constant = Fx.succeed("ready");
const requestedAt = Fx.sync(() => new Date());

const program = Fx.collectAll(requestedAt).pipe(Effect.map(([date]) => date.toISOString()));
```

`succeed(new Date())` would capture construction time instead. This timing difference also applies
to reading a mutable configuration object or the current selection. A thrown exception in `sync`
is a defect; expected decoding failure belongs in `Effect.try`, lifted with `fromEffect`.

## Turn a finite batch into ordered delivery

A list of known workspace IDs can be delivered without inventing a callback protocol:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const ids = Fx.fromIterable(new Set(["ada", "grace", "barbara"]));
const program: Effect.Effect<ReadonlyArray<string>> = Fx.collectAll(ids);

const result = await Effect.runPromise(program);
```

`fromIterable` obtains an iterator per run and awaits each delivery before proceeding. `collectAll`
is safe here because the source completes. Be careful with an already-created generator iterator:
obtaining it again does not rewind it. If each run must enumerate from the beginning, construct the
iterator inside [lazy setup](/explore/fx-dynamic-producers).

## Make a cancelable one-shot request

Use Effect's HTTP client for requests. Its service selects the transport, and its typed errors
preserve request, status, and response-body failures:

```ts
import { Effect } from "effect";
import { FetchHttpClient, HttpClient, HttpClientError, HttpClientResponse } from "effect/unstable/http";
import { Fx } from "@typed/fx";

const request = HttpClient.get("https://example.com/api/status").pipe(
  // HTTP error statuses become typed failures before reading the body.
  Effect.flatMap(HttpClientResponse.filterStatusOk),
  Effect.flatMap((response) => response.text),
);

const response: Fx.Fx<string, HttpClientError.HttpClientError, HttpClient.HttpClient> =
  Fx.fromEffect(request);

const program = Fx.first(response).pipe(Effect.provide(FetchHttpClient.layer));
```

`FetchHttpClient.layer` provides the browser transport and connects Effect interruption to request
cancellation. The HTTP client requirement remains until that Layer is provided; errors remain in
the Effect's failure channel. `Fx.first` returns an Option, so successful absence and failure stay
distinct. For an application service, provide the client once at its Layer boundary.

`Fx.fail` constructs an expected failure directly; use `Fx.die` only for an unexpected invariant
violation. Use `Effect.tryPromise` when adapting a Promise API without an existing Effect service.

## Reuse an existing Stream or Effect clock

If a library already supplies an Effect Stream, keep its source contract and adapt it:

```ts
import { Effect, Stream } from "effect";
import { Fx } from "@typed/fx";

const source = Fx.fromStream(Stream.make(1, 2, 3));
const program = Fx.collectAll(source).pipe(
  Effect.map((values) => values.reduce((sum, value) => sum + value, 0)),
);
```

`fromStream` preserves errors, requirements, and finalizers. `toStream` is the reverse boundary for
an existing Stream consumer. Neither adapter starts work until its consumer runs.

For timed status updates, use Effect's clock rather than an unowned interval. `Fx.at(value, delay)`
emits once after a delay, `periodic(period)` emits `void` after each full period, and `fromSchedule`
uses a recurrence policy:

```ts
import { Effect, Fiber, Schedule } from "effect";
import * as TestClock from "effect/testing/TestClock";
import { Fx } from "@typed/fx";

const finiteTicks = Fx.fromSchedule(Schedule.recurs(2));

const test = Effect.gen(function* () {
  const fiber = yield* Effect.forkChild(Fx.collectUpTo(Fx.periodic("1 second"), 2));
  yield* TestClock.adjust("2 seconds");
  return yield* Fiber.join(fiber);
});
```

The test fragment forks a bounded observation, advances the test clock, and joins its result.
`Schedule.recurs(2)` produces two ticks through `fromSchedule`; it is not the same count as repeating
an initial source twice. [Time and rate](/explore/fx-time-and-rate) supplies a complete test and
explains debounce, throttle, and silence detection.

## Register the live browser boundary

A keyboard shortcut source has no natural last value. Its constructor must return the exact cleanup
for the listener installed by that subscription:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const keydowns: Fx.Fx<KeyboardEvent> = Fx.callback((emit) => {
  const onKeydown = (event: KeyboardEvent) => emit.succeed(event);

  document.addEventListener("keydown", onKeydown);
  return Effect.sync(() => document.removeEventListener("keydown", onKeydown));
});

const shortcuts = keydowns.pipe(
  Fx.filter((event) => event.metaKey && event.key === "k"),
  Fx.map(() => "open-search" as const),
);
```

The listener does not exist until observation starts. Closing that observation removes it.
`emit.succeed(event)` starts delivery and returns a Fiber; the browser does not await that Fiber.
Rapid callbacks can therefore overlap even if each observer does asynchronous work. A Subject or
explicit queue can serialize publications when the feature needs it; `callback` does not invent a
queue or backpressure mechanism.

A resourceful adapter has one further requirement: its connection must remain alive throughout
listener delivery, not only during registration:

```ts
import { Context, Effect } from "effect";
import { Fx } from "@typed/fx";

interface Connection {
  readonly listen: (f: (value: string) => void) => () => void;
  readonly close: Effect.Effect<void>;
}

interface Connections {
  readonly open: Effect.Effect<Connection>;
}

const Connections = Context.Service<Connections>("docs/Connections");

const messages: Fx.Fx<string, never, Connections> = Fx.genScoped(function* () {
  const connections = yield* Connections;
  const connection = yield* Effect.acquireRelease(connections.open, (open) => open.close);

  return Fx.callback<string>((emit) => {
    const stop = connection.listen((message) => emit.succeed(message));
    return Effect.sync(stop);
  });
});
```

`genScoped` encloses acquisition and the selected callback source. On exit, callback cleanup removes
the listener and the connection finalizer closes the handle. On acquisition failure, there is no
listener to install. On interruption while silent, both registered cleanups still run.

Test those three paths before relying on the adapter: first value with `take(1)`, acquisition
failure, and interruption before any value. A successful value assertion alone cannot reveal a
listener leak. Continue with [dynamic producers](/explore/fx-dynamic-producers) when configuration
selects the source, or [consumers](/explore/consuming-fx) to give a live source its owning execution.
