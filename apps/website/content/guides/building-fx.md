---
title: "Building Fx values"
summary: "Start with the smallest constructor that matches your producer, then add typed failure, services, and cleanup where they actually exist."
section: "Fx"
kind: "guide"
order: 1.1
---

Pick a constructor by what supplies the values and what ends the producer: existing data, a lazy
computation, an Effect or Stream, a clock, or a callback API. Empty and failure sources also let
you declare what a branch should do without inventing an event.

Read [Fx: work arrives](/explore/fx-push-reactivity) first. Here, every example builds a source and
leaves its execution with an Effect consumer; construction alone starts nothing.

Use the [Fx Marble Atlas](/explore/fx-operator-atlas) alongside this guide to compare source timelines.

| Start from | Constructor | Behavior when run |
| --- | --- | --- |
| An existing value | [`succeed`](#capture-a-value-or-compute-it-when-observed) | Emit once, then complete |
| A synchronous computation | [`sync`](#capture-a-value-or-compute-it-when-observed) | Compute and emit once per subscription |
| A producer selected lazily | [`suspend`](#defer-construction-of-the-producer-itself) | Construct and run the selected Fx per subscription |
| A batch | [`fromIterable`](#turn-a-finite-batch-into-ordered-delivery) | Deliver each item sequentially |
| An Effect or Stream | [`fromEffect`](#lift-an-existing-effect), [`fromStream`](#lift-an-existing-effect) | Preserve the adapted work's errors and services |
| Effectful producer selection | [`unwrap`](#run-setup-before-choosing-a-producer), [`gen`](#run-setup-before-choosing-a-producer), [`fn`](#run-setup-before-choosing-a-producer) | Run setup, then observe its returned Fx |
| Resourceful producer selection | [`unwrapScoped`](/explore/fx-dynamic-producers#keep-acquisition-alive-through-the-selected-producer), [`genScoped`](/explore/fx-dynamic-producers#keep-acquisition-alive-through-the-selected-producer) | Keep acquisition alive through the selected run |
| A clock or schedule | [`at`](#construct-a-source-from-time), [`periodic`](#construct-a-source-from-time), [`fromSchedule`](#construct-a-source-from-time) | Emit after a delay or according to a schedule |
| No values | [`empty`](#choose-no-output-an-explicit-value-or-a-failure), [`never`](#choose-no-output-an-explicit-value-or-a-failure) | Complete immediately, or remain open until interrupted |
| A known failure | [`fail`](#choose-no-output-an-explicit-value-or-a-failure), [`failCause`](#choose-no-output-an-explicit-value-or-a-failure), `fromFailures`, [`die`](#choose-no-output-an-explicit-value-or-a-failure), [`interrupt`](#choose-no-output-an-explicit-value-or-a-failure) | Report the appropriate Cause |
| A foreign callback or custom protocol | [`callback`](#register-the-live-browser-boundary), [`make`](#implement-a-producer-protocol-directly) | Bridge external events or drive a Sink directly |

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

## Defer construction of the producer itself

`sync` delays computing a value. `suspend` delays choosing or constructing an Fx. This is useful
when a producer contains an iterator that must be fresh for every subscription:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

function* values() {
  yield 1;
  yield 2;
}

const fresh = Fx.suspend(() => Fx.fromIterable(values()));

const first = await Effect.runPromise(Fx.collectAll(fresh));
const second = await Effect.runPromise(Fx.collectAll(fresh));

// Both runs receive [1, 2]. Neither consumes the other run's iterator.
```

The suspended callback runs once per subscription. Use it for lazy producer construction; use
`unwrap` when that selection itself is an Effect.

## Lift an existing Effect

`fromEffect` emits the Effect's success once and preserves its errors, service requirements, and
interruption behavior:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const decode = Effect.try({
  try: () => JSON.parse('{"ready":true}') as unknown,
  catch: () => "InvalidJson" as const,
});

const decoded: Fx.Fx<unknown, "InvalidJson"> = Fx.fromEffect(decode);

const program = Fx.collectAll(decoded);
```

Running `program` parses the text. Success produces a one-element array; invalid JSON fails the
Effect with `InvalidJson`. The adapter adds no retries or fallback. An Effect that requires an HTTP
client still requires that client after lifting; see the [fetch integration](/integrate/fetch-schema).

Adapt Promise APIs with `Effect.tryPromise` before lifting them. An existing Effect Stream has
its own adapter:

```ts
import { Stream } from "effect";
import { Fx } from "@typed/fx";

const stream = Stream.fromIterable([1, 2, 3]);
const source = Fx.fromStream(stream);

const program = Fx.collectAll(source);
```

`fromStream` retains the Stream's errors, requirements, and finalizers. `Fx.toStream` adapts in the
other direction. Neither conversion starts the producer by itself.

## Run setup before choosing a producer

`fromEffect` emits the Effect's result as a value. If that result is itself an Fx whose emissions
you want, use `unwrap`:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const chooseSource = Effect.sync(() => navigator.onLine ? Fx.succeed("online") : Fx.empty);
const status = Fx.unwrap(chooseSource);
```

`Fx.gen` expresses the same setup-and-return shape with yielded Effects. `Fx.fn` makes it a
reusable function with arguments; its generator runs when the returned Fx is observed. Yield setup
Effects, then return the producer—yielding is not how these generators publish values.

When setup acquires a resource needed by the returned producer, use `genScoped` or `unwrapScoped`
to keep that acquisition alive through observation. [Dynamic producers](/explore/fx-dynamic-producers)
works through these choices, including complete scoped acquisition.

## Construct a source from time

These sources put their clock and interruption under the running Effect:

```ts
import { Schedule } from "effect";
import { Fx } from "@typed/fx";

const readyLater = Fx.at("ready", "100 millis");
const heartbeat = Fx.periodic("1 second");
const twoTicks = Fx.fromSchedule(Schedule.recurs(2));
```

`at` emits its value once after the delay and completes. `periodic` emits `undefined` after each
period, including a wait before its first tick. `fromSchedule` emits `undefined` each time its
schedule fires; this finite schedule produces two ticks. Interrupting the run cancels waiting.
[Time and rate](/explore/fx-time-and-rate) shows how to compose timing and test it with TestClock.

## Choose no output, an explicit value, or a failure

No emission, an emitted empty value, and a source that remains open are distinct:

```ts
import { Fx } from "@typed/fx";

const noValues = Fx.empty;
const clearValue = Fx.null;
const completionPulse = Fx.void;
const waitUntilInterrupted = Fx.never;
```

`empty` completes without delivering a value. `null` delivers one `null`; `undefined` and `void`
deliver one `undefined`. Their long names are `succeedNull`, `succeedUndefined`, and `succeedVoid`.
`never` neither emits nor completes normally. Do not collect it while expecting a finite array.

Failure sources describe a different outcome:

```ts
import { Cause } from "effect";
import { Fx } from "@typed/fx";

const unavailable = Fx.fail("Unavailable" as const);
const preservedCause = Fx.failCause(Cause.fail("Unavailable" as const));
const invalidFields = Fx.fromFailures(["name", "email"]);
const invariantFailure = Fx.die(new Error("Invalid internal state"));
const cancelled = Fx.interrupt();
```

`fail` reports one expected error. `failCause` preserves an existing Cause, including its defects
or interruption. `fromFailures` combines an iterable of expected errors into one Cause; it consumes
that iterable at construction, even though delivery waits for a run. `die` represents a defect;
`interrupt` represents interruption rather than an expected domain failure. Use
[recovery](/explore/fx-errors-and-recovery) to decide what the surrounding workflow does afterward.

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

A callback owns only its listener. When it also needs an acquired connection, keep that resource
alive through selected observation with [`Fx.genScoped`](/explore/fx-dynamic-producers#keep-acquisition-alive-through-the-selected-producer).

## Implement a producer protocol directly

Use `make` when implementing a source that should drive the Sink itself. Unlike an external
callback, the returned Effect can await every delivery:

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

const pair = Fx.make<number>((sink) => Effect.gen(function* () {
  yield* sink.onSuccess(1);
  yield* sink.onSuccess(2);
}));

const program = Fx.collectAll(pair);
```

This run finishes after both deliveries finish. A producer's expected failures go through
`sink.onFailure`; keep acquisition and side effects inside the returned Effect. Prefer
`fromIterable([1, 2])` for an ordinary pair—the explicit protocol is useful when writing an adapter,
not required for application data. [Writing a Sink](/explore/sink-writing-effects) explains the
receiving side.

Continue with [dynamic producers](/explore/fx-dynamic-producers) when configuration selects the
source, or [consumers](/explore/consuming-fx) to give a live source its owning execution.
